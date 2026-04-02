import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

const createHost = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { response, host };
};

describe('PrismaClientExceptionFilter', () => {
  let filter: PrismaClientExceptionFilter;

  beforeEach(() => {
    filter = new PrismaClientExceptionFilter();
  });

  it.each([
    ['P2002', HttpStatus.CONFLICT],
    ['P2025', HttpStatus.NOT_FOUND],
    ['P2003', HttpStatus.BAD_REQUEST],
  ])('maps %s to expected HTTP status', (code, status) => {
    const { response, host } = createHost();

    filter.catch({ code, message: 'Prisma error\nwith newline' } as any, host);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: status,
      message: 'Prisma errorwith newline',
    });
  });

  it('maps P1001 to service unavailable with generic message', () => {
    const { response, host } = createHost();

    filter.catch({ code: 'P1001', message: 'db down' } as any, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Database connection error',
    });
  });
});
