import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

const createHost = (path = '/users/me') => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = { path };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { response, request, host };
};

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('formats HttpException with description', () => {
    const { response, host } = createHost('/users');
    const exception = new BadRequestException('Validation failed', {
      description: 'phoneNumber must be a valid PL number',
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'phoneNumber must be a valid PL number',
        path: '/users',
      }),
    );
  });

  it('formats string HttpException response', () => {
    const { response, host } = createHost('/users/me');
    const exception = new HttpException('simple message', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'simple message',
        error: null,
      }),
    );
  });

  it('formats generic Error without exposing stack in production', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { response, host } = createHost('/users/1');

    try {
      filter.catch(new Error('unexpected failure'), host);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'unexpected failure',
        error: 'Internal server error',
        path: '/users/1',
      }),
    );
  });

  it('prefers explicit cause when HttpException response contains it', () => {
    const { response, host } = createHost('/users/languages');
    const exception = new HttpException(
      {
        message: ['invalid payload', 'duplicate language'],
        cause: new Error('language conflict'),
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'invalid payload, duplicate language',
        error: 'language conflict',
      }),
    );
  });
});
