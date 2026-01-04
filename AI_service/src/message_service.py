'''
This file defines the message service for sending and receiving messages via Kafka.

'''

import os
import json
from typing import Optional
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

from .models import GenerateLessonQuizCommand, LessonQuizGeneratedEvent

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
AI_INPUT_TOPIC = os.getenv("AI_INPUT_TOPIC", "ai.generate_lesson_quiz")
AI_OUTPUT_TOPIC = os.getenv("AI_OUTPUT_TOPIC", "ai.lesson_quiz_generated")
AI_CONSUMER_GROUP = os.getenv("AI_CONSUMER_GROUP", "ai_lesson_quiz_service_group")

# The partition key will be set as the formula: key_str = f"{lesson_id}_{course_id}"

def build_partition_key (course_id: str, lesson_id: str) -> bytes:
    key_str = f"{lesson_id}_{course_id}"
    return key_str.encode('utf-8')
    
async def create_producer(loop = None) -> AIOKafkaProducer:
    producer = AIOKafkaProducer(
        loop = loop,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    )
    await producer.start()
    return producer

async def create_consumer(loop = None) -> AIOKafkaConsumer:
    consumer = AIOKafkaConsumer(
        AI_INPUT_TOPIC,
        loop = loop,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        enable_auto_commit=True,
        group_id=AI_CONSUMER_GROUP,
        key_deserializer=lambda v: v.decode("utf-8") if v else None,
        value_deserializer=lambda v: v.decode("utf-8") if v else None,
    )
    await consumer.start()
    return consumer
    

def parse_generate_lesson_quiz_command(value: str) -> GenerateLessonQuizCommand:
    data = json.loads(value)
    print(data)
    command = GenerateLessonQuizCommand(**data)
    return command

    
async def send_lesson_quiz_generated_event(producer: AIOKafkaProducer, event: LessonQuizGeneratedEvent) -> None:
    key_bytes = build_partition_key (event.course_id or "", event.lesson_id)

    payload_dict = event.model_dump()
    value_bytes = json.dumps(payload_dict).encode('utf-8')
    await producer.send_and_wait(
        AI_OUTPUT_TOPIC,
        key=key_bytes,
        value=value_bytes
    )   
    

    

    