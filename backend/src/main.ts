import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [process.env.APP_CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`AST API running on port ${port}`);
}

bootstrap();
