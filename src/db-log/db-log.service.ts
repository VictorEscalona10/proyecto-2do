import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class DbLogService {
    constructor(private prisma: PrismaService) { }

    /**
     * Obtener logs con filtros y paginación
     */
    async findAll(queryDto: QueryLogsDto) {
        const { tableName, action, recordId, page = 1, limit = 50 } = queryDto;

        const where: any = {};
        if (tableName) where.tableName = tableName;
        if (action) where.action = action;
        if (recordId) where.recordId = recordId;

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.prisma.dbLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.dbLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Obtener un log específico por ID
     */
    async findOne(id: number) {
        return this.prisma.dbLog.findUnique({
            where: { id },
        });
    }

    /**
     * Obtener estadísticas de logs
     */
    async getStats() {
        const [total, byAction, byTable] = await Promise.all([
            this.prisma.dbLog.count(),
            this.prisma.dbLog.groupBy({
                by: ['action'],
                _count: { action: true },
            }),
            this.prisma.dbLog.groupBy({
                by: ['tableName'],
                _count: { tableName: true },
                orderBy: { _count: { tableName: 'desc' } },
                take: 10,
            }),
        ]);

        return {
            total,
            byAction: byAction.map((item) => ({
                action: item.action,
                count: item._count.action,
            })),
            topTables: byTable.map((item) => ({
                tableName: item.tableName,
                count: item._count.tableName,
            })),
        };
    }

    /**
     * Crear un log manualmente (usado por el middleware)
     */
    async createLog(data: {
        action: string;
        tableName: string;
        recordId?: number;
        description?: string;
    }) {
        return this.prisma.dbLog.create({
            data,
        });
    }
}
