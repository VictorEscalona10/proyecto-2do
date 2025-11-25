import { Injectable } from '@nestjs/common';
import { PdfBaseService } from '../shared/pdf-base.service';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersPdfService extends PdfBaseService {
    constructor(private usersService: UsersService) {
        super();
    }

    /**
     * Generar reporte completo de usuarios con filtros opcionales
     */
    async generateUsersReport(filters?: {
        role?: UserRole;
        isActive?: boolean;
    }): Promise<Buffer> {
        // Obtener todos los usuarios
        const { data: users } = await this.usersService.findAll();

        // Aplicar filtros si existen
        let filteredUsers = users;
        if (filters?.role) {
            filteredUsers = filteredUsers.filter(user => user.role === filters.role);
        }
        if (filters?.isActive !== undefined) {
            filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
        }

        return this.createPdfBuffer((doc) => {
            // Encabezado
            this.addHeader(
                doc,
                'REPORTE DE USUARIOS',
                'Migdalis Tortas - Sistema de Gestión',
            );

            this.addGenerationInfo(doc);

            // Filtros aplicados
            if (filters?.role || filters?.isActive !== undefined) {
                this.addSection(doc, 'Filtros Aplicados');
                const appliedFilters: Record<string, string> = {};

                if (filters.role) appliedFilters['Rol'] = filters.role;
                if (filters.isActive !== undefined) {
                    appliedFilters['Estado'] = filters.isActive ? 'Activos' : 'Inactivos';
                }

                this.addStatistics(doc, appliedFilters);
            }

            // Estadísticas generales
            this.addSection(doc, 'Resumen General');
            const activeCount = filteredUsers.filter(u => u.isActive).length;
            const inactiveCount = filteredUsers.filter(u => !u.isActive).length;
            const adminCount = filteredUsers.filter(u => u.role === UserRole.ADMINISTRADOR).length;
            const clientCount = filteredUsers.filter(u => u.role === UserRole.USUARIO).length;

            this.addStatistics(doc, {
                'Total de usuarios': filteredUsers.length,
                'Usuarios activos': activeCount,
                'Usuarios inactivos': inactiveCount,
                'Administradores': adminCount,
                'Clientes': clientCount,
            });

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#bdc3c7').stroke();
            doc.moveDown();

            // Detalle de usuarios
            this.addSection(doc, 'Listado de Usuarios');

            if (filteredUsers.length === 0) {
                doc.fontSize(11).fillColor('#7f8c8d').text('No hay usuarios para mostrar.');
            } else {
                this.addTable(
                    doc,
                    [
                        { header: 'ID', key: 'id', width: 40 },
                        { header: 'Nombre', key: 'name', width: 120 },
                        { header: 'Email', key: 'email', width: 130 },
                        { header: 'Rol', key: 'role', width: 80 },
                        { header: 'Estado', key: 'status', width: 60 },
                        { header: 'Fecha Registro', key: 'createdAt', width: 90 },
                    ],
                    filteredUsers.map((user) => ({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.isActive ? 'Activo' : 'Inactivo',
                        createdAt: new Date(user.createdAt).toLocaleDateString('es-ES'),
                    })),
                );
            }

            // Pie de página
            this.addFooter(doc, 1);
        });
    }

    /**
     * Generar reporte de estadísticas de usuarios
     */
    async generateUsersStatisticsReport(): Promise<Buffer> {
        const { data: users } = await this.usersService.findAll();

        // Calcular estadísticas
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive).length;
        const inactiveUsers = users.filter(u => !u.isActive).length;
        const adminUsers = users.filter(u => u.role === UserRole.ADMINISTRADOR).length;
        const clientUsers = users.filter(u => u.role === UserRole.USUARIO).length;

        // Usuarios del último mes
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const recentUsers = users.filter(u => new Date(u.createdAt) >= lastMonth).length;

        // Usuarios por mes (últimos 6 meses)
        const usersByMonth: Record<string, number> = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        users.forEach(user => {
            const createdDate = new Date(user.createdAt);
            if (createdDate >= sixMonthsAgo) {
                const monthKey = createdDate.toLocaleDateString('es-ES', {
                    month: 'short',
                    year: 'numeric'
                });
                usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
            }
        });

        return this.createPdfBuffer((doc) => {
            this.addHeader(
                doc,
                'ESTADÍSTICAS DE USUARIOS',
                'Análisis Completo del Sistema',
            );

            this.addGenerationInfo(doc);

            // Resumen global
            this.addSection(doc, 'Resumen Global');
            this.addStatistics(doc, {
                'Total de usuarios registrados': totalUsers,
                'Usuarios activos': activeUsers,
                'Usuarios inactivos': inactiveUsers,
            });

            // Distribución por rol
            this.addSection(doc, 'Distribución por Rol');
            const roleStats: Record<string, string> = {
                'Administradores': `${adminUsers} (${((adminUsers / totalUsers) * 100).toFixed(1)}%)`,
                'Clientes': `${clientUsers} (${((clientUsers / totalUsers) * 100).toFixed(1)}%)`,
            };
            this.addStatistics(doc, roleStats);

            // Estado de cuentas
            this.addSection(doc, 'Estado de Cuentas');
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#34495e').text('Distribución por estado:');
            doc.fontSize(10).fillColor('black')
                .text(`  Activas: ${((activeUsers / totalUsers) * 100).toFixed(1)}% (${activeUsers} usuarios)`)
                .text(`  Inactivas: ${((inactiveUsers / totalUsers) * 100).toFixed(1)}% (${inactiveUsers} usuarios)`);
            doc.moveDown();

            // Actividad reciente
            this.addSection(doc, 'Actividad Reciente');
            this.addStatistics(doc, {
                'Nuevos usuarios (último mes)': recentUsers,
            });

            // Registros por mes
            if (Object.keys(usersByMonth).length > 0) {
                doc.moveDown(0.5);
                doc.fontSize(11).fillColor('#34495e').text('Registros por mes (últimos 6 meses):');
                Object.entries(usersByMonth).forEach(([month, count]) => {
                    doc.fontSize(10).fillColor('black').text(`  ${month}: ${count} usuarios`);
                });
                doc.moveDown();
            }

            // Tabla de últimos usuarios registrados
            this.addSection(doc, 'Últimos 10 Usuarios Registrados');

            const recentUsersList = users
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10);

            if (recentUsersList.length > 0) {
                this.addTable(
                    doc,
                    [
                        { header: 'Nombre', key: 'name', width: 150 },
                        { header: 'Email', key: 'email', width: 150 },
                        { header: 'Rol', key: 'role', width: 100 },
                        { header: 'Fecha', key: 'createdAt', width: 100 },
                    ],
                    recentUsersList.map((user) => ({
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        createdAt: new Date(user.createdAt).toLocaleDateString('es-ES'),
                    })),
                );
            }

            this.addFooter(doc, 1);
        });
    }

    /**
     * Generar reporte de usuarios por rol específico
     */
    async generateUsersByRoleReport(role: UserRole): Promise<Buffer> {
        const { data: users } = await this.usersService.findAll();
        const filteredUsers = users.filter(user => user.role === role);

        return this.createPdfBuffer((doc) => {
            this.addHeader(
                doc,
                `REPORTE DE USUARIOS - ROL: ${role}`,
                'Migdalis Tortas - Sistema de Gestión',
            );

            this.addGenerationInfo(doc);

            // Estadísticas del rol
            const activeCount = filteredUsers.filter(u => u.isActive).length;
            const inactiveCount = filteredUsers.filter(u => !u.isActive).length;

            this.addSection(doc, 'Resumen por Rol');
            this.addStatistics(doc, {
                'Total de usuarios con este rol': filteredUsers.length,
                'Usuarios activos': activeCount,
                'Usuarios inactivos': inactiveCount,
            });

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#bdc3c7').stroke();
            doc.moveDown();

            // Detalle de usuarios
            this.addSection(doc, 'Listado Completo');

            if (filteredUsers.length === 0) {
                doc.fontSize(11).fillColor('#7f8c8d').text('No hay usuarios con este rol.');
            } else {
                this.addTable(
                    doc,
                    [
                        { header: 'ID', key: 'id', width: 40 },
                        { header: 'Nombre', key: 'name', width: 130 },
                        { header: 'Email', key: 'email', width: 140 },
                        { header: 'Teléfono', key: 'phoneNumber', width: 90 },
                        { header: 'Estado', key: 'status', width: 60 },
                        { header: 'Fecha Registro', key: 'createdAt', width: 90 },
                    ],
                    filteredUsers.map((user) => ({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phoneNumber: user.phoneNumber || 'N/A',
                        status: user.isActive ? 'Activo' : 'Inactivo',
                        createdAt: new Date(user.createdAt).toLocaleDateString('es-ES'),
                    })),
                );
            }

            this.addFooter(doc, 1);
        });
    }
}
