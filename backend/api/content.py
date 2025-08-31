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
    Checks user's usage against the free tier limit by calling a database function
    for atomicity. If the user is within the limit, it logs the new activity.
    If the limit is reached, it raises an HTTPException.
    Premium users are exempt from this check but their usage is still logged.
    """
    # This logic is now handled atomically by a database function
    # to prevent race conditions.
    try:
        # Note: You need to create the `can_and_log_activity` function in your
        # Supabase SQL editor. See the provided SQL snippet for its definition.
        params = {
            "p_user_id": str(current_user.id),
            "p_activity_type": activity_type,
            "p_topic": topic,
            "p_limit": FREE_TIER_LIMIT,
        }
        can_perform_activity = supabase.rpc("can_and_log_activity", params).execute().data

        if not can_perform_activity:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"You have reached the limit for free {activity_type} generations. Please upgrade to premium.",
            )
    except Exception as e:
        # A more specific exception catch would be better (e.g. PostgrestError).
        # logger.error(f"Error during usage check for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify usage limits.",
        )


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