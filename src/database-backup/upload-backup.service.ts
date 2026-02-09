import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class UploadBackupService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(filePath: string, fileName: string): Promise<void> {
    const buffer = fs.readFileSync(filePath);

    const { error } = await this.supabase.client.storage
      .from('db-backups')
      .upload(`postgres/${fileName}`, buffer, {
        contentType: 'application/octet-stream',
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }
  }
}
