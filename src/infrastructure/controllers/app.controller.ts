import { Controller, Post, Body, ValidationPipe, BadRequestException, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { SaveCheckpointUseCase } from '../../application/use-cases/save-checkpoint.use-case';
import { PubSubPushDto } from '../controllers/dtos';
import { LOGGER_PROVIDER_TOKEN } from '../../infrastructure/logger/logger.constants';
import type { Logger } from 'pino';

@Controller()
export class AppController {
  private readonly context = AppController.name;

  constructor(
    private readonly saveCheckpointUseCase: SaveCheckpointUseCase,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger, // <-- 1. Inyectar Logger
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePubSubPush(@Body(new ValidationPipe()) body: PubSubPushDto) {
    this.logger.info(`[${this.context}] Pub/Sub PUSH message received.`);
    
    try {
      const messageData = Buffer.from(body.message.data, 'base64').toString('utf-8');
      const checkpointData = JSON.parse(messageData);

      this.logger.info({ checkpointData }, `[${this.context}] Decoded checkpoint data.`);

      await this.saveCheckpointUseCase.execute(checkpointData);
      
      return { status: 'success' };

    } catch (error) {
      this.logger.error(
        { err: error },
        `[${this.context}] Error processing Pub/Sub PUSH message.`,
      );
      throw new BadRequestException('Could not process message');
    }
  }
}