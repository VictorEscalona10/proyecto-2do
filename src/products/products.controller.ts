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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { Product } from '@prisma/client';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    /* @UseGuards(JwtAuthGuard) */
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
    async searchProducts(@Query('name') name: string) {
        return this.productsService.searchByName(name);
    }
}
