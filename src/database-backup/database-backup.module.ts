import { Module } from '@nestjs/common';
import { DatabaseBackupController } from './database-backup.controller';
import { DatabaseBackupService } from './database-backup.service';
import { UploadBackupService } from './upload-backup.service';
import { SupabaseService } from './supabase.service'
import { DatabaseRestoreService } from './database-restore.service';
import { DownloadBackupService } from './download-backup.service';
import { DatabaseRollbackService } from './database-rollback.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DatabaseBackupController],
  providers: [DatabaseBackupService, UploadBackupService, SupabaseService, DatabaseRestoreService, DownloadBackupService, DatabaseRollbackService],
  exports: [SupabaseService]
})
export class DatabaseBackupModule {}
