from pydantic import BaseModel, Field, model_validator
from typing import List
import uuid

# --- User Models ---
class User(BaseModel):
    id: uuid.UUID
    email: str
    is_premium: bool = False

# --- Content Generation Models ---
class TopicRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=100,
        example="The Solar System",
        description="The topic for content generation, between 3 and 100 characters.",
    )

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=2, description="A list of possible answers, at least two.")
    answer: str

    @model_validator(mode="after")
    def check_answer_in_options(self) -> "QuizQuestion":
        """Ensures the provided answer is a valid option."""
        if self.answer not in self.options:
            raise ValueError("The correct answer must be one of the provided options.")
        return self

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]

# --- Progress Tracking Models ---
class QuizResultRequest(BaseModel):
    topic: str
    score: int = Field(..., ge=0, description="The number of correct answers.")
    total_questions: int = Field(..., gt=0, description="The total number of questions in the quiz.")

    @model_validator(mode="after")
    def check_score_not_greater_than_total(self) -> "QuizResultRequest":
        """Ensures the score is not higher than the total number of questions."""
        if self.score > self.total_questions:
            raise ValueError("Score cannot be greater than the total number of questions.")
        return self