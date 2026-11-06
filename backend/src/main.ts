import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './uploads/uploads';

async function bootstrap() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Mental English API berjalan di http://localhost:${port}`);
}
bootstrap();
