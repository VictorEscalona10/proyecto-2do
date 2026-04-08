// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // src/analytics/analytics.service.ts - Fragmento optimizado

// 1. Productos más vendidos - Ahora más eficiente
async getTopProducts(limit: number = 10) {
  try {
    const productSales = await this.prisma.orderDetail.groupBy({
      by: ['productId'],
      where: { order: { status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = productSales.map(sale => sale.productId);
    
    // Obtenemos todos los detalles de una vez para calcular ingresos
    const details = await this.prisma.orderDetail.findMany({
      where: {
        productId: { in: productIds },
        order: { status: { not: 'CANCELLED' } }
      },
      select: { productId: true, quantity: true, unitPrice: true, product: { select: { name: true } } }
    });

    return productSales.map(sale => {
      const productDetails = details.filter(d => d.productId === sale.productId);
      const revenue = productDetails.reduce((sum, d) => sum + (d.quantity * Number(d.unitPrice)), 0);
      return {
        productName: productDetails[0]?.product.name || `ID: ${sale.productId}`,
        totalSold: sale._sum.quantity || 0,
        totalRevenue: Number(revenue.toFixed(2)),
      };
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    throw error;
  }
}

  // 2. Ventas mensuales - Usar SQL crudo para funciones de fecha
  async getMonthlySales(year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const monthlySales = await this.prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM o."orderDate")::integer as year,
          EXTRACT(MONTH FROM o."orderDate")::integer as month,
          TO_CHAR(o."orderDate", 'Month') as "monthName",
          COUNT(o.id)::integer as "orderCount",
          COALESCE(SUM(o.total), 0)::decimal as "totalRevenue",
          COALESCE(AVG(o.total), 0)::decimal as "averageOrderValue"
        FROM "Order" o
        WHERE o.status != 'CANCELLED'
          AND EXTRACT(YEAR FROM o."orderDate") = ${currentYear}
        GROUP BY EXTRACT(YEAR FROM o."orderDate"), EXTRACT(MONTH FROM o."orderDate"), TO_CHAR(o."orderDate", 'Month')
        ORDER BY year, month
      `;
      return monthlySales;
    } catch (error) {
      console.error('Error in getMonthlySales:', error);
      throw error;
    }
  }

  // 3. Desempeño por categoría - Optimizado con Prisma
  async getCategoryPerformance() {
    try {
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              orderDetails: {
                where: {
                  order: {
                    status: { not: 'CANCELLED' }
                  }
                },
                select: {
                  quantity: true,
                  unitPrice: true,
                }
              }
            }
          }
        }
      });

      const result = categories.map(category => {
        let totalSold = 0;
        let totalRevenue = 0;
        let totalPrice = 0;

        category.products.forEach(product => {
          // Sumar ventas y ingresos
          product.orderDetails.forEach(orderDetail => {
            totalSold += orderDetail.quantity;
            totalRevenue += orderDetail.quantity * Number(orderDetail.unitPrice);
          });
          
          // Sumar precios para promedio
          totalPrice += Number(product.price);
        });

        const productCount = category.products.length;
        const avgPrice = productCount > 0 ? totalPrice / productCount : 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          productCount,
          totalSold,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          avgPrice: Number(avgPrice.toFixed(2)),
        };
      });

      // Ordenar por ingresos (de mayor a menor)
      return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      throw error;
    }
  }

  // 4. Distribución de estado de órdenes - Usar Prisma groupBy
  async getOrderStatusDistribution() {
    try {
      const statusGroups = await this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      });

      const totalOrders = statusGroups.reduce((total, group) => total + group._count._all, 0);

      const result = statusGroups.map(group => ({
        status: group.status,
        count: group._count._all,
        percentage: totalOrders > 0 
          ? Number(((group._count._all / totalOrders) * 100).toFixed(1))
          : 0,
      }));

      return result;
    } catch (error) {
      console.error('Error in getOrderStatusDistribution:', error);
      throw error;
    }
  }

  // 5. Ventas por día de la semana - Usar SQL crudo para funciones de fecha
  async getSalesByWeekday() {
    try {
      const salesByWeekday = await this.prisma.$queryRaw`
        SELECT 
          EXTRACT(DOW FROM o."orderDate")::integer as "dayOfWeek",
          CASE EXTRACT(DOW FROM o."orderDate")
            WHEN 0 THEN 'Domingo'
            WHEN 1 THEN 'Lunes'
            WHEN 2 THEN 'Martes'
            WHEN 3 THEN 'Miércoles'
            WHEN 4 THEN 'Jueves'
            WHEN 5 THEN 'Viernes'
            WHEN 6 THEN 'Sábado'
          END as "dayName",
          COUNT(o.id)::integer as "orderCount",
          COALESCE(SUM(o.total), 0)::decimal as "totalRevenue"
        FROM "Order" o
        WHERE o.status != 'CANCELLED'
          AND o."orderDate" >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(DOW FROM o."orderDate")
        ORDER BY "dayOfWeek"
      `;
      return salesByWeekday;
    } catch (error) {
      console.error('Error in getSalesByWeekday:', error);
      throw error;
    }
  }

  // 6. Métodos de pago más usados - Usar Prisma groupBy
  async getPaymentMethodsDistribution() {
    try {
      const paymentGroups = await this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          status: 'PROCESSED',
        },
        _count: {
          _all: true,
        },
      });

      // Obtener monto total por método
      const paymentsWithAmount = await Promise.all(
        paymentGroups.map(async (group) => {
          const payments = await this.prisma.payment.findMany({
            where: {
              method: group.method,
              status: 'PROCESSED',
            },
            include: {
              order: {
                select: {
                  total: true,
                },
              },
            },
          });

          const totalAmount = payments.reduce((sum, payment) => {
            return sum + Number(payment.order?.total || 0);
          }, 0);

          return {
            paymentMethod: group.method,
            transactionCount: group._count._all,
            totalAmount: Number(totalAmount.toFixed(2)),
          };
        })
      );

      const totalTransactions = paymentsWithAmount.reduce((sum, method) => sum + method.transactionCount, 0);

      const result = paymentsWithAmount.map(method => ({
        ...method,
        percentage: totalTransactions > 0
          ? Number(((method.transactionCount / totalTransactions) * 100).toFixed(1))
          : 0,
      })).sort((a, b) => b.transactionCount - a.transactionCount);

      return result;
    } catch (error) {
      console.error('Error in getPaymentMethodsDistribution:', error);
      throw error;
    }
  }

  // 7. Resumen general de ventas - Optimizado con Prisma
  async getSalesSummary() {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      // Obtener datos del mes actual usando Prisma aggregate
      const currentMonthData = await this.prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          orderDate: { gte: firstDayOfMonth },
        },
        _count: { _all: true },
        _sum: { total: true },
        _avg: { total: true },
      });

      // Obtener datos del mes anterior
      const lastMonthData = await this.prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          orderDate: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
        _count: { _all: true },
        _sum: { total: true },
      });

      // Contar productos activos
      const totalProducts = await this.prisma.product.count({
        where: { isActive: true }
      });

      // Contar usuarios activos con rol USUARIO
      const totalCustomers = await this.prisma.user.count({
        where: { 
          isActive: true,
          role: 'USUARIO'
        }
      });

      // Calcular tasa de crecimiento
      const currentRevenue = Number(currentMonthData._sum.total || 0);
      const lastRevenue = Number(lastMonthData._sum.total || 0);
      
      let growthRate = 0;
      if (lastRevenue > 0) {
        growthRate = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
      } else if (currentRevenue > 0) {
        growthRate = 100;
      }

      return {
        currentMonth: {
          orderCount: currentMonthData._count._all || 0,
          totalRevenue: Number(currentRevenue.toFixed(2)),
          averageOrderValue: Number((currentMonthData._avg.total || 0).toFixed(2)),
        },
        lastMonth: {
          orderCount: lastMonthData._count._all || 0,
          totalRevenue: Number(lastRevenue.toFixed(2)),
        },
        totalProducts,
        totalCustomers,
        growthRate: Number(growthRate.toFixed(1)),
      };
    } catch (error) {
      console.error('Error in getSalesSummary:', error);
      throw error;
    }
  }
}