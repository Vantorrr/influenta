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

  // Create offers table if not exists
  try {
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status_enum') THEN
          CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
        END IF;
      END $$;
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "advertiserId" UUID NOT NULL,
        "bloggerId" UUID NOT NULL,
        message TEXT NOT NULL,
        "proposedBudget" DECIMAL(10,2) NOT NULL,
        status offer_status_enum DEFAULT 'pending',
        "projectTitle" VARCHAR(255),
        "projectDescription" TEXT,
        format VARCHAR(50),
        deadline TIMESTAMP,
        "rejectionReason" TEXT,
        "acceptedAt" TIMESTAMP,
        "rejectedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add foreign key constraints if they don't exist
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_offers_advertiser'
        ) THEN
          ALTER TABLE offers 
          ADD CONSTRAINT fk_offers_advertiser 
          FOREIGN KEY ("advertiserId") REFERENCES advertisers(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create indexes
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_advertiser ON offers("advertiserId");
      CREATE INDEX IF NOT EXISTS idx_offers_blogger ON offers("bloggerId");
      CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    `);

    console.log('✅ Offers table created/verified');
  } catch (e) {
    console.error('❌ Error creating offers table:', e);
  }

  // Create messages table if not exists
  try {
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        "chatId" VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Messages table created/verified');
  } catch (e) {
    console.error('❌ Error creating messages table:', e);
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
  const verificationDir = path.join(uploadsDir, 'verification');
  
  // Ensure uploads directories exist
  if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
  }
  if (!require('fs').existsSync(verificationDir)) {
    require('fs').mkdirSync(verificationDir, { recursive: true });
  }
  
  console.log('📁 Uploads directory:', uploadsDir);
  console.log('📁 Verification directory:', verificationDir);
  
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));
  await app.listen(port, '0.0.0.0'); // Railway требует 0.0.0.0

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation: http://localhost:${port}/api`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
