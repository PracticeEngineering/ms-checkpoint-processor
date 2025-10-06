
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionLoggerFilter } from './global-exception-logger.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { LOGGER_PROVIDER_TOKEN } from '../../logger/logger.constants';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'pino-logger';

describe('GlobalExceptionLoggerFilter', () => {
  let filter: GlobalExceptionLoggerFilter;
  let httpAdapterHost: HttpAdapterHost;
  let logger: PinoLogger;

  const mockHttpAdapter = {
    getRequestUrl: jest.fn(),
    reply: jest.fn(),
  };

  const mockRequest = {};
  const mockResponse = {};

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn().mockReturnValue(mockRequest),
    getResponse: jest.fn().mockReturnValue(mockResponse),
  } as unknown as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionLoggerFilter,
        {
          provide: HttpAdapterHost,
          useValue: {
            httpAdapter: mockHttpAdapter,
          },
        },
        {
          provide: LOGGER_PROVIDER_TOKEN,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionLoggerFilter>(GlobalExceptionLoggerFilter);
    httpAdapterHost = module.get<HttpAdapterHost>(HttpAdapterHost);
    logger = module.get<PinoLogger>(LOGGER_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const path = '/test';
      (mockHttpAdapter.getRequestUrl as jest.Mock).mockReturnValue(path);

      filter.catch(exception, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalled();
      expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          path,
        }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should handle non-HttpException', () => {
      const exception = new Error('Generic error');
      const path = '/test';
      (mockHttpAdapter.getRequestUrl as jest.Mock).mockReturnValue(path);

      filter.catch(exception, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalled();
      expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path,
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle non-Error exception', () => {
      const exception = 'just a string exception';
      const path = '/test';
      (mockHttpAdapter.getRequestUrl as jest.Mock).mockReturnValue(path);

      filter.catch(exception, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalled();
      expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path,
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });
});
