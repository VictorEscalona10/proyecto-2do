import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { UploadBackupService } from './upload-backup.service';

@Injectable()
export class DatabaseBackupService {
  constructor(
    private readonly uploadBackupService: UploadBackupService,
  ) { }

  async createBackup(): Promise<{ filePath: string; fileName: string }> {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const fileName = `postgres-backup-${Date.now()}.backup`;
    const filePath = path.join(backupDir, fileName);

    // Es mucho más seguro usar la URL completa proporcionada por Neon (ej. postgres://user:pass@host/dbname?sslmode=require)
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new InternalServerErrorException('Falta la variable DATABASE_URL');
    }

    return new Promise((resolve, reject) => {
      const dump = spawn(
        'pg_dump', // Comando global agnóstico al sistema operativo
        [
          '--format=c',
          `--file=${filePath}`,
          databaseUrl,
        ]
      );

      dump.on('error', (err) => {
        reject(
          new InternalServerErrorException(
            `pg_dump no está disponible en el sistema: ${err.message}`,
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
