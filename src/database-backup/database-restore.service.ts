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

    const isProduction = process.env.NODE_ENV === 'production';
    const pgRestorePath = isProduction 
      ? 'pg_restore' 
      : 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe';

    // --- NUEVO CÓDIGO DE DEPURACIÓN ---
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`🔍 Tamaño del archivo descargado: ${stats.size} bytes`);
      
      // Si el archivo pesa menos de 1KB, casi seguro es un error de Supabase
      if (stats.size < 1000) {
        const contenido = fs.readFileSync(filePath, 'utf8');
        console.log(`📄 Contenido sospechoso del archivo: ${contenido.substring(0, 300)}`);
      }
    } else {
      console.error(`❌ El archivo no existe en la ruta: ${filePath}`);
    }
    // ----------------------------------

    return new Promise((resolve, reject) => {
      let errorOutput = '';

      const restore = spawn(
        pgRestorePath,
        [
          '--if-exists',
          '--no-owner',
          '--no-privileges',
          '-d', databaseUrl,
          filePath,
        ]
      );

      restore.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      restore.on('error', (err) => {
        reject(new InternalServerErrorException(`pg_restore falló al iniciar: ${err.message}`));
      });

      restore.on('close', (code) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (code === 0) {
          resolve();
        } else {
          console.error('Error de pg_restore:', errorOutput);
          reject(new InternalServerErrorException(`La restauración falló con código ${code}. Detalles: ${errorOutput}`));
        }
      });
    });
  }
}