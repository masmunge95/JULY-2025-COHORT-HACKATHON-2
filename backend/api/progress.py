from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import logging
from supabase import AsyncClient
from gotrue.types import User

from ..core.dependencies import get_supabase_client, get_current_user
from ..models.models import QuizResultRequest

router = APIRouter()
logger = logging.getLogger("uvicorn")

# --- Pydantic Models for API responses ---

class ProgressStats(BaseModel):
    quizzes_completed: int
    average_score: float
    flashcards_studied: int
    explanations_given: int
    discussions_had: int

class Milestone(BaseModel):
    milestone_name: str
    milestone_description: str
    achieved_at: str

# --- API Endpoints ---

@router.post("/track_quiz_result", status_code=201)
async def track_quiz_result(
    request: QuizResultRequest,
    current_user: User = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase_client)
):
    """
    Logs the result of a completed quiz, updates user progress, and checks for milestones.
    """
    try:
        # 1. Log the raw quiz activity to the history table
        await supabase.table('history').insert({
            "user_id": str(current_user.id),
            "topic": request.topic,
            "activity_type": "quiz",
            "score": request.score,
            "total_questions": request.total_questions
        }).execute()

        # 2. Update the aggregated user_progress table
        # This is a read-modify-write operation. For high concurrency, a database
        # function or trigger would be more robust.
        progress_res = await supabase.table('user_progress').select('*').eq('user_id', str(current_user.id)).eq('topic', request.topic).execute()
        
        if progress_res.data:
            # Update existing progress for this topic
            current_progress = progress_res.data[0]
            new_total_quizzes = current_progress.get('total_quizzes', 0) + 1
            # Calculate new weighted average score
            new_avg_score = ((current_progress.get('avg_score', 0) * current_progress.get('total_quizzes', 0)) + request.score) / new_total_quizzes
            await supabase.table('user_progress').update({
                'total_quizzes': new_total_quizzes,
                'avg_score': new_avg_score
            }).eq('id', current_progress['id']).execute()
        else:
            # Insert a new progress record for this topic
            await supabase.table('user_progress').insert({
                'user_id': str(current_user.id),
                'topic': request.topic,
                'total_quizzes': 1,
                'avg_score': request.score,
                'flashcards_studied': 0  # Default value
            }).execute()

        # 3. Check for and award a milestone for the first perfect score
        if request.score == request.total_questions:
            existing = await supabase.table('milestones').select('id').eq('user_id', str(current_user.id)).eq('milestone_name', 'First Perfect Score').execute()
            if not existing.data:
                 await supabase.table('milestones').insert({
                    "user_id": str(current_user.id),
                    "milestone_name": "First Perfect Score",
                    "milestone_description": f"Achieved a perfect score on the '{request.topic}' quiz!"
                }).execute()

        return {"message": "Quiz result tracked successfully."}
    except Exception as e:
        logger.error(f"Error tracking quiz result for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while tracking quiz result: {e}")

@router.get("/progress", response_model=ProgressStats)
async def get_user_progress_summary(
    current_user: User = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase_client)
):
    """
    Fetches and aggregates user progress across all topics.
    """
    try:
        query = supabase.table("user_progress").select("total_quizzes, avg_score, flashcards_studied").eq("user_id", str(current_user.id))
        response = await query.execute()
        data = response.data
        if not data:
            return ProgressStats(quizzes_completed=0, average_score=0.0, flashcards_studied=0, explanations_given=0, discussions_had=0)

        total_quizzes = sum(item.get('total_quizzes', 0) for item in data)
        flashcards_studied = sum(item.get('flashcards_studied', 0) for item in data)
        total_score_points = sum(item.get('avg_score', 0) * item.get('total_quizzes', 0) for item in data)
        total_quizzes_for_avg = sum(item.get('total_quizzes', 0) for item in data if item.get('avg_score') is not None)
        average_score = (total_score_points / total_quizzes_for_avg) if total_quizzes_for_avg > 0 else 0.0

        return ProgressStats(
            quizzes_completed=total_quizzes,
            average_score=round(average_score, 2),
            flashcards_studied=flashcards_studied,
            explanations_given=0,  # Placeholder
            discussions_had=0      # Placeholder
        )
    except Exception as e:
        logger.error(f"Error fetching progress for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching progress.")

@router.get("/milestones", response_model=List[Milestone])
async def get_user_milestones(
    current_user: User = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase_client)
):
    """
    Fetches all milestones achieved by the current user.
    """
    try:
        query = supabase.table("milestones").select("milestone_name, milestone_description, achieved_at").eq("user_id", str(current_user.id)).order("achieved_at", desc=True)
        response = await query.execute()
        return [Milestone(**item) for item in response.data]
    except Exception as e:
        logger.error(f"Error fetching milestones for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching milestones.")