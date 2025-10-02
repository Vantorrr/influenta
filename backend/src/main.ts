// Polyfills must be imported first
import './shims/crypto.polyfill';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  
  // Enable CORS
  const allowedOrigins = [
    configService.get('FRONTEND_URL') || 'http://localhost:3000',
    'https://influenta.vercel.app',
    'https://influenta-frontend.vercel.app',
    /https:\/\/.*\.vercel\.app$/,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Safe enum/data migration: ensure 'live', 'post_and_story', 'any' exist and replace reels->live
  try {
    await dataSource.query(`
      DO $$
      DECLARE
        enum_type regtype;
        enum_type_name text;
        need_value text;
        required_values text[] := ARRAY['live','post_and_story','any'];
        has_value boolean;
      BEGIN
        SELECT a.atttypid::regtype INTO enum_type
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'listings' AND a.attname = 'format';

        enum_type_name := enum_type::text;

        FOREACH need_value IN ARRAY required_values LOOP
          SELECT EXISTS(
            SELECT 1 FROM pg_enum WHERE enumlabel = need_value AND enumtypid = enum_type
          ) INTO has_value;
          IF NOT has_value THEN
            EXECUTE 'ALTER TYPE ' || enum_type_name || ' ADD VALUE ' || quote_literal(need_value);
          END IF;
        END LOOP;
      END $$;
    `);
    await dataSource.query(`UPDATE listings SET format = 'live' WHERE format IN ('reels','reel');`);
  } catch (e) {
    console.warn('Enum/data migration skipped:', (e as any)?.message || e);
  }

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Influencer Platform API')
    .setDescription('API для платформы взаимодействия блогеров и рекламодателей')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.PORT || '', 10) || configService.get<number>('app.port') || 3001;
  // Static for uploads without serve-static package
  const uploadsDir = path.join(process.cwd(), 'uploads');
  // Ensure uploads directory exists
  if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
  await app.listen(port, '0.0.0.0'); // Railway требует 0.0.0.0

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation: http://localhost:${port}/api`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
