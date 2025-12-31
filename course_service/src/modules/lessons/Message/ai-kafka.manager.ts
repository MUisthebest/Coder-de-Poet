import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import net from 'net';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { QuizStore } from '../store/quiz.store';
import type { GenerateLessonQuizCommand, LessonQuizGeneratedEvent } from '../dto/quiz.dto';

const execFileAsync = promisify(execFile);

@Injectable()
export class AiKafkaManager implements OnModuleDestroy {
  private readonly logger = new Logger(AiKafkaManager.name);

  private kafka = new Kafka({
    clientId: 'course-service',
    brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
    connectionTimeout: 3000,
    requestTimeout: 5000,
    retry: { retries: 0 },
  });

  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  private startingKafka: Promise<void> | null = null;
  private startingConsumer: Promise<void> | null = null;
  private connectingProducer: Promise<Producer> | null = null;

  constructor(private readonly quizStore: QuizStore) {}

  private tcpPing(host: string, port: number, timeoutMs: number) {
    return new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      const done = (ok: boolean) => {
        try { socket.destroy(); } catch {}
        resolve(ok);
      };
      socket.setTimeout(timeoutMs);
      socket.once('error', () => done(false));
      socket.once('timeout', () => done(false));
      socket.connect(port, host, () => done(true));
    });
  }

  private async ensureKafkaUp(): Promise<void> {
    if (this.startingKafka) return this.startingKafka;

    this.startingKafka = (async () => {
      if (await this.tcpPing('kafka', 9092, 500)) return;

      const cwd = process.env.COMPOSE_CWD || '/deploy';
      this.logger.warn(`Kafka is down. Starting via docker compose (cwd=${cwd})...`);

      await execFileAsync(
        'docker',
        ['compose', '--profile', 'kafka', 'up', '-d', 'zookeeper', 'kafka'],
        { cwd, env: process.env },
      );

      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        if (await this.tcpPing('kafka', 9092, 800)) {
          this.logger.log('Kafka is up.');
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      throw new Error('Kafka start timeout (60s)');
    })().finally(() => (this.startingKafka = null));

    return this.startingKafka;
  }

  private async getProducer(): Promise<Producer> {
    if (this.producer) return this.producer;
    if (this.connectingProducer) return this.connectingProducer;

    this.connectingProducer = (async () => {
      const p = this.kafka.producer();
      await p.connect();
      this.producer = p;
      this.logger.log('Kafka producer connected');
      return p;
    })().finally(() => (this.connectingProducer = null));

    return this.connectingProducer;
  }

  private async ensureConsumerRunning(): Promise<void> {
    if (this.consumer) return;
    if (this.startingConsumer) return this.startingConsumer;

    this.startingConsumer = (async () => {
      const c = this.kafka.consumer({ groupId: 'course_service_group-events' });
      await c.connect();
      await c.subscribe({ topic: 'ai.lesson_quiz_generated', fromBeginning: false });

      await c.run({
        eachMessage: async ({ message }) => {
          try {
            const payloadStr = message.value?.toString() || '';
            const event = JSON.parse(payloadStr) as LessonQuizGeneratedEvent;

            if (event.status === 'COMPLETED') {
              this.quizStore.set(event.lesson_id, {
                success: true,
                quizRaw: event.quiz_questions,
                tag: event.tag,
              });
            } else {
              this.quizStore.set(event.lesson_id, {
                success: false,
                error: 'Quiz generation failed',
              });
            }
          } catch (err) {
            this.logger.warn(`Failed to parse kafka message: ${String(err)}`);
          }
        },
      });

      this.consumer = c;
      this.logger.log('Kafka consumer running (ai.lesson_quiz_generated)');
    })().finally(() => (this.startingConsumer = null));

    return this.startingConsumer;
  }

  private buildPartitionKey(courseId: string, lessonId: string) {
    return `${lessonId}_${courseId}`;
  }

  async sendGenerateLessonQuizCommand(cmd: GenerateLessonQuizCommand): Promise<void> {
    // 1) ensure kafka containers up
    await this.ensureKafkaUp();

    // 2) ensure consumer running so long-poll can receive result
    await this.ensureConsumerRunning();

    // 3) send command
    const producer = await this.getProducer();
    const key = this.buildPartitionKey(cmd.course_id, cmd.lesson_id);

    await producer.send({
      topic: 'ai.generate_lesson_quiz',
      messages: [{ key, value: JSON.stringify(cmd) }],
    });

    this.logger.log(`Sent ai.generate_lesson_quiz course=${cmd.course_id}, lesson=${cmd.lesson_id}`);
  }

  async onModuleDestroy() {
    try { await this.consumer?.disconnect(); } catch {}
    try { await this.producer?.disconnect(); } catch {}
  }
}
