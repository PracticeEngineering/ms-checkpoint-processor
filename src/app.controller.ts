import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GrpcMethod } from '@nestjs/microservices';
import type { ICheckpointRepository } from './application/checkpoint.repository.interface';
import { CHECKPOINT_REPOSITORY } from './application/checkpoint.repository.interface';
import { Checkpoint } from './domain/checkpoint.entity';

@Controller()
export class AppController {
  constructor(
    @Inject(CHECKPOINT_REPOSITORY)
    private readonly checkpointRepository: ICheckpointRepository,
  ) {}

  @GrpcMethod('TrackingService', 'SendCheckpoint')
  async handleCheckpointReceived(@Payload() data: Checkpoint) {
    console.log('Evento de checkpoint recibido para procesar:', data);

    const newCheckpoint: Checkpoint = {
        ...data,
        timestamp: new Date(),
    };
    
    await this.checkpointRepository.save(newCheckpoint);
  }
}