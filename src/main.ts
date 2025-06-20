import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  app.enableCors({
    origin: 'http://localhost:5173', // tu frontend
    credentials: true, // permite enviar cookies
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap()
