// src/analytics/analytics.controller.ts - Versión con logs mejorados
import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('top-products')
  async getTopProducts(@Query('limit') limit: string) {
    try {
      const limitNumber = parseInt(limit) || 10;
      this.logger.log(`Fetching top ${limitNumber} products`);
      const result = await this.analyticsService.getTopProducts(limitNumber);
      this.logger.log(`Successfully fetched ${result.length} top products`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching top products: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener productos más vendidos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('monthly-sales')
  async getMonthlySales(@Query('year') year: string) {
    try {
      const yearNumber = year ? parseInt(year) : undefined;
      this.logger.log(`Fetching monthly sales for year: ${yearNumber || 'current'}`);
      const result = await this.analyticsService.getMonthlySales(yearNumber);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly sales: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener ventas mensuales: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('category-performance')
  async getCategoryPerformance() {
    try {
      this.logger.log('Fetching category performance');
      const result = await this.analyticsService.getCategoryPerformance();
      this.logger.log(`Successfully fetched performance for ${result.length} categories`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching category performance: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener desempeño por categoría: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('order-status')
  async getOrderStatusDistribution() {
    try {
      this.logger.log('Fetching order status distribution');
      const result = await this.analyticsService.getOrderStatusDistribution();
      this.logger.log('Successfully fetched order status distribution');
      return result;
    } catch (error) {
      this.logger.error(`Error fetching order status distribution: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener distribución de estados: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sales-by-weekday')
  async getSalesByWeekday() {
    try {
      this.logger.log('Fetching sales by weekday');
      const result = await this.analyticsService.getSalesByWeekday();
      return result;
    } catch (error) {
      this.logger.error(`Error fetching sales by weekday: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener ventas por día: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('payment-methods')
  async getPaymentMethodsDistribution() {
    try {
      this.logger.log('Fetching payment methods distribution');
      const result = await this.analyticsService.getPaymentMethodsDistribution();
      this.logger.log(`Successfully fetched ${result.length} payment methods`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching payment methods: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener métodos de pago: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sales-summary')
  async getSalesSummary() {
    try {
      this.logger.log('Fetching sales summary');
      const result = await this.analyticsService.getSalesSummary();
      this.logger.log('Successfully fetched sales summary');
      return result;
    } catch (error) {
      this.logger.error(`Error fetching sales summary: ${error.message}`, error.stack);
      throw new HttpException(
        `Error al obtener resumen de ventas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}