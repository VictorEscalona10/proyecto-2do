import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DbLogModule } from './db-log/db-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProductsModule,
    CategoryModule,
    PasswordResetModule,
    UsersModule,
    OrdersModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: parseInt(process.env.THROTTLE_TTL), limit: parseInt(process.env.THROTTLE_LIMIT) }
      ],

    }),
    ChatModule,
    ReviewsModule,
    DbLogModule,
  ],
  controllers: [AppController],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }