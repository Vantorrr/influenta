import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function filenameGenerator(req: any, file: any, cb: (error: Error | null, filename: string) => void) {
  const ext = path.extname(file.originalname || '');
  const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  cb(null, name);
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Post('verification')
  @ApiOperation({ summary: 'Upload verification document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'uploads', 'verification');
        ensureDir(dest);
        cb(null, dest);
      },
      filename: filenameGenerator,
    })
  }))
  async uploadVerification(@UploadedFile() file: Express.Multer.File) {
    const baseUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${process.env.PORT || 3001}`;
    const relative = `/uploads/verification/${file.filename}`;
    return { success: true, url: `${baseUrl}${relative}`, path: relative, filename: file.filename };
  }
}


