import { Controller, Post, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
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
  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar (images only)' })
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
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Only image files are allowed (jpg, png, webp)') as any, false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const relative = `/uploads/avatars/${file.filename}`;

    let baseUrl: string;
    if (process.env.BACKEND_URL) {
      baseUrl = process.env.BACKEND_URL;
      if (!baseUrl.match(/^https?:\/\//i)) {
        baseUrl = `https://${baseUrl}`;
      }
    } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    } else {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers['host'] || req.get('host');
      baseUrl = host && host.includes('railway.app') ? `https://${host}` : `${proto}://${host || 'localhost:' + (process.env.PORT || 3001)}`;
    }
    baseUrl = baseUrl.replace(/([^:]\/)\/+/g, '$1');

    console.log('🖼️ Avatar upload:', { filename: file.filename, fullUrl: `${baseUrl}${relative}` });
    return { success: true, url: `${baseUrl}${relative}`, path: relative, filename: file.filename };
  }

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








