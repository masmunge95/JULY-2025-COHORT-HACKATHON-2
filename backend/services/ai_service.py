import openai

from ..config import settings

# Configure the OpenAI client
openai.api_key = settings.OPENAI_API_KEY


async def generate_quiz_from_topic(topic: str) -> dict:
    """
    This is a placeholder for the actual AI call to generate a quiz.
    """
    print(f"Generating quiz for topic: {topic}")
    # Example response structure. Replace with actual OpenAI call.
    return {
        "topic": topic,
        "questions": [
            {
                "question_text": "What is the capital of France?",
                "options": ["Berlin", "Madrid", "Paris", "Rome"],
                "correct_answer": "Paris",
            }
        ],
    }


async def generate_flashcards_from_topic(topic: str) -> dict:
    """
    This is a placeholder for the actual AI call to generate flashcards.
    """
    print(f"Generating flashcards for topic: {topic}")
    # Example response structure. Replace with actual OpenAI call.
    return {"topic": topic, "flashcards": [{"front": "Capital of France", "back": "Paris"}]}