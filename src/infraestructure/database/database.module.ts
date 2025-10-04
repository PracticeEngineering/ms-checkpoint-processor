import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { databaseProvider, DB_CONNECTION } from './database.provider';
import { Pool } from 'pg';

@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
    // Inyectamos el 'Pool' que el 'databaseProvider' de este mismo módulo crea.
  constructor(@Inject(DB_CONNECTION) private readonly pool: Pool) {}
  async onApplicationShutdown(signal?: string) {
    console.log(`Cerrando pool de conexiones de la base de datos (Señal: ${signal})...`);
    await this.pool.end();
    console.log('Pool de conexiones de la base de datos cerrado exitosamente.');
  }
}