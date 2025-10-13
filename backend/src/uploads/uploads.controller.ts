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
    return this.handleFileUpload(file, req, 'verification');
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'uploads', 'avatars');
        ensureDir(dest);
        cb(null, dest);
      },
      filename: filenameGenerator,
    }),
    fileFilter: (req, file, cb) => {
      // Only allow images
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    }
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.handleFileUpload(file, req, 'avatars');
  }

  private handleFileUpload(file: Express.Multer.File, req: any, folder: string) {
    const relative = `/uploads/${folder}/${file.filename}`;
    
    let baseUrl: string;
    
    // 1. Сначала проверяем BACKEND_URL
    if (process.env.BACKEND_URL) {
      baseUrl = process.env.BACKEND_URL;
      // Убедимся что есть протокол
      if (!baseUrl.match(/^https?:\/\//i)) {
        baseUrl = `https://${baseUrl}`;
      }
    }
    // 2. Затем пробуем Railway domain
    else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    // 3. Если на Railway без явного домена - используем заголовки
    else {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers['host'] || req.get('host');
      
      if (host && host.includes('railway.app')) {
        // На Railway всегда HTTPS
        baseUrl = `https://${host}`;
      } else {
        baseUrl = `${proto}://${host || 'localhost:' + (process.env.PORT || 3001)}`;
      }
    }
    
    // Удаляем двойные слеши кроме как после протокола
    baseUrl = baseUrl.replace(/([^:]\/)\/+/g, '$1');
    
    console.log('📸 File upload:', {
      filename: file.filename,
      folder,
      baseUrl,
      fullUrl: `${baseUrl}${relative}`,
      headers: {
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'host': req.headers['host']
      }
    });
    
    return { success: true, url: `${baseUrl}${relative}`, path: relative, filename: file.filename };
  }
}









