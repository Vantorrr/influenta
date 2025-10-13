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

  // Safe enum migration: ensure blogger categories enum contains 'humor'
  try {
    await dataSource.query(`
      DO $$
      DECLARE
        enum_type regtype;
        enum_type_name text;
        base_type_name text;
        need_value text := 'humor';
        has_value boolean;
      BEGIN
        -- bloggers.categories
        SELECT a.atttypid::regtype INTO enum_type
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'bloggers' AND a.attname = 'categories';

        IF enum_type IS NOT NULL THEN
          enum_type_name := enum_type::text;
          -- Remove [] from array type name to get base enum type
          base_type_name := regexp_replace(enum_type_name, '\\[\\]$', '');
          
          -- Check if value exists in base enum type
          SELECT EXISTS(
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = regexp_replace(base_type_name, '^.*\\.', '') -- remove schema if present
            AND e.enumlabel = need_value
          ) INTO has_value;
          
          IF NOT has_value THEN
            EXECUTE 'ALTER TYPE ' || base_type_name || ' ADD VALUE ' || quote_literal(need_value);
          END IF;
        END IF;

        -- listings.targetCategories
        SELECT a.atttypid::regtype INTO enum_type
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'listings' AND a.attname = 'targetCategories';

        IF enum_type IS NOT NULL THEN
          enum_type_name := enum_type::text;
          -- Remove [] from array type name to get base enum type
          base_type_name := regexp_replace(enum_type_name, '\\[\\]$', '');
          
          -- Check if value exists in base enum type
          SELECT EXISTS(
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = regexp_replace(base_type_name, '^.*\\.', '') -- remove schema if present
            AND e.enumlabel = need_value
          ) INTO has_value;
          
          IF NOT has_value THEN
            EXECUTE 'ALTER TYPE ' || base_type_name || ' ADD VALUE ' || quote_literal(need_value);
          END IF;
        END IF;
      END $$;
    `);
  } catch (e) {
    console.warn("Blogger categories enum migration skipped:", (e as any)?.message || e);
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

  // Create social_platforms table
  try {
    // Create platform type enum
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform_platform_enum') THEN
          CREATE TYPE social_platform_platform_enum AS ENUM (
            'telegram', 'instagram', 'youtube', 'tiktok', 'vk', 
            'twitter', 'facebook', 'twitch', 'linkedin', 'other'
          );
        END IF;
      END $$;
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS social_platforms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform social_platform_platform_enum NOT NULL,
        username VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        "subscribersCount" INTEGER DEFAULT 0,
        "pricePerPost" DECIMAL(10,2),
        "pricePerStory" DECIMAL(10,2),
        "pricePerReel" DECIMAL(10,2),
        "pricePerStream" DECIMAL(10,2),
        "statisticsScreenshots" JSONB DEFAULT '[]',
        "additionalInfo" JSONB,
        "isActive" BOOLEAN DEFAULT true,
        "isPrimary" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", platform)
      );
    `);

    // Create indexes
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_social_platforms_user ON social_platforms("userId");
      CREATE INDEX IF NOT EXISTS idx_social_platforms_platform ON social_platforms(platform);
      CREATE INDEX IF NOT EXISTS idx_social_platforms_active ON social_platforms("isActive");
    `);

    console.log('✅ Social platforms table created/verified');

    // Migrate existing telegram/instagram links to social platforms
    try {
      await dataSource.query(`
        INSERT INTO social_platforms (
          id, "userId", platform, username, url, "subscribersCount", 
          "pricePerPost", "pricePerStory", "isActive", "isPrimary", 
          "createdAt", "updatedAt"
        )
        SELECT 
          uuid_generate_v4(),
          u.id,
          'telegram'::social_platform_platform_enum,
          COALESCE(SUBSTRING(u."telegramLink" FROM '(?:t\.me/|telegram\.me/)([^/]+)'), u.username, 'channel'),
          u."telegramLink",
          COALESCE(u."subscribersCount", 0),
          u."pricePerPost",
          u."pricePerStory",
          true,
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM users u
        WHERE u."telegramLink" IS NOT NULL 
          AND u."telegramLink" != ''
          AND NOT EXISTS (
            SELECT 1 FROM social_platforms sp 
            WHERE sp."userId" = u.id AND sp.platform = 'telegram'
          )
      `);

      await dataSource.query(`
        INSERT INTO social_platforms (
          id, "userId", platform, username, url, "subscribersCount",
          "pricePerPost", "pricePerStory", "isActive", "isPrimary",
          "createdAt", "updatedAt"
        )
        SELECT 
          uuid_generate_v4(),
          u.id,
          'instagram'::social_platform_platform_enum,
          COALESCE(SUBSTRING(u."instagramLink" FROM '(?:instagram\.com/|instagr\.am/)([^/]+)'), 'profile'),
          u."instagramLink",
          COALESCE(u."subscribersCount", 0),
          u."pricePerPost",
          u."pricePerStory",
          true,
          false,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM users u
        WHERE u."instagramLink" IS NOT NULL 
          AND u."instagramLink" != ''
          AND NOT EXISTS (
            SELECT 1 FROM social_platforms sp 
            WHERE sp."userId" = u.id AND sp.platform = 'instagram'
          )
      `);

      console.log('✅ Migrated existing social links to platforms table');
    } catch (e) {
      console.warn('⚠️ Social links migration skipped:', (e as any)?.message || e);
    }
  } catch (e) {
    console.error('❌ Error creating social platforms table:', e);
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
  const avatarsDir = path.join(uploadsDir, 'avatars');
  const platformStatsDir = path.join(uploadsDir, 'platform-stats');
  
  // Ensure uploads directories exist
  if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
  }
  if (!require('fs').existsSync(verificationDir)) {
    require('fs').mkdirSync(verificationDir, { recursive: true });
  }
  if (!require('fs').existsSync(avatarsDir)) {
    require('fs').mkdirSync(avatarsDir, { recursive: true });
  }
  if (!require('fs').existsSync(platformStatsDir)) {
    require('fs').mkdirSync(platformStatsDir, { recursive: true });
  }
  
  console.log('📁 Uploads directory:', uploadsDir);
  console.log('📁 Verification directory:', verificationDir);
  console.log('📁 Avatars directory:', avatarsDir);
  console.log('📁 Platform stats directory:', platformStatsDir);
  
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
