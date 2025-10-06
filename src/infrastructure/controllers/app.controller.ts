import { Controller, Post, Body, ValidationPipe, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { SaveCheckpointUseCase } from '../../application/use-cases/save-checkpoint.use-case';
import { PubSubPushDto } from '../controllers/dtos';

@Controller()
export class AppController {
  constructor(
    private readonly saveCheckpointUseCase: SaveCheckpointUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePubSubPush(@Body(new ValidationPipe()) body: PubSubPushDto) {
    try {
      console.log('Mensaje PUSH de Pub/Sub recibido.');
      
      const messageData = Buffer.from(body.message.data, 'base64').toString('utf-8');
      
      const checkpointData = JSON.parse(messageData);
      console.log('Datos del checkpoint decodificados:', checkpointData);

      await this.saveCheckpointUseCase.execute(checkpointData);
      
      return { status: 'success' };

    } catch (error) {
      console.error('Error procesando el mensaje PUSH de Pub/Sub:', error);
      // Si algo falla, lanzamos una excepción. Pub/Sub lo interpretará como un fallo
      // y reintentará el envío (o lo enviará a la DLQ después de 5 intentos).
      throw new BadRequestException('Could not process message');
    }
  }
}