import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';


const brokers = process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',') ?? ['localhost:9093'];


async function bootstrap() {
  console.log(process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule);
  
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
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();