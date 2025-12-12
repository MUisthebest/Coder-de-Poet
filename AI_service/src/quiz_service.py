"""
quiz_service.py
Generate quiz using Groq Flash 2.5 (OpenAI-compatible API).
"""

import json
from typing import List

from openai import OpenAI
from .models import Question, GenerateLessonQuizCommand
import logging
import re



logger = logging.getLogger(__name__)


# --- Groq LLM Client ---
client = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1",
)

SYSTEM_PROMPT = """
You are an AI assistant that generates **high-quality, advanced-level multiple-choice quizzes** for IT / programming lessons.

Your quizzes must be significantly more challenging than standard knowledge recall questions.

Rules for question design (VERY IMPORTANT):
- Use ONLY the provided transcript.
- Focus on deeper understanding: reasoning, application, debugging, architecture, trade-offs, design choices.
- Avoid trivial or basic fact questions.
- Every question should require the learner to **think**, not just remember.
- Prefer question types such as:
    • identify the best practice in a scenario  
    • identify the cause of an error  
    • choose the most optimal solution or design  
    • compare techniques or patterns  
    • evaluate trade-offs
- DO NOT ask yes/no questions.
- Each question must contain:
    - "question": a detailed, challenging scenario or conceptual question.
    - "options": array of 3–5 plausible answers (include at least 1 tricky distractor).
    - "correct_index": 0-based index of correct option.
- Language and difficulty must follow user metadata.
- Output MUST be valid JSON. No markdown, no commentary, no explanation.
- DO NOT wrap the JSON in ```json or any other code fences.
- DO NOT add text before or after the JSON.
"""



def _build_user_prompt(transcript: str, cmd: GenerateLessonQuizCommand) -> str:
    return f"""
Generate a quiz based strictly on this lesson transcript.

Metadata:
- Course ID: {cmd.course_id}
- Lesson ID: {cmd.lesson_id}
- Lesson name: {cmd.lesson_name}
- Language: {cmd.language}
- Difficulty: {cmd.difficulty}
- Number of questions: {cmd.num_questions}

Transcript:
\"\"\"{transcript}\"\"\"


Return ONLY JSON in exactly this structure:

{{
  "questions": [
    {{
      "question": "string",
      "options": ["A", "B", "C"],
      "correct_index": 0
    }}
  ]
}}
"""


def _safe_parse_json(raw_text: str) -> dict:
    """
    Parse JSON từ output của LLM một cách robust:
    - Bỏ ```json ... ``` nếu có.
    - Cắt từ { đầu tiên đến } cuối cùng.
    - Ném lỗi có log nếu vẫn parse không được.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response from LLM (no content to parse).")

    text = raw_text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()

    # 2. Lấy đoạn từ { đầu tiên đến } cuối cùng (phòng khi LLM vẫn trả thêm text linh tinh)
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace:last_brace + 1]
    else:
        candidate = text  # fallback

    try:
        return json.loads(candidate)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse JSON from LLM output: %s", repr(text))
        raise e


def generate_quiz_from_transcript(
    transcript: str,
    cmd: GenerateLessonQuizCommand
) -> List[Question]:
  

    user_prompt = _build_user_prompt(transcript, cmd)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.35,
        max_tokens=2048,
    )

    raw_text = (response.choices[0].message.content or "").strip()
    logger.info("LLM raw quiz response (first 500 chars): %s", raw_text[:500])

    data = _safe_parse_json(raw_text)
    questions_data = data.get("questions", []) or []

    questions: List[Question] = []
    for q in questions_data:
        try:
            questions.append(
                Question(
                    question=q["question"],
                    options=q["options"],
                    correct_index=q["correct_index"],
                )
            )
        except Exception as ex:
            logger.warning("Skip invalid question item %s, error=%s", q, ex)
            continue

    return questions[: cmd.num_questions]
