// Polyfills must be imported first
import './shims/crypto.polyfill';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Run migrations on startup (add reels to enum if needed)
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const migrationSQL = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'reels' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listings_format_enum')
          ) THEN
            ALTER TYPE listings_format_enum ADD VALUE 'reels';
          END IF;
        END
        $$;
      `;
      await pool.query(migrationSQL);
      await pool.end();
      console.log('✅ Migration: reels added to listings_format_enum');
    } catch (err) {
      console.warn('⚠️ Migration warning (likely already applied):', err.message);
    }
  }
  
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
