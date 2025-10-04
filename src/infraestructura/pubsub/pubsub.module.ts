import { Module } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';
import { Provider } from '@nestjs/common';

export const PUBSUB_CLIENT = 'PubSubClient';

const pubsubProvider: Provider = {
  provide: PUBSUB_CLIENT,
  useFactory: () => {
    // Esta variable de entorno la definiremos en docker-compose.yml
    if (process.env.PUBSUB_EMULATOR_HOST) {
      console.log(`Conectando al emulador de Pub/Sub en: ${process.env.PUBSUB_EMULATOR_HOST}`);
      return new PubSub({
        apiEndpoint: process.env.PUBSUB_EMULATOR_HOST,
        projectId: 'local-project', // Un ID de proyecto dummy para el emulador
      });
    }
    // Si no está la variable, se conectará al Pub/Sub real de GCP (para producción)
    return new PubSub();
  },
};

@Module({
  providers: [pubsubProvider],
  exports: [pubsubProvider],
})
export class PubSubModule {}