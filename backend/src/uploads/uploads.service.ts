import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import fetch from 'node-fetch';

@Injectable()
export class UploadsService {
  private readonly imgbbApiKey = process.env.IMGBB_API_KEY || '5c3a7e95496f3e3b7d8e4c8f3a2e1b9d';

  async uploadToImgBB(buffer: Buffer, filename: string): Promise<string> {
    console.log('📤 Uploading to ImgBB:', { filename, size: buffer.length, hasKey: !!this.imgbbApiKey });
    
    try {
      const form = new FormData();
      form.append('image', buffer.toString('base64'));
      form.append('name', filename);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`,
        {
          method: 'POST',
          body: form,
        }
      );

      const data = await response.json() as any;
      console.log('📥 ImgBB response:', { success: data.success, hasUrl: !!data.data?.url });

      if (!data.success) {
        console.error('❌ ImgBB API error:', data.error);
        throw new Error(data.error?.message || 'ImgBB upload failed');
      }

      console.log('✅ ImgBB URL:', data.data.url);
      return data.data.url;
    } catch (error) {
      console.error('❌ ImgBB upload error:', error);
      throw error;
    }
  }
}

