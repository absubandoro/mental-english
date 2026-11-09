import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

config();

/**
 * Konfigurasi database bersama untuk aplikasi, seed, dan CLI migrasi TypeORM.
 * DB_SYNC=true  -> skema dibuat otomatis (khusus development)
 * DB_SYNC=false -> skema dikelola lewat migrasi di src/migrations (production)
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: process.env.DB_SYNC === 'true',
};

export default new DataSource(dataSourceOptions);
