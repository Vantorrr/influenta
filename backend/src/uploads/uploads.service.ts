import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import fetch from 'node-fetch';

@Injectable()
export class UploadsService {
  private readonly imgbbApiKey = process.env.IMGBB_API_KEY || 'f4ac89ea03c2eb1836fb63aa2e0e99e8';

  async uploadToImgBB(buffer: Buffer, filename: string): Promise<string> {
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

      if (!data.success) {
        throw new Error(data.error?.message || 'ImgBB upload failed');
      }

      return data.data.url;
    } catch (error) {
      console.error('❌ ImgBB upload error:', error);
      throw error;
    }
  }
}

