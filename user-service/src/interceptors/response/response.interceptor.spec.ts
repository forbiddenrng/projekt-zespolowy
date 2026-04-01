import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps controller payload into success envelope', async () => {
    const next: CallHandler = {
      handle: () =>
        of({
          statusCode: 201,
          message: 'User successfully created',
          data: { id: 7 },
        }),
    };

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, next),
    );

    expect(result).toEqual({
      status: 'success',
      statusCode: 201,
      data: { id: 7 },
      message: 'User successfully created',
    });
  });

  it('fills empty data and message defaults when controller did not provide them', async () => {
    const next: CallHandler = {
      handle: () =>
        of({
          statusCode: 200,
        }),
    };

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, next),
    );

    expect(result).toEqual({
      status: 'success',
      statusCode: 200,
      data: null,
      message: null,
    });
  });
});
