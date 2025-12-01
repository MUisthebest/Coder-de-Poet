import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

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
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
