import { Injectable, UnauthorizedException, ExecutionContext } from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";

@Injectable()
export class JwtAuthGuarded extends AuthGuard('jwt'){
   handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    console.log('Guard err:', err?.message);
    console.log('Guard info:', info?.message || info);
    console.log('Auth header:', req.headers?.authorization);
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}