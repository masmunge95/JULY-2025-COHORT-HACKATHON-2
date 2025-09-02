from typing import List
from uuid import UUID

from pydantic import BaseModel


class User(BaseModel):
    id: UUID
    email: str
    is_premium: bool = False


class TopicRequest(BaseModel):
    topic: str


class QuizQuestion(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str


class QuizResponse(BaseModel):
    topic: str
    questions: List[QuizQuestion]


class Flashcard(BaseModel):
    question: str
    answer: str


class FlashcardResponse(BaseModel):
    topic: str
    flashcards: List[Flashcard]


class ExplanationResponse(BaseModel):
    topic: str
    explanation: str


class DiscussionResponse(BaseModel):
    topic: str
    discussion_points: List[str]
