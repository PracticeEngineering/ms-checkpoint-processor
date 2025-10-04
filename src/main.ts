import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  // No necesitamos que escuche en un puerto HTTP, pero lo dejamos por si se añade un health-check
  await app.listen(3000); 
  console.log('Checkpoint processor service is running and listening for Pub/Sub messages');
}
bootstrap();