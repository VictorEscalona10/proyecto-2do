import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,  }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/images/',
  });

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Documentación API con Scalar

  const config = new DocumentBuilder()
    .setTitle('Documentacion API')
    .setDescription('API para la gestión de la pasteleria Migdalis Tortas')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/reference',
    apiReference({
      content: document, // Pasas directamente el documento generado
      theme: 'purples',
    }),
  );

  // Puerto
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
