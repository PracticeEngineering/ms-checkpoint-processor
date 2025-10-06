
import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { PubSubPushDto, PubSubMessageDto } from './dtos';

describe('DTOs', () => {
  describe('PubSubMessageDto', () => {
    it('should fail validation if data is empty', async () => {
      const dto = new PubSubMessageDto();
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation if data is not empty', async () => {
      const dto = new PubSubMessageDto();
      dto.data = 'test';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('PubSubPushDto', () => {
    it('should fail validation if message is not an object', async () => {
      const dto = plainToClass(PubSubPushDto, { message: 'not an object' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation if message is invalid', async () => {
      const dto = plainToClass(PubSubPushDto, { message: { data: null } });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation if message is valid', async () => {
      const dto = plainToClass(PubSubPushDto, { message: { data: 'test' } });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
