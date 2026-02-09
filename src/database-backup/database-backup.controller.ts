import { Controller, Post, Param } from '@nestjs/common';
import { DatabaseBackupService } from './database-backup.service';
import { DatabaseRollbackService } from './database-rollback.service';
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
  ) { }

  /* @Post()
  async backup() {
    const path = await this.backupService.createBackup();
    return {
      message: 'Backup generado correctamente',
      file: path,
    };
  } */

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
