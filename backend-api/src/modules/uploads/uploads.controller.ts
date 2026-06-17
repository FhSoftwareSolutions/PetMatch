import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

/** Pasta de upload (em disco) e base pública para montar a URL retornada. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';

// Garante que a pasta exista antes do multer tentar gravar.
mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('uploads')
export class UploadsController {
  /** POST /uploads (multipart, campo "file") — salva a imagem e devolve { url }. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
          cb(null, `${randomBytes(12).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Apenas imagens são aceitas.'), false);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo ausente (campo "file").');
    return { url: `${PUBLIC_BASE_URL}/uploads/${file.filename}` };
  }
}
