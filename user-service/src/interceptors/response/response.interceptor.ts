import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { SuccessResponse } from 'src/ts/types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((controllerData) =>{

        return {
          status: 'success',
          statusCode: controllerData.statusCode || 200,
          data: controllerData.data === undefined ? null : controllerData.data,
          message: controllerData.message || null,
        } as SuccessResponse<T>;
      } )
    )
  }
}
