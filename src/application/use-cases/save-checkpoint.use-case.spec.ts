
import { Test, TestingModule } from '@nestjs/testing';
import { SaveCheckpointUseCase } from './save-checkpoint.use-case';
import { Itransaction, TRANSACTION } from '../ports/itransaction';
import { LOGGER_PROVIDER_TOKEN } from '../../infrastructure/logger/logger.constants';
import { ICheckpointRepository } from '../ports/icheckpoint.repository';
import { IShipmentRepository } from '../ports/ishipment.repository';
import { Shipment } from '../../domain/shipment.entity';
import { PinoLogger } from 'pino-logger';

describe('SaveCheckpointUseCase', () => {
  let useCase: SaveCheckpointUseCase;
  let transaction: Itransaction;
  let logger: PinoLogger;
  let shipmentRepository: IShipmentRepository;
  let checkpointRepository: ICheckpointRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveCheckpointUseCase,
        {
          provide: TRANSACTION,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LOGGER_PROVIDER_TOKEN,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SaveCheckpointUseCase>(SaveCheckpointUseCase);
    transaction = module.get<Itransaction>(TRANSACTION);
    logger = module.get<PinoLogger>(LOGGER_PROVIDER_TOKEN);

    shipmentRepository = {
      findByTrackingId: jest.fn(),
      updateStatus: jest.fn(),
      save: jest.fn(),
    };

    checkpointRepository = {
      save: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should save a checkpoint for an existing shipment', async () => {
      const trackingId = 'test-tracking-id';
      const shipment = new Shipment();
      shipment.id = 1;
      shipment.trackingId = trackingId;

      (shipmentRepository.findByTrackingId as jest.Mock).mockResolvedValue(shipment);
      (transaction.execute as jest.Mock).mockImplementation(async (fn) => {
        await fn({
          shipmentRepository,
          checkpointRepository,
        });
      });

      await useCase.execute({
        trackingId,
        status: 'in_transit',
        location: 'test_location',
      });

      expect(shipmentRepository.findByTrackingId).toHaveBeenCalledWith(trackingId);
      expect(checkpointRepository.save).toHaveBeenCalled();
      expect(shipmentRepository.updateStatus).toHaveBeenCalledWith(shipment.id, 'in_transit');
    });

    it('should not save a checkpoint for a non-existing shipment', async () => {
      const trackingId = 'non-existing-tracking-id';

      (shipmentRepository.findByTrackingId as jest.Mock).mockResolvedValue(null);
      (transaction.execute as jest.Mock).mockImplementation(async (fn) => {
        await fn({
          shipmentRepository,
          checkpointRepository,
        });
      });

      await useCase.execute({
        trackingId,
        status: 'in_transit',
        location: 'test_location',
      });

      expect(shipmentRepository.findByTrackingId).toHaveBeenCalledWith(trackingId);
      expect(checkpointRepository.save).not.toHaveBeenCalled();
      expect(shipmentRepository.updateStatus).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw an error if saving checkpoint fails', async () => {
      const trackingId = 'test-tracking-id';
      const shipment = new Shipment();
      shipment.id = 1;
      shipment.trackingId = trackingId;
      const error = new Error('DB error');

      (shipmentRepository.findByTrackingId as jest.Mock).mockResolvedValue(shipment);
      (checkpointRepository.save as jest.Mock).mockRejectedValue(error);

      (transaction.execute as jest.Mock).mockImplementation(async (fn) => {
        // This mock needs to simulate that the transaction fails when the inner function fails.
        // A real transaction would rollback and re-throw the error.
        try {
          await fn({
            shipmentRepository,
            checkpointRepository,
          });
        } catch (e) {
          throw e; // Re-throw the error to be caught by the test
        }
      });

      await expect(useCase.execute({
        trackingId,
        status: 'in_transit',
        location: 'test_location',
      })).rejects.toThrow(error);

      expect(shipmentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should save a checkpoint without a location', async () => {
      const trackingId = 'test-tracking-id';
      const shipment = new Shipment();
      shipment.id = 1;
      shipment.trackingId = trackingId;

      (shipmentRepository.findByTrackingId as jest.Mock).mockResolvedValue(shipment);
      (transaction.execute as jest.Mock).mockImplementation(async (fn) => {
        await fn({
          shipmentRepository,
          checkpointRepository,
        });
      });

      await useCase.execute({
        trackingId,
        status: 'in_transit',
      });

      expect(checkpointRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: 'in_transit',
        location: undefined,
        shipmentId: shipment.id,
      }));
    });
  });
});
