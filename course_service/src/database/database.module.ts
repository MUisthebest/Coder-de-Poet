import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';
export const AUTH_POOL = 'AUTH_POOL';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const connectionString = config.get<string>('DATABASE_URL');
        console.log('DATABASE_URL:', connectionString);

        if (!connectionString) {
          throw new Error('DATABASE_URL is not set');
        }

        // Neon bắt buộc SSL, sslmode=require đã có trong URL
        const pool = new Pool({
          connectionString,
          ssl: { rejectUnauthorized: false },
        });

        // log nhẹ để chắc chắn
        console.log('Connected to DB with', connectionString.split('@')[1]);

        return pool;
      },
    },
    {
      provide: AUTH_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const authDbUrl = config.get<string>('AUTH_DATABASE_URL');
        
        if (!authDbUrl) {
          console.warn('AUTH_DATABASE_URL not set, instructor names will not be available');
          return null;
        }

        const pool = new Pool({
          connectionString: authDbUrl,
          ssl: { rejectUnauthorized: false },
        });

        console.log('Connected to Auth DB');
        return pool;
      },
    },
  ],
  exports: [PG_POOL, AUTH_POOL],
})
export class DatabaseModule {}
