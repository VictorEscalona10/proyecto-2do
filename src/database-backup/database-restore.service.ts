import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';

@Injectable()
export class DatabaseRestoreService {
  async restoreFromBackup(filePath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new InternalServerErrorException('Falta la variable DATABASE_URL');
    }

    return new Promise((resolve, reject) => {
      const restore = spawn(
        'pg_restore',
        [
          '--clean',
          '--if-exists',
          '--no-owner', // Vital para bases de datos Cloud como Neon
          '-d', databaseUrl,
          filePath,
        ]
      );

      restore.on('error', (err) => {
        reject(
          new InternalServerErrorException(
            `pg_restore no está disponible: ${err.message}`,
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