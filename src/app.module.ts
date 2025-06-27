import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [AuthModule, 
    ConfigModule.forRoot({isGlobal: true}), ProductsModule, CategoryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
