"""
main.py

FastAPI application for the AI Service.

Responsibilities:
- Initialize Kafka producer/consumer on startup.
- Continuously consume `GenerateLessonQuizCommand` messages.
- For each message:
    1. Download video
    2. Generate transcript via Whisper
    3. Generate quiz via LLM
    4. Publish `LessonQuizGeneratedEvent` result back to Kafka.
"""

import asyncio
import logging
from typing import Optional
from fastapi import FastAPI

from .models import GenerateLessonQuizCommand, LessonQuizGeneratedEvent
from .message_service import (
    create_producer,
    create_consumer,
    parse_generate_lesson_quiz_command,
    send_lesson_quiz_generated_event,
)
from .transcript_service import download_video, transcribe_video, delete_video
from .quiz_service import generate_quiz_from_transcript


logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Service (Transcript + Quiz Generator)")

producer = None
consumer_task: Optional[asyncio.Task] = None


@app.on_event("startup")
async def startup_event():
    """
    Initialize Kafka components and start the consumer loop.
    """
    global producer, consumer_task
    loop = asyncio.get_event_loop()

    producer = await create_producer(loop)
    consumer = await create_consumer(loop)

    consumer_task = loop.create_task(consume_loop(consumer))
    logger.info("AI Service started — Kafka consumer loop running.")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Stop background tasks when shutting down.
    """
    global consumer_task

    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass

    logger.info("AI Service shutdown completed.")


@app.get("/health")
async def health_check():
    """Simple health check."""
    return {"status": "ok"}


async def consume_loop(consumer):
    """
    Kafka consumption pipeline:
    - Parse command
    - Download video
    - Generate transcript
    - Generate quiz
    - Publish event
    """
    logger.info("Kafka consumer loop started.")

    try:
        async for msg in consumer:
            raw_value = msg.value
            logger.info(
                f"[Kafka] Received message topic={msg.topic}, "
                f"partition={msg.partition}, offset={msg.offset}"
            )

            cmd: Optional[GenerateLessonQuizCommand] = None

            try:
                # 1. Parse command
                cmd = parse_generate_lesson_quiz_command(raw_value)

                # 2. Download video
                loop = asyncio.get_event_loop()
                video_path = await loop.run_in_executor(
                    None, download_video, cmd.video_url, cmd.lesson_name
                )

                # 3. Generate transcript
                transcript = await loop.run_in_executor(
                    None, transcribe_video, video_path, cmd.language
                )

                # 4. Generate quiz
                quiz_questions = generate_quiz_from_transcript(transcript, cmd)

                # 5. Build success event
                event = LessonQuizGeneratedEvent(
                    lesson_id=cmd.lesson_id,
                    course_id=cmd.course_id,
                    status="COMPLETED",
                    transcript=transcript,
                    quiz_questions=quiz_questions,
                )

            except Exception:
                logger.exception("Processing error.")
                event = LessonQuizGeneratedEvent(
                    lesson_id=cmd.lesson_id if cmd else "unknown",
                    course_id=cmd.course_id if cmd else None,
                    status="FAILED",
                )

            # 6. Publish event
            await send_lesson_quiz_generated_event(producer, event)

            # 7. Clean up downloaded video
            try:
                if 'video_path' in locals():
                    delete_video(video_path)
            except Exception:
                logger.warning("Failed to delete video file.", exc_info=True)

    except asyncio.CancelledError:
        logger.info("Consumer loop cancelled.")
    except Exception:
        logger.exception("Fatal error inside consumer loop.")
