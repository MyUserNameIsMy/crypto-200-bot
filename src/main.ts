import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseTimeMiddleware } from './common/middlewares/response-time.middleware';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(ResponseTimeMiddleware);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 4000);
}

bootstrap();
