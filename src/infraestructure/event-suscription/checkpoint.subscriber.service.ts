import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import { PUBSUB_CLIENT } from '../pubsub/pubsub.module';
import { SaveCheckpointUseCase } from '../../application/use-cases/save-checkpoint.use-case';

@Injectable()
export class CheckpointSubscriber implements OnModuleInit {
  private readonly topicName = 'checkpoints-topic';
  private readonly subscriptionName = 'checkpoints-subscription';

  constructor(
    @Inject(PUBSUB_CLIENT) private readonly pubsub: PubSub,
    // Inyectamos el caso de uso en lugar del repositorio
    private readonly saveCheckpointUseCase: SaveCheckpointUseCase,
  ) {}

  async onModuleInit() {
    await this.ensureTopicAndSubscription();
    this.listenForMessages();
  }

  private listenForMessages() {
    const subscription: Subscription = this.pubsub.subscription(this.subscriptionName);
    
    subscription.on('message', async (message: Message) => {
      try {
        const data = JSON.parse(message.data.toString());
        console.log('Mensaje de Pub/Sub recibido:', data);

        // Llamamos al caso de uso para que orqueste la lógica
        await this.saveCheckpointUseCase.execute(data);
        
        message.ack();
        console.log('Mensaje procesado y confirmado (ack).');
      } catch (error) {
        console.error('Error procesando el mensaje:', error);
        message.nack();
      }
    });

    console.log(`Escuchando mensajes en la suscripción: ${this.subscriptionName}`);
  }
  
  private async ensureTopicAndSubscription() {
    // Código para crear el tópico y la suscripción si no existen (solo para el emulador)
    const topic = this.pubsub.topic(this.topicName);
    const [topicExists] = await topic.exists();
    if (!topicExists) {
        await topic.create();
    }

    const subscription = topic.subscription(this.subscriptionName);
    const [subExists] = await subscription.exists();
    if (!subExists) {
        await subscription.create();
    }
  }
}