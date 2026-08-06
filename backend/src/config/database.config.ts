import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production', // В проде отключаем sync, чтобы не падать на enum
    dropSchema: false, // НЕ удаляем данные
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Устойчивость к перезапускам/паузам БД (Railway): не «умираем» навсегда
    // при кратком падении Postgres — переподключаемся, а не крашим бутстрап.
    retryAttempts: 20,
    retryDelay: 3000,
    extra: {
      // пул и таймауты, чтобы висящий коннект не блокировал процесс
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      keepAlive: true,
    },
  }),
);



