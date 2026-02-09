import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';

@Injectable()
export class DatabaseRestoreService {
  async restoreFromBackup(filePath: string): Promise<void> {
    const {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD,
      DB_NAME,
    } = process.env;

    return new Promise((resolve, reject) => {
      const restore = spawn(
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe',
        [
          '--clean',
          '--if-exists',
          '-h', DB_HOST!,
          '-p', DB_PORT!,
          '-U', DB_USER!,
          '-d', DB_NAME!,
          filePath,
        ],
        {
          env: {
            ...process.env,
            PGPASSWORD: DB_PASSWORD,
          },
        },
      );

      restore.on('error', () => {
        reject(
          new InternalServerErrorException(
            'pg_restore no está disponible',
          ),
        );
      });

      restore.on('close', (code) => {
        fs.unlinkSync(filePath); // limpiar archivo local

        if (code === 0) {
          resolve();
        } else {
          reject(
            new InternalServerErrorException(
              `Restore falló con código ${code}`,
            ),
          );
        }
      });
    });
  }
}
