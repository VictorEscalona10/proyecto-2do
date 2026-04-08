// src/analytics/dto/analytics.dto.ts
export class TopProductsDto {
  productId: number;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export class MonthlySalesDto {
  year: number;
  month: number;
  monthName: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export class CategoryPerformanceDto {
  categoryId: number;
  categoryName: string;
  productCount: number;
  totalSold: number;
  totalRevenue: number;
  avgPrice: number;
}

export class OrderStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export class SalesByWeekdayDto {
  dayOfWeek: number;
  dayName: string;
  orderCount: number;
  totalRevenue: number;
}

export class PaymentMethodDto {
  paymentMethod: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export class SalesSummaryDto {
  currentMonth: {
    orderCount: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  lastMonth: {
    orderCount: number;
    totalRevenue: number;
  };
  totalProducts: number;
  totalCustomers: number;
  growthRate: number;
}