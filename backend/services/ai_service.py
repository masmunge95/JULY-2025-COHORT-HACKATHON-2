import json
from typing import Any, Dict, List, Literal

from fastapi import HTTPException, status
from groq import APIStatusError, AsyncGroq

from ..config import settings

# Initialize Groq client, assuming GROQ_API_KEY is in your settings
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None


async def _get_ai_response(
    prompt: str,
    response_format: Literal["text", "json_object"] = "text",
    model: str = "llama-3-13b-versatile",
) -> Any:
    """Generic function to get a response from the AI."""
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Check GROQ_API_KEY.",
        )

    system_prompt = "You are a helpful assistant."

    # Prepare creation parameters to avoid passing `None` for response_format
    create_params: Dict[str, Any] = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "model": model,
    }

    if response_format == "json_object":
        create_params["messages"][0]["content"] = (
            "You are a helpful assistant that always responds in valid JSON format as requested. "
            "Do not include any text, explanations, or markdown formatting before or after the JSON object."
        )
        create_params["response_format"] = {"type": "json_object"}

    try:
        chat_completion = await groq_client.chat.completions.create(**create_params)
        response_content = chat_completion.choices[0].message.content or ""

        if response_format == "json_object":
            return json.loads(response_content)
        return response_content

    except APIStatusError as e:
        # Forward the status code and a user-friendly message from the AI service
        status_code = e.status_code or 503
        detail = "The AI service is currently unavailable or experiencing issues. Please try again later."
        if status_code == 429:
            detail = "You have exceeded the rate limit for the AI service. Please try again later."
        raise HTTPException(status_code=status_code, detail=detail)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON.")
    except Exception as e:
        # Catch any other unexpected errors during communication
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while communicating with the AI service: {e}",
        )


def _extract_json_from_response(data: Dict[str, Any], root_key: str) -> Any:
    """Extracts the data from the expected root key in the AI's JSON response."""
    if isinstance(data, dict) and root_key in data:
        return data[root_key]
    # Handle cases where the model might return the list directly
    if root_key.endswith("s") and isinstance(data, list):
        return data
    raise HTTPException(
        status_code=500,
        detail=f"AI response did not contain the expected root key '{root_key}'.",
    )


async def generate_quiz_from_topic(topic: str) -> dict:
    """Generates a quiz with multiple-choice questions for a given topic."""
    prompt = f"""Generate a quiz with 5 multiple-choice questions for the topic '{topic}'.
You must respond with a single valid JSON object with a key "questions".
The value for "questions" must be a JSON array of 5 objects.
Each object must have keys: "question_text" (string), "options" (array of 4 strings), and "correct_answer" (string matching an option)."""
    json_response = await _get_ai_response(prompt, response_format="json_object")
    questions = _extract_json_from_response(json_response, "questions")
    return {"questions": questions}


async def generate_flashcards_from_topic(topic: str) -> dict:
    """Generates flashcards for a given topic."""
    prompt = f"""Generate 5 flashcards for the topic '{topic}'.
You must respond with a single valid JSON object with a key "flashcards".
The value for "flashcards" must be a JSON array of 5 objects.
Each object must have exactly two string keys: "question" and "answer"."""
    json_response = await _get_ai_response(prompt, response_format="json_object")
    flashcards = _extract_json_from_response(json_response, "flashcards")
    if not flashcards:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The AI could not generate flashcards for this topic. Please try a different or more specific one.",
        )
    return {"flashcards": flashcards}


async def generate_explanation_from_topic(topic: str) -> str:
    """Generates a detailed explanation for a given topic."""
    prompt = f"Provide a detailed, easy-to-understand explanation of the topic: '{topic}'. Structure it with a clear introduction, main body with key points, and a conclusion. Use paragraphs for readability."
    explanation = await _get_ai_response(prompt, response_format="text")
    return explanation


async def generate_discussion_from_topic(topic: str) -> dict:
    """Generates discussion points for a given topic."""
    prompt = f"""Generate 5 thought-provoking discussion points or open-ended questions for the topic '{topic}'.
You must respond with a single valid JSON object with a key "discussion_points".
The value for "discussion_points" must be a JSON array of 5 strings.

Example format:
{{
  "discussion_points": [
    "Point 1...",
    "Point 2..."
  ]
}}"""
    json_response = await _get_ai_response(prompt, response_format="json_object")
    points = _extract_json_from_response(json_response, "discussion_points")
    return {"discussion_points": points}