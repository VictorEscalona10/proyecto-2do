import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import 'reflect-metadata';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuración importante: aumentar límite de tamaño
  app.useBodyParser('json', { limit: '10mb' }); // Para JSON (base64)
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  /* app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })); */

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/images/',
  });

  app.use(cookieParser());

  app.enableCors({
  origin: [
    'http://192.168.1.101:5173', 'http://localhost:5173', 'https://nebraska-cloud-theology-hottest.trycloudflare.com'
  ],
  credentials: true,
});

  // Documentación API
  const config = new DocumentBuilder()
    .setTitle('Documentacion API')
    .setDescription('API para la gestión de la pasteleria Migdalis Tortas')
    .setVersion('1.0')
    .build();

  // Añadir logging y manejo de errores para detectar problemas
  let document: any;
  try {
    console.log('Swagger: creando documento...');
    document = SwaggerModule.createDocument(app, config);
    console.log('Swagger: documento creado correctamente.');
  } catch (err) {
    console.error('Swagger createDocument error:', err);
    // continuar el arranque aunque falle la doc para poder depurar desde el navegador/consola
  }

  // Permitir 'unsafe-eval' solo en la ruta /reference (DESARROLLO)
  app.use('/reference', (req, res, next) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "font-src 'self' https://cdn.jsdelivr.net"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    next();
  });

  if (document) {
    try {
      app.use(
        '/reference',
        apiReference({
          content: document,
          theme: 'dark',
        }),
      );
      console.log('Scalar reference montado en /reference');
    } catch (err) {
      console.error('Error al montar Scalar apiReference:', err);
    }
  } else {
    console.warn('No se montó Scalar: documento Swagger no disponible.');
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`App escuchando en http://localhost:${port}`);
}
bootstrap();
