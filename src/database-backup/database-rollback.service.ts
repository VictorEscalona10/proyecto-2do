import { Injectable } from '@nestjs/common';
import { DownloadBackupService } from './download-backup.service';
import { DatabaseRestoreService } from './database-restore.service';

@Injectable()
export class DatabaseRollbackService {
  constructor(
    private readonly downloadService: DownloadBackupService,
    private readonly restoreService: DatabaseRestoreService,
  ) {}

  async rollback(fileName: string) {
    const filePath = await this.downloadService.download(fileName);

    await this.restoreService.restoreFromBackup(filePath);

    return {
      message: 'Base de datos restaurada correctamente',
      backup: fileName,
    };
  }
}
