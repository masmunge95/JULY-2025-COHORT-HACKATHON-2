from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..core.security import get_current_user
from ..core.dependencies import get_supabase_client
from ..models.models import User, TopicRequest, QuizResponse, FlashcardResponse
from ..services import ai_service

router = APIRouter()

@router.post("/generate_quiz", response_model=QuizResponse)
async def generate_quiz(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Generates a quiz for a given topic.
    Free users can generate a limited number of quizzes. Premium users have no limit.
    """
    if not current_user.is_premium:
        # Check usage for free users
        count_res = supabase.table('history').select('id', count='exact').eq('user_id', current_user.id).eq('activity_type', 'quiz').execute()
        if count_res.count >= 5:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="You have reached the limit for free quiz generations. Please upgrade to premium."
            )

    quiz_data = await ai_service.generate_quiz_from_topic(request.topic)
    return QuizResponse(**quiz_data)

@router.post("/generate_flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Generates flashcards for a given topic.
    Free users have a limit.
    """
    if not current_user.is_premium:
        count_res = supabase.table('history').select('id', count='exact').eq('user_id', current_user.id).eq('activity_type', 'flashcard').execute()
        if count_res.count >= 5:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="You have reached the limit for free flashcard generations. Please upgrade to premium."
            )
            
    flashcard_data = await ai_service.generate_flashcards_from_topic(request.topic)
    
    # Log the activity for the user
    supabase.table('history').insert({
        "user_id": str(current_user.id),
        "topic": request.topic,
        "activity_type": "flashcard"
    }).execute()

    return FlashcardResponse(**flashcard_data)