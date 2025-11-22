import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from 'src/ts/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttp
      ? (exception as HttpException).getResponse()
      : null;

    let message: string =
      (exception as any)?.message ?? 'Internal server error';
    let error: any = null;

    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      const resp: any = rawResponse;

      if (resp.message !== undefined) {
        message = Array.isArray(resp.message)
          ? resp.message.join(', ')
          : String(resp.message);
      }

      // set error: response.error | response.description | response.cause
      if (resp.error !== undefined) {
        error = resp.error;
      } else if (resp.description !== undefined) {
        error = resp.description;
      } else if (resp.cause !== undefined) {
        const c = resp.cause;
        error = c instanceof Error ? c.message : String(c);
      }
    } else if (!isHttp && exception instanceof Error) {
      // non-Http error
      message = exception.message;
      // do not expose stack in production
      error =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.stack;
    }

    const payload: ErrorResponse = {
      status: 'error',
      statusCode: status,
      message: message,
      error: error,
      timestamp: new Date().toISOString(),
      path: request.path,
    };
    
    response.status(status).json(payload);
  }
}
