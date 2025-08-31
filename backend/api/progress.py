from fastapi import APIRouter, Depends
from supabase import Client

from ..core.security import get_current_user
from ..core.dependencies import get_supabase_client
from ..models.models import User, QuizResultRequest

router = APIRouter()

@router.post("/track_quiz_result")
async def track_quiz_result(
    request: QuizResultRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Logs the result of a completed quiz to the user's history.
    """
    try:
        supabase.table('history').insert({
            "user_id": str(current_user.id),
            "topic": request.topic,
            "activity_type": "quiz",
            "score": request.score
        }).execute()

        # Example milestone: Award a milestone for the first perfect score
        if request.score == request.total_questions:
            # Check if this milestone already exists
            existing = supabase.table('milestones').select('id').eq('user_id', str(current_user.id)).eq('milestone_name', 'First Perfect Score').execute()
            if not existing.data:
                 supabase.table('milestones').insert({
                    "user_id": str(current_user.id),
                    "milestone_name": "First Perfect Score",
                    "description": f"Achieved a perfect score on the '{request.topic}' quiz!"
                }).execute()

        return {"message": "Quiz result tracked successfully."}
    except Exception as e:
        return {"error": str(e)}

@router.get("/dashboard_data")
async def get_dashboard_data(current_user: User = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)):
    history = supabase.table('history').select('*').eq('user_id', str(current_user.id)).order('created_at', desc=True).limit(10).execute()
    milestones = supabase.table('milestones').select('*').eq('user_id', str(current_user.id)).order('created_at', desc=True).execute()
    return {"history": history.data, "milestones": milestones.data, "user": current_user}