import { Controller, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
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
  async uploadVerification(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const relative = `/uploads/verification/${file.filename}`;
    // Prefer explicit BACKEND_URL if provided and valid
    let baseUrl = process.env.BACKEND_URL;
    const ensureHttp = (u?: string) => (!u ? undefined : /^https?:\/\//i.test(u) ? u : `https://${u}`);
    if (!baseUrl) {
      // Railway domain without protocol
      baseUrl = ensureHttp(process.env.RAILWAY_PUBLIC_DOMAIN);
    }
    if (!baseUrl) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      const host = (req.headers['x-forwarded-host'] as string) || req.get?.('host') || `localhost:${process.env.PORT || 3001}`;
      baseUrl = `${proto}://${host}`;
    }
    return { success: true, url: `${baseUrl}${relative}`, path: relative, filename: file.filename };
  }
}





