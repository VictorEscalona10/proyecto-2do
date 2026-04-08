import { Controller, Post, Param, Get } from '@nestjs/common';
import { DatabaseBackupService } from './database-backup.service';
import { DatabaseRollbackService } from './database-rollback.service';
import { ListBackupsService } from './list-backups.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('backup')
export class DatabaseBackupController {
  constructor(
    private readonly backupService: DatabaseBackupService,
    private readonly rollbackService: DatabaseRollbackService,
    private readonly listBackupsService: ListBackupsService,
  ) { }

  @Get('list')
  listBackups() {
    return this.listBackupsService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Post()
  async backup() {
    return this.backupService.createBackupAndUpload();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Post('restore/:fileName')
  restore(@Param('fileName') fileName: string) {
    return this.rollbackService.rollback(fileName);
  }

}
