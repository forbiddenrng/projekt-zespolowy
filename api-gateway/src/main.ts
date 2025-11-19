import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.useLogger(['error', 'warn', 'debug', 'log'])
  app.use((req: any, _res: any, next: any) => {
    const auth = req.headers?.authorization;
    console.log('Auth header present:', !!auth);
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      console.log('Token preview:', token.substring(0, 50) + '...');
      try {
        const payloadPart = token.split('.')[1];
        const json = Buffer.from(payloadPart, 'base64').toString('utf8');
        const payload = JSON.parse(json);
        console.log('JWT iss:', payload.iss);
        console.log('JWT aud:', payload.aud);
        console.log('JWT scope:', payload.scope);
      } catch (e: any) {
        console.log('JWT decode error:', e.message);
      }
    }
    next();
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
