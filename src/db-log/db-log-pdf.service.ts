import { Injectable } from '@nestjs/common';
import { PdfBaseService } from '../shared/pdf-base.service';
import { DbLogService } from './db-log.service';

@Injectable()
export class DbLogPdfService extends PdfBaseService {
    constructor(private dbLogService: DbLogService) {
        super();
    }

    /**
     * Generar reporte completo de logs con filtros
     */
    async generateLogsReport(filters: {
        tableName?: string;
        action?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<Buffer> {
        // Obtener datos
        const { data: logs } = await this.dbLogService.findAll({
            ...filters,
            page: 1,
            limit: 1000, // Limitar a 1000 registros para el PDF
        });

        const stats = await this.dbLogService.getStats();

        return this.createPdfBuffer((doc) => {
            // Encabezado
            this.addHeader(
                doc,
                'REPORTE DE BITÁCORA DE BASE DE DATOS',
                'Migdalis Tortas - Sistema de Gestión',
            );

            this.addGenerationInfo(doc);

            // Filtros aplicados
            if (filters.tableName || filters.action || filters.dateFrom) {
                this.addSection(doc, 'Filtros Aplicados');
                const appliedFilters: Record<string, string> = {};

                if (filters.tableName) appliedFilters['Tabla'] = filters.tableName;
                if (filters.action) appliedFilters['Acción'] = filters.action;
                if (filters.dateFrom)
                    appliedFilters['Desde'] = new Date(filters.dateFrom).toLocaleDateString('es-ES');
                if (filters.dateTo)
                    appliedFilters['Hasta'] = new Date(filters.dateTo).toLocaleDateString('es-ES');

                this.addStatistics(doc, appliedFilters);
            }

            // Estadísticas generales
            this.addSection(doc, 'Estadísticas Generales');
            const statsData: Record<string, string | number> = {
                'Total de registros': stats.total,
            };

            stats.byAction.forEach((item) => {
                statsData[`Operaciones ${item.action}`] = item.count;
            });

            this.addStatistics(doc, statsData);

            // Top tablas
            if (stats.topTables.length > 0) {
                doc.fontSize(11).fillColor('#34495e').text('Tablas más modificadas:');
                stats.topTables.slice(0, 5).forEach((table, index) => {
                    doc
                        .fontSize(10)
                        .fillColor('black')
                        .text(`  ${index + 1}. ${table.tableName}: ${table.count} operaciones`);
                });
                doc.moveDown();
            }

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#bdc3c7').stroke();
            doc.moveDown();

            // Detalle de operaciones
            this.addSection(doc, 'Detalle de Operaciones');

            if (logs.length === 0) {
                doc.fontSize(11).fillColor('#7f8c8d').text('No hay registros para mostrar.');
            } else {
                this.addTable(
                    doc,
                    [
                        { header: 'ID', key: 'id', width: 50 },
                        { header: 'Fecha', key: 'createdAt', width: 100 },
                        { header: 'Tabla', key: 'tableName', width: 100 },
                        { header: 'Acción', key: 'action', width: 80 },
                        { header: 'Registro ID', key: 'recordId', width: 80 },
                        { header: 'Descripción', key: 'description', width: 140 },
                    ],
                    logs.map((log) => ({
                        ...log,
                        createdAt: new Date(log.createdAt).toLocaleDateString('es-ES'),
                        recordId: log.recordId || 'N/A',
                    })),
                );
            }

            // Pie de página
            this.addFooter(doc, 1);
        });
    }

    /**
     * Generar reporte de estadísticas
     */
    async generateStatisticsReport(): Promise<Buffer> {
        const stats = await this.dbLogService.getStats();

        return this.createPdfBuffer((doc) => {
            this.addHeader(
                doc,
                'ESTADÍSTICAS DE BITÁCORA',
                'Análisis de Operaciones de Base de Datos',
            );

            this.addGenerationInfo(doc);

            // Resumen global
            this.addSection(doc, 'Resumen Global');
            this.addStatistics(doc, {
                'Total de operaciones registradas': stats.total,
            });

            // Por tipo de acción
            this.addSection(doc, 'Operaciones por Tipo');
            const actionStats: Record<string, number> = {};
            stats.byAction.forEach((item) => {
                actionStats[item.action] = item.count;
            });
            this.addStatistics(doc, actionStats);

            // Gráfico de porcentajes (texto)
            doc.moveDown();
            doc.fontSize(11).fillColor('#34495e').text('Distribución porcentual:');
            stats.byAction.forEach((item) => {
                const percentage = ((item.count / stats.total) * 100).toFixed(1);
                doc
                    .fontSize(10)
                    .fillColor('black')
                    .text(`  ${item.action}: ${percentage}% (${item.count} ops)`);
            });
            doc.moveDown();

            // Top tablas más modificadas
            this.addSection(doc, 'Top 10 Tablas Más Modificadas');

            if (stats.topTables.length === 0) {
                doc.fontSize(11).fillColor('#7f8c8d').text('No hay datos disponibles.');
            } else {
                this.addTable(
                    doc,
                    [
                        { header: '#', key: 'index', width: 50 },
                        { header: 'Tabla', key: 'tableName', width: 200 },
                        { header: 'Operaciones', key: 'count', width: 100 },
                        { header: 'Porcentaje', key: 'percentage', width: 100 },
                    ],
                    stats.topTables.map((table, index) => ({
                        index: index + 1,
                        tableName: table.tableName,
                        count: table.count,
                        percentage: `${((table.count / stats.total) * 100).toFixed(1)}%`,
                    })),
                );
            }

            this.addFooter(doc, 1);
        });
    }

    /**
     * Generar reporte de logs por tabla específica
     */
    async generateTableLogsReport(tableName: string): Promise<Buffer> {
        const { data: logs } = await this.dbLogService.findAll({
            tableName,
            page: 1,
            limit: 1000,
        });

        return this.createPdfBuffer((doc) => {
            this.addHeader(
                doc,
                `REGISTRO DE OPERACIONES - ${tableName.toUpperCase()}`,
                'Bitácora de Base de Datos',
            );

            this.addGenerationInfo(doc);

            // Estadísticas de la tabla
            const creates = logs.filter((l) => l.action === 'CREATE').length;
            const updates = logs.filter((l) => l.action === 'UPDATE').length;
            const deletes = logs.filter((l) => l.action === 'DELETE').length;

            this.addSection(doc, 'Resumen de Operaciones');
            this.addStatistics(doc, {
                'Total de operaciones': logs.length,
                'Creaciones (CREATE)': creates,
                'Actualizaciones (UPDATE)': updates,
                'Eliminaciones (DELETE)': deletes,
            });

            // Detalle
            this.addSection(doc, 'Historial Completo');

            if (logs.length === 0) {
                doc.fontSize(11).fillColor('#7f8c8d').text('No hay operaciones registradas para esta tabla.');
            } else {
                this.addTable(
                    doc,
                    [
                        { header: 'ID', key: 'id', width: 50 },
                        { header: 'Fecha y Hora', key: 'createdAt', width: 130 },
                        { header: 'Acción', key: 'action', width: 80 },
                        { header: 'Registro ID', key: 'recordId', width: 80 },
                        { header: 'Descripción', key: 'description', width: 160 },
                    ],
                    logs.map((log) => ({
                        ...log,
                        createdAt: new Date(log.createdAt).toLocaleString('es-ES'),
                        recordId: log.recordId || 'N/A',
                    })),
                );
            }

            this.addFooter(doc, 1);
        });
    }
}
