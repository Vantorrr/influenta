import { Controller, Post, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UploadsService } from './uploads.service';

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
    storage: memoryStorage(), // Use memory storage for external upload
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    }
  }))
  async uploadVerification(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Helper to build absolute URL
    const getBaseUrl = () => {
      let baseUrl: string | undefined = process.env.BACKEND_URL;
      if (baseUrl) {
        if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
        return baseUrl;
      }
      if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers['host'] || req.get('host');
      return `${proto}://${host}`;
    };

    // Fallback local save
    const saveLocal = () => {
      const dest = path.join(process.cwd(), 'uploads', 'verification');
      ensureDir(dest);
      const ext = path.extname(file.originalname || '') || '.bin';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      fs.writeFileSync(path.join(dest, filename), file.buffer);
      const url = `${getBaseUrl()}/uploads/verification/${filename}`.replace(/([^:]\/)\/+/g, '$1');
      return { success: true, url };
    };

    // If image – try ImgBB first, then fallback locally
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      try {
        const url = await this.uploadsService.uploadToImgBB(file);
        return { success: true, url };
      } catch (error) {
        console.warn('ImgBB upload failed, saving locally. Error:', (error as any)?.message || error);
        return saveLocal();
      }
    }

    // Not an image – save locally
    return saveLocal();
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
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
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const url = await this.uploadsService.uploadToImgBB(file);
      return { success: true, url };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  @Post('platform-stats')
  @ApiOperation({ summary: 'Upload platform statistics screenshot' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      // Only allow images
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for screenshots
    }
  }))
  async uploadPlatformStats(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const url = await this.uploadsService.uploadToImgBB(file);
      return { success: true, url };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }
}













