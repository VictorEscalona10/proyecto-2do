import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DbLogService } from './db-log.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@ApiTags('Database Logs')
@Controller('db-logs')
export class DbLogController {
    constructor(private readonly dbLogService: DbLogService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los logs con filtros opcionales' })
    @ApiResponse({ status: 200, description: 'Lista de logs con paginación' })
    findAll(@Query() queryDto: QueryLogsDto) {
        return this.dbLogService.findAll(queryDto);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de logs' })
    @ApiResponse({ status: 200, description: 'Estadísticas de operaciones de BD' })
    getStats() {
        return this.dbLogService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un log específico por ID' })
    @ApiResponse({ status: 200, description: 'Detalle del log' })
    @ApiResponse({ status: 404, description: 'Log no encontrado' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.dbLogService.findOne(id);
    }
}
