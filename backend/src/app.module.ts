import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { StatsModule } from './stats/stats.module';
import { ResponsesModule } from './responses/responses.module';
import { BloggersModule } from './bloggers/bloggers.module';
import { ListingsModule } from './listings/listings.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import { SeedModule } from './seed/seed.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    // Инициализацию БД делаем условной, чтобы сервер стартовал даже без DATABASE_URL
    ...(process.env.DATABASE_URL
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              ...configService.get('database'),
            }),
          }),
        ]
      : []),
    ChatModule,
    AdminModule,
    TelegramModule,
    AuthModule,
    StatsModule,
    ResponsesModule,
    BloggersModule,
    ListingsModule,
    SeedModule,
    AnalyticsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
