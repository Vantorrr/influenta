import { Controller, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';
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
  constructor(private readonly uploadsService: UploadsService) {}
  @Post('verification')
  @ApiOperation({ summary: 'Upload verification document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    }
  }))
  async uploadVerification(@UploadedFile() file: Express.Multer.File) {
    try {
      // Upload to ImgBB for persistence
      const url = await this.uploadsService.uploadToImgBB(file.buffer, file.originalname);
      console.log('✅ Verification document uploaded to ImgBB:', url);
      return { success: true, url };
    } catch (error) {
      console.error('❌ ImgBB upload failed for verification:', error);
      throw new Error('Failed to upload verification document');
    }
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
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
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    try {
      // Upload to ImgBB for persistence
      const url = await this.uploadsService.uploadToImgBB(file.buffer, file.originalname);
      console.log('✅ Avatar uploaded to ImgBB:', url);
      return { success: true, url };
    } catch (error) {
      console.error('❌ ImgBB upload failed for avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  @Post('platform-stats')
  @ApiOperation({ summary: 'Upload platform statistics screenshot' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    }
  }))
  async uploadPlatformStats(@UploadedFile() file: Express.Multer.File) {
    try {
      // Try ImgBB first
      const url = await this.uploadsService.uploadToImgBB(file.buffer, file.originalname);
      console.log('✅ Platform screenshot uploaded to ImgBB:', url);
      return { success: true, url };
    } catch (error) {
      console.error('❌ ImgBB upload failed, using local fallback:', error);
      
      // Fallback to local storage
      const dest = path.join(process.cwd(), 'uploads', 'platform-stats');
      ensureDir(dest);
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
      const filepath = path.join(dest, filename);
      fs.writeFileSync(filepath, file.buffer);
      
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/uploads/platform-stats/${filename}`;
      console.log('💾 Saved locally (temporary):', url);
      return { success: true, url };
    }
  }

  private getBaseUrl(): string {
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.match(/^https?:\/\//i) 
        ? process.env.BACKEND_URL 
        : `https://${process.env.BACKEND_URL}`;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    return `http://localhost:${process.env.PORT || 3001}`;
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









