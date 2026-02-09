import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { UploadBackupService } from './upload-backup.service';

@Injectable()
export class DatabaseBackupService {
  constructor(
    private readonly uploadBackupService: UploadBackupService,
  ) {}

  async createBackup(): Promise<{ filePath: string; fileName: string }> {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const fileName = `postgres-backup-${Date.now()}.backup`;
    const filePath = path.join(backupDir, fileName);

    const {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD,
      DB_NAME,
    } = process.env;

    return new Promise((resolve, reject) => {
      const dump = spawn(
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
        [
          '-h', DB_HOST!,
          '-p', DB_PORT!,
          '-U', DB_USER!,
          '-F', 'c',
          '-f', filePath,
          DB_NAME!,
        ],
        {
          env: {
            ...process.env,
            PGPASSWORD: DB_PASSWORD,
          },
        },
      );

      dump.on('error', () => {
        reject(
          new InternalServerErrorException(
            'pg_dump no está disponible en el sistema',
          ),
        );
      });

      dump.on('close', (code) => {
        if (code === 0) {
          resolve({ filePath, fileName });
        } else {
          reject(
            new InternalServerErrorException(
              `Backup falló con código ${code}`,
            ),
          );
        }
      });
    });
  }

  async createBackupAndUpload() {
    const { filePath, fileName } = await this.createBackup();

    await this.uploadBackupService.upload(filePath, fileName);

    fs.unlinkSync(filePath);

    return {
      message: 'Backup creado y subido a Supabase',
      file: fileName,
    };
  }
}
