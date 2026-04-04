import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import { Request, Response } from 'express';
import serverless from 'serverless-http';
import 'pg';
import { AppModule } from './app.module';
import { getRequiredEnv } from './config/env.config';

type ServerlessHandler = ReturnType<typeof serverless>;

let cachedServer: ServerlessHandler | null = null;

function configureSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const config = new DocumentBuilder()
    .setTitle('LifeDashboard API')
    .setDescription('The backend API for LifeDashboard app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/v1/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}

function configureApp(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: getRequiredEnv('FRONTEND_URL'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  configureSwagger(app);
}

async function createNestApp() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  configureApp(app);
  return app;
}

async function bootstrapServerless(): Promise<ServerlessHandler> {
  if (!cachedServer) {
    const app = await createNestApp();
    await app.init();
    cachedServer = serverless(app.getHttpAdapter().getInstance() as Express);
  }

  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrapServerless();
    return server(req, res);
  } catch (error) {
    console.error(
      '[VERCEL HANDLER ERROR] application failed to initialize:',
      error,
    );
    res.status(500).send(`Internal Server Error: ${String(error)}`);
  }
}

if (process.env.NODE_ENV !== 'production') {
  void (async () => {
    const app = await createNestApp();
    const port = Number(process.env.PORT ?? '3000');
    await app.listen(port);
    console.log(`[LOCAL BOOTSTRAP] Server running on http://localhost:${port}`);
  })();
}
