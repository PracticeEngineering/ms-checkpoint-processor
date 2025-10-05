import { Provider } from '@nestjs/common';
import { Pool } from 'pg';

// Un token para inyectar el pool de conexiones
export const DB_CONNECTION = 'DbConnection';

export const databaseProvider: Provider = {
  provide: DB_CONNECTION,
  useFactory: async () => {
    const pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });
    // Devuelve el pool para que pueda ser inyectado en otros servicios
    return pool;
  },
};