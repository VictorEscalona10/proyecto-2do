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

    // En producción (Render) usamos el comando global 'pg_restore'
    // En local usamos tu ruta específica de Windows
    const isProduction = process.env.NODE_ENV === 'production';
    const pgRestorePath = isProduction 
      ? 'pg_restore' 
      : 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe';

    return new Promise((resolve, reject) => {
      let errorOutput = '';

      const restore = spawn(
        pgRestorePath,
        [
          // '--clean',      // COMENTADO: Neon bloquea esto frecuentemente por falta de permisos
          '--if-exists',     // Solo si las tablas existen
          '--no-owner',      // VITAL PARA NEON: Ignora los dueños originales de las tablas
          '--no-privileges', // VITAL PARA NEON: Ignora los permisos de roles originales
          '--no-acl',        // VITAL PARA NEON: Ignora comandos de control de acceso
          '-d', databaseUrl, // Usa la URL de conexión
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
              `La restauración falló con código ${code}. Revisa los logs del servidor. Detalles: ${errorOutput}`,
            ),
          );
        }
      });
    });
  }
}