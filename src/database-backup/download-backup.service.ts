import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DownloadBackupService {
  constructor(private readonly supabase: SupabaseService) {}

  async download(fileName: string): Promise<string> {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const filePath = path.join(backupDir, fileName);

    const { data, error } = await this.supabase.client.storage
      .from('db-backups')
      .download(`postgres/${fileName}`);

    if (error || !data) {
      throw new Error(`Error descargando backup: ${error?.message}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return filePath;
  }
}
