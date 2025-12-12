// src/lesson/Message/ai-kafka.client.ts

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { GenerateLessonQuizCommand } from '../dto/quiz.dto';

@Injectable()
export class AiKafkaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiKafkaClient.name);

  constructor(
    @Inject('AI_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) { }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('AI Kafka client connected');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('AI Kafka client disconnected');
  }

  /**
   * Partition key must match AI_service (Python):
   *   f"{lesson_id}_{course_id}"
   */
  private buildPartitionKey(courseId: string, lessonId: string): string {
    return `${lessonId}_${courseId}`;
  }

  /**
   * Send GenerateLessonQuizCommand to AI_service via Kafka.
   * Topic: ai.generate_lesson_quiz
   */
  async sendGenerateLessonQuizCommand(cmd: GenerateLessonQuizCommand): Promise<void> {
    const key = this.buildPartitionKey(cmd.course_id, cmd.lesson_id);
    this.logger.log(
      `Sending GenerateLessonQuizCommand course=${cmd.course_id}, lesson=${cmd.lesson_id}`,
    );

    this.kafkaClient.emit('ai.generate_lesson_quiz', {
      key,
      value: cmd,
    });
  }
}
