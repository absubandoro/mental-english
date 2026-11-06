import { BadRequestException, Controller, Module, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Auth } from '../common/auth';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
const ALLOWED = /\.(png|jpe?g|webp|gif)$/i;

@Controller('uploads')
export class UploadsController {
  constructor(private config: ConfigService) {}

  @Post()
  @Auth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        ALLOWED.test(file.originalname) ? cb(null, true) : cb(new BadRequestException('Hanya file gambar (png/jpg/webp/gif)'), false),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File wajib diisi');
    const base = this.config.get<string>('PUBLIC_URL') || '';
    return { url: `${base}/uploads/${file.filename}` };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
