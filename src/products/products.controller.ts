import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    Put,
    Param,
    Delete,
    Get,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Validar tipo de archivo
                const allowedMimeTypes = ['image/jpeg', 'image/png'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return cb(new Error('Tipo de archivo no permitido'), false);
                }
                cb(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024, // Tamaño máximo: 2 MB
            },
        }),
    )

    async createProduct(@Body() body: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
        const imageUrl = file ? `/images/${file.filename}` : null;

        return this.productsService.create({ ...body, imageUrl });
    }

    @Get('search/name')
    @HttpCode(HttpStatus.OK)
    async searchProducts(@Query('name') name: string) {
        return this.productsService.searchByName(name);
    }

    @Get('/search/category')
    async searchProductsByCategory(@Query('name') name: string){
        return this.productsService.searchByCategory(name)
    }
}
