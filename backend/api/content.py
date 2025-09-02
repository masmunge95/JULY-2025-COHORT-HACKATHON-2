from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client, PostgrestAPIError

from ..core.security import get_current_user
from ..core.dependencies import get_supabase_client
from ..models.models import (
    User,
    TopicRequest,
    QuizResponse,
    FlashcardResponse,
    ExplanationResponse,
    DiscussionResponse,
)
from ..services import ai_service

router = APIRouter()

# Define constants for better maintainability
FREE_TIER_LIMIT = 5
ACTIVITY_QUIZ = "quiz"
ACTIVITY_FLASHCARD = "flashcard"
ACTIVITY_EXPLANATION = "explanation"
ACTIVITY_DISCUSSION = "discussion"


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
    except PostgrestAPIError as e:
        # Handle specific database errors from Supabase/PostgREST
        # logger.error(f"Database error during usage check for user {current_user.id}: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not verify usage limits due to a database error.",
        )
    except Exception as e:
        # Catch any other unexpected errors
        # logger.error(f"Unexpected error during usage check for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while verifying usage limits.",
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
    return FlashcardResponse(topic=request.topic, **flashcard_data)


@router.post("/generate_explanation", response_model=ExplanationResponse)
async def generate_explanation(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Generates a detailed explanation for a given topic.
    Free users have a limit.
    """
    _check_and_log_usage(supabase, current_user, request.topic, ACTIVITY_EXPLANATION)

    explanation_text = await ai_service.generate_explanation_from_topic(
        request.topic
    )
    return ExplanationResponse(topic=request.topic, explanation=explanation_text)


@router.post("/generate_discussion", response_model=DiscussionResponse)
async def generate_discussion_points(
    request: TopicRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Generates discussion points for a given topic.
    Free users have a limit.
    """
    _check_and_log_usage(supabase, current_user, request.topic, ACTIVITY_DISCUSSION)

    discussion_data = await ai_service.generate_discussion_from_topic(request.topic)
    return DiscussionResponse(topic=request.topic, **discussion_data)