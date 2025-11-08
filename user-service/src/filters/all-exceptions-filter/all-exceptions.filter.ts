import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from 'src/ts/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    const status = isHttp ? 
      (exception as HttpException).getStatus() : 
      HttpStatus.INTERNAL_SERVER_ERROR;


    const rawResponse = isHttp ? (exception as HttpException).getResponse() : null;

    let message: string = (exception as any)?.message ?? 'Internal server error';
    let error: any = null;

    if(typeof rawResponse === 'string'){
      message = rawResponse;
    } else if(rawResponse && typeof rawResponse === 'object'){
      //rawResponse message: string | string[]
      const response: any = rawResponse;
      
      //check for message in response
      if(response.message !== undefined){
        message = Array.isArray(response.message) ? response.message.join(', ') : String(response.message);
      } else if ((exception as any).message){ // check for message in exception
        message = String((exception as any).message);
      }

      //set error: response.error | response.description | response.cause
      if(response.error !== undefined){
        error = response.error;
      } else if(response.description !== undefined){
        error = response.description;
      } else if(response.cause !== undefined){
        const c = response.cause;
        error = c instanceof Error ? c.message : String(c);
      }

    } else if(!isHttp && exception instanceof Error){
      // non-Http error
      message = exception.message;
      error = exception.stack;
    }

    const payload: ErrorResponse = {
      status: 'error',
      statusCode: status,
      message: message,
      error: error,
      timestamp: new Date().toISOString(),
      path: request.path
    }
    response
      .status(status)
      .json(payload);
  }
}
