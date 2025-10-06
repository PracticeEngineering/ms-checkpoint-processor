import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PubSubMessageDto {
  @IsNotEmpty()
  data: string;
}

export class PubSubPushDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PubSubMessageDto)
  message: PubSubMessageDto;
}