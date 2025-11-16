import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async uploadProductImage(file: Express.Multer.File): Promise<{ publicUrl: string, path: string }> {
    const BUCKET_NAME = 'productos';

    // 1. Generar nombre único y definir la ruta
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const pathInStorage = `productos/${uniqueFileName}`;

    // 2. Subir a Supabase Storage
    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(pathInStorage, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Error al subir a Supabase: ${error.message}`);
    }

    // 3. Obtener la URL pública para el frontend
    const { data: { publicUrl } } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(pathInStorage);

    // Devolvemos la URL pública y la ruta que se guardará en la tabla
    return {
      publicUrl,
      path: pathInStorage // Esta ruta se guarda en tu tabla de Productos (PostgreSQL)
    };
  }
}