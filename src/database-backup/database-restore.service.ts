import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseRestoreService {
  async restoreFromBackup(filePath: string): Promise<void> {
    // Es mejor usar la URL de conexión completa para Neon (asegura que haya SSL)
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new InternalServerErrorException('Falta la variable DATABASE_URL');
    }

    // Lógica para saber si usar el pg_restore de Render o el de tu Windows local
    const isProduction = process.env.NODE_ENV === 'production';
    const pgRestorePath = isProduction 
      ? path.join(process.cwd(), 'pgsql', 'bin', 'pg_restore') 
      : 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe'; // Tu ruta local

    return new Promise((resolve, reject) => {
      let errorOutput = '';

      const restore = spawn(
        pgRestorePath,
        [
          '--clean',         // Limpia la base de datos antes de restaurar
          '--if-exists',     // Solo si las tablas existen
          '--no-owner',      // VITAL PARA NEON: Ignora los dueños originales de las tablas
          '--no-privileges', // VITAL PARA NEON: Ignora los permisos de roles originales
          '-d', databaseUrl, // Usa la URL de conexión en lugar de host, puerto, etc.
          filePath,          // La ruta del archivo descargado de Supabase
        ]
      );

      // Capturar los errores de la consola de postgres para saber exactamente por qué falla
      restore.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      restore.on('error', (err) => {
        reject(
          new InternalServerErrorException(
            `pg_restore no está disponible o falló al iniciar: ${err.message}`,
          ),
        );
      });

      restore.on('close', (code) => {
        // Limpiamos el archivo temporal que se descargó de Supabase
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (code === 0) {
          resolve();
        } else {
          // Imprimimos en los logs de Render el error real de la base de datos
          console.error('Error de pg_restore:', errorOutput);
          reject(
            new InternalServerErrorException(
              `La restauración falló con código ${code}. Revisa los logs del servidor.`,
            ),
          );
        }
      });
    });
  }
}