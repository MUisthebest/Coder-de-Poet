import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { LessonsRepository } from './lessons.repository';
import { DatabaseModule } from '../../database/database.module';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { EnrolledGuard } from '../../common/guards/enrolled.guard';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiKafkaEventsController } from './Message/kafka.events';
import { QuizStore } from './store/quiz.store';
import { AiKafkaClient } from './Message/kafka.client';


const brokers =
  process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',') ?? ['localhost:9093'];


@Module({
  imports: [DatabaseModule, 
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'AI_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'course-service-producer',
            brokers,
          },
          consumer: {
            groupId: 'course_service_group-client',
          },
        }
      }
    ])
  ],
  controllers: [LessonsController, AiKafkaEventsController],
  providers: [LessonsService, LessonsRepository, EnrollmentsRepository, EnrolledGuard, AuthGuard, QuizStore, AiKafkaClient],
  exports: [LessonsService],
})
export class LessonsModule {}
