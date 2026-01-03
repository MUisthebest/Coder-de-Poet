import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


const brokers = process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',') ?? ['localhost:9093'];


async function bootstrap() {
  console.log(process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule);
  
  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Course Service API')
    .setDescription('API for managing courses, lessons, quizzes, enrollments and more')
    .setVersion('1.0.0')
    .addTag('Courses', 'Course management endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Lessons', 'Lesson management endpoints')
    .addTag('Quizzes', 'Quiz management endpoints')
    .addTag('Enrollments', 'User enrollment endpoints')
    .addTag('Reviews', 'Course review endpoints')
    .addTag('Admin', 'Admin management endpoints')
    .addTag('Search', 'Search endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    //swaggerUrl: '/api/docs/swagger-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });
  
  // Cấu hình CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',    // backend origin
      'http://localhost:3001',    // frontend origin (React default)
      'http://localhost:5173',    // Vite default
      'http://localhost:8080',    // Common dev port
      process.env.FRONTEND_URL,   // từ biến môi trường
    ].filter(Boolean), // Lọc bỏ các giá trị undefined/null
    credentials: true, // Cho phép gửi cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  });
  
  // Thêm global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'course-service-consumer',
        brokers
      },
      consumer: {
        groupId: 'course_service_group-events', 
      },
    },
  });

  await app.startAllMicroservices();
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();