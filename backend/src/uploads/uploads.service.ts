import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class UploadsService {
  private readonly IMGBB_API_KEY = process.env.IMGBB_API_KEY || '3d9116a6f23fb3350bb33f7df85f8606';

  async uploadToImgBB(file: Express.Multer.File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file.buffer.toString('base64'));
      
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${this.IMGBB_API_KEY}`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      if (response.data?.data?.url) {
        console.log('✅ Image uploaded to ImgBB:', response.data.data.url);
        return response.data.data.url;
      }

      throw new Error('Failed to upload image to ImgBB');
    } catch (error) {
      console.error('❌ ImgBB upload error:', error);
      throw error;
    }
  }
}
