import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class ListBackupsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase.client.storage
      .from('db-backups')
      .list('postgres', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(file => ({
      name: file.name,
      size: file.metadata?.size,
      createdAt: file.created_at,
    }));
  }
}
