import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './uploads/uploads';

async function bootstrap() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const app = await NestFactory.create(AppModule);
  // CORS_ORIGIN boleh berisi pola wildcard, mis. "https://*.produkanda.id,http://*.localhost:3000".
  // Di production website memanggil API lewat /api di domain yang sama, jadi CORS hanya dipakai saat pengembangan.
  const patterns = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://*.localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => new RegExp('^' + o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+') + '$', 'i'));
  app.enableCors({ origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => cb(null, !origin || patterns.some((p) => p.test(origin))), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT) || 4000;
  // Di server, HOST=127.0.0.1 agar API hanya bisa diakses lewat Nginx
  await app.listen(port, process.env.HOST || '0.0.0.0');
  console.log(`API berjalan di http://localhost:${port}`);
}
bootstrap();
