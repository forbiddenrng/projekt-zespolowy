import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): {status: string, service: string}{
    return {status: "ok", service: "user-service"};
  }
}
