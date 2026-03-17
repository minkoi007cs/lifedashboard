import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import serverlessExpress from 'serverless-http';

let cachedServer: any;

async function bootstrap() {
  console.log('[NESTJS BOOTSTRAP] Starting bootstrap process...');
  if (!cachedServer) {
    console.log('[NESTJS BOOTSTRAP] cachedServer is undefined. Creating new Nest application context...');
    try {
      const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug'],
      });
      console.log('[NESTJS BOOTSTRAP] Nest application context created successfully.');

      // Global prefix for API versioning
      app.setGlobalPrefix('api/v1');

      // Enable CORS for frontend
      app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      });

      // Global validation pipe
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
      }));

      // Setup Swagger Api
      console.log('[NESTJS BOOTSTRAP] Configuring Swagger UI...');
      const config = new DocumentBuilder()
        .setTitle('LifeDashboard API')
        .setDescription('The backend API for LifeDashboard app')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const documentFactory = () => SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/v1/docs', app, documentFactory);
      console.log('[NESTJS BOOTSTRAP] Swagger UI generated.');

      console.log('[NESTJS BOOTSTRAP] Calling app.init()...');
      await app.init();
      console.log('[NESTJS BOOTSTRAP] app.init() complete.');

      const expressApp = app.getHttpAdapter().getInstance();
      cachedServer = serverlessExpress(expressApp);
      console.log('[NESTJS BOOTSTRAP] serverlessExpress wrapper created successfully.');
    } catch (e) {
      console.error('[NESTJS BOOTSTRAP ERROR] application failed to initialize:', e);
      throw e;
    }
  } else {
    console.log('[NESTJS BOOTSTRAP] cachedServer already exists, skipping initialization.');
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  console.log(`[VERCEL HANDLER] Incoming Request: ${req.method} ${req.url}`);
  try {
    const server = await bootstrap();
    console.log('[VERCEL HANDLER] Bootstrap complete, forwarding request to server...');
    return server(req, res);
  } catch (error) {
    console.error('[VERCEL HANDLER ERROR] CRITICAL CRASH:', error);
    res.statusCode = 500;
    res.end('Internal Server Error: ' + String(error));
  }
}
