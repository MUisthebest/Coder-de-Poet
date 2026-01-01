// src/lesson/Message/ai-kafka.events.ts

import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import type { LessonQuizGeneratedEvent } from "../dto/quiz.dto";
import { QuizStore } from '../store/quiz.store';

@Controller()
export class AiKafkaEventsController {
  private readonly logger = new Logger(AiKafkaEventsController.name);
  constructor(private readonly quizStore: QuizStore) { }


  /**
   * Consume LessonQuizGeneratedEvent from AI_service.
   * Logs full message details.
   * Pause Kafka after receiving message for saving resources.
   */
  @EventPattern('ai.lesson_quiz_generated')
  async handleLessonQuizGenerated(
    @Payload() event: LessonQuizGeneratedEvent,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log('Raw event type: ' + typeof event);
    this.logger.log('Raw event: ' + JSON.stringify(event, null, 2));
    const kafkaMsg = context.getMessage();

    const key = kafkaMsg.key?.toString();
    const partition = context.getPartition();
    const offset = kafkaMsg.offset;
    const timestamp = kafkaMsg.timestamp;

    this.logger.log(
      '\n RECEIVED Kafka Message from AI Service\n' +
      `  • Topic: ai.lesson_quiz_generated\n` +
      `  • Partition: ${partition}\n` +
      `  • Offset: ${offset}\n` +
      `  • Timestamp: ${timestamp}\n` +
      `  • Key: ${key}\n` +
      `  • Payload:\n${JSON.stringify(event, null, 2)}\n` +
      '----------------------------------------',
    );

    if (event.status === 'COMPLETED') {
      // Store the generated quiz in memory store
      console.log("Quiz generation completed for lesson_id: " + event.lesson_id);
      this.quizStore.set(event.lesson_id, {
        success: true,
        quizRaw: event.quiz_questions,
        tag: event.tag
      });
    } else {
      this.quizStore.set(event.lesson_id, {
        success: false,
        error: 'Quiz generation failed'
      });
    }

  }

  getQuizResult(lessonId: string) {
    return this.quizStore.get(lessonId);
  }
}
