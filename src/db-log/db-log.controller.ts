import { Controller, Get, Param, Query, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { DbLogService } from './db-log.service';
import { DbLogPdfService } from './db-log-pdf.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@ApiTags('Database Logs')
@Controller('db-logs')
export class DbLogController {
    constructor(
        private readonly dbLogService: DbLogService,
        private readonly dbLogPdfService: DbLogPdfService,
    ) { }

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

    @Get('export/pdf')
    @ApiOperation({ summary: 'Exportar logs a PDF con filtros opcionales' })
    @ApiQuery({ name: 'tableName', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'UPDATE', 'DELETE'] })
    @ApiResponse({ status: 200, description: 'PDF generado exitosamente' })
    async exportToPdf(
        @Query('tableName') tableName?: string,
        @Query('action') action?: string,
        @Res() res?: Response,
    ) {
        const pdfBuffer = await this.dbLogPdfService.generateLogsReport({
            tableName,
            action,
        });

        const filename = `logs-${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get('export/pdf/stats')
    @ApiOperation({ summary: 'Exportar estadísticas de logs a PDF' })
    @ApiResponse({ status: 200, description: 'PDF de estadísticas generado' })
    async exportStatsToPdf(@Res() res: Response) {
        const pdfBuffer = await this.dbLogPdfService.generateStatisticsReport();

        const filename = `logs-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get('export/pdf/table/:tableName')
    @ApiOperation({ summary: 'Exportar logs de una tabla específica a PDF' })
    @ApiResponse({ status: 200, description: 'PDF generado para tabla específica' })
    async exportTableToPdf(
        @Param('tableName') tableName: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.dbLogPdfService.generateTableLogsReport(tableName);

        const filename = `logs-${tableName}-${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un log específico por ID' })
    @ApiResponse({ status: 200, description: 'Detalle del log' })
    @ApiResponse({ status: 404, description: 'Log no encontrado' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.dbLogService.findOne(id);
    }
}

