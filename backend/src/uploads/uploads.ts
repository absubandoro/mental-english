import { BadRequestException, Controller, Module, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Auth, AuthUser, CurrentUser } from '../common/auth';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
export const MAX_IMAGE_MB = 8;
export const MAX_VIDEO_MB = 100;

@Controller('uploads')
export class UploadsController {
  constructor(private config: ConfigService) {}

  /** Unggah 1 file gambar (maks. 8 MB) atau video (maks. 100 MB) */
  @Post()
  @Auth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        // Dipisah per organisasi: uploads/<organizationId>/<file>
        destination: (req, _file, cb) => {
          const dir = join(UPLOAD_DIR, (req.user as AuthUser).organizationId);
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        IMAGE.test(file.originalname) || VIDEO.test(file.originalname)
          ? cb(null, true)
          : cb(new BadRequestException('Hanya gambar (png/jpg/webp/gif) atau video (mp4/webm/mov)'), false),
    }),
  )
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File wajib diisi');
    const type = VIDEO.test(file.originalname) ? 'video' : 'image';
    if (type === 'image' && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      unlinkSync(file.path);
      throw new BadRequestException(`Ukuran gambar maksimal ${MAX_IMAGE_MB} MB`);
    }
    const base = this.config.get<string>('PUBLIC_URL') || '';
    return { url: `${base}/uploads/${user.organizationId}/${file.filename}`, type, name: file.originalname, size: file.size };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
