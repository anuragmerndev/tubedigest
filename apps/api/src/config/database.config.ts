import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
    },
  }),
);
