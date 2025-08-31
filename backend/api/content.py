from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..core.security import get_current_user
from ..core.dependencies import get_supabase_client
from ..models.models import User, TopicRequest, QuizResponse, FlashcardResponse
from ..services import ai_service

router = APIRouter()

# Define constants for better maintainability
FREE_TIER_LIMIT = 5
ACTIVITY_QUIZ = "quiz"
ACTIVITY_FLASHCARD = "flashcard"


def _check_and_log_usage(
    supabase: Client, current_user: User, topic: str, activity_type: str
):
    """
    Checks user's usage against the free tier limit.
    If the user is within the limit, it logs the new activity.
    If the limit is reached, it raises an HTTPException.
    Premium users are exempt from this check.
    """
    if current_user.is_premium:
        return  # Premium users have unlimited access

    # 1. Check current usage
    count_res = (
        supabase.table("history")
        .select("id", count="exact")
        .eq("user_id", current_user.id)
        .eq("activity_type", activity_type)
        .execute()
    )

    if count_res.count >= FREE_TIER_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"You have reached the limit for free {activity_type} generations. Please upgrade to premium.",
        )

    # 2. Log the new activity *before* the expensive AI call to be more robust
    supabase.table("history").insert(
        {
            "user_id": str(current_user.id),
            "topic": topic,
            "activity_type": activity_type,
        }
    ).execute()


@router.post("/generate_quiz", response_model=QuizResponse)
async def generate_quiz(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Generates a quiz for a given topic.
    Free users can generate a limited number of quizzes. Premium users have no limit.
    """
    _check_and_log_usage(supabase, current_user, request.topic, ACTIVITY_QUIZ)

    quiz_data = await ai_service.generate_quiz_from_topic(request.topic)
    return QuizResponse(**quiz_data)


@router.post("/generate_flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Generates flashcards for a given topic.
    Free users have a limit.
    """
    _check_and_log_usage(supabase, current_user, request.topic, ACTIVITY_FLASHCARD)

    flashcard_data = await ai_service.generate_flashcards_from_topic(request.topic)
    return FlashcardResponse(**flashcard_data)