import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import 'pg';
import { AppModule } from './app.module';

let cachedServer: Express | null = null;

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
    {
      customfavIcon: '/favicon.ico',
      customSiteTitle: 'LifeDashboard API Docs',
    },
  );
}

function configureApp(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  // Security headers — CSP disabled so Swagger UI (inline scripts) still works
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix('api/v1');
  // Production: web + API cùng domain (life.minkoi.org) nên không cần CORS.
  // Local: web chạy cổng 5173 gọi API cổng 3000.
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({ origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/ });
  }
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

// 15 s — gives the DB connection room to complete on cold start while still
// returning a descriptive 500 before Vercel's 20 s hard limit kills the function.
const BOOTSTRAP_TIMEOUT_MS = 15_000;

async function bootstrapServerless(): Promise<Express> {
  if (!cachedServer) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutGuard = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new Error(
            `Bootstrap timed out after ${BOOTSTRAP_TIMEOUT_MS / 1000}s. ` +
              'Ensure DB_SYNCHRONIZE=false and verify Supabase pooler connectivity.',
          ),
        );
      }, BOOTSTRAP_TIMEOUT_MS);
    });

    const app = await Promise.race([createNestApp(), timeoutGuard]);
    clearTimeout(timer);
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance() as Express;
  }

  return cachedServer;
}

export function invokeExpressServer(
  server: Express,
  req: Request,
  res: Response,
) {
  return server(req, res, ((error?: unknown) => {
    if (error) {
      console.error('[VERCEL HANDLER ERROR] express pipeline failed:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  }) as NextFunction);
}

export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrapServerless();
    return invokeExpressServer(server, req, res);
  } catch (error) {
    console.error(
      '[VERCEL HANDLER ERROR] application failed to initialize:',
      error,
    );
    res.status(500).send('Internal Server Error');
  }
}

export async function bootstrapLocalServer() {
  const app = await createNestApp();
  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  console.log(`[LOCAL BOOTSTRAP] Server running on http://localhost:${port}`);
}

if (require.main === module) {
  void bootstrapLocalServer();
}
