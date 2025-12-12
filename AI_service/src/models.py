'''
    This file difines the schema for message transmission between services via Kafka.
'''

from pydantic import BaseModel, HttpUrl, Field
import random
from typing import List, Optional
from enum import Enum


class Question (BaseModel):
    question: str = None
    options: List[str] = []
    correct_index: int = None


class GenerateLessonQuizCommand (BaseModel):
    lesson_id: str
    course_id: str
    lesson_name: str
    video_url: HttpUrl
    language: str ="en"  # Default to English
    num_questions: int = Field(default_factory=lambda: random.randint(8, 12))
    
    difficulty: str = "medium"  # "easy", "medium", "hard"
    question_type : List[str] = ["multiple_choice", "true_false"]  # "multiple_choice", "true_false"
    #source_type: str 


class LessonQuizGeneratedEvent (BaseModel):
    lesson_id: str
    course_id: Optional[str] = None
    status: str # "COMPLETED" or "FAILED
    transcript: Optional[str] = None
    quiz_questions: Optional[List[Question]] = None


