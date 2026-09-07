import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The Next.js app sends the JWT in an httpOnly cookie, so the browser must be
  // allowed to attach credentials to cross-origin requests.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // One pipe for the whole app: every request body is checked against its DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties that no DTO field declares.
      whitelist: true,
      // ...and reject the request outright if such properties were sent.
      forbidNonWhitelisted: true,
      // Turn plain JSON into real DTO class instances (needed for @Type()).
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
