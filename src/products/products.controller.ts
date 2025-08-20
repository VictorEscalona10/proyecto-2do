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

    @Put(':id')
    async updateProduct(
        @Param('id') id: string,
        @Body() body: Partial<CreateProductDto>
    ) {
        // Puedes agregar lógica para manejar imagen si lo necesitas
        return this.productsService.update(Number(id), body);
    }

    @Delete(':id')
    async deleteProduct(@Param('id') id: string) {
        return this.productsService.delete(Number(id));
    }

    @Get('search')
    async searchProducts(
        @Query('name') name?: string,
        @Query('categoryName') categoryName?: string,
        @Query('price') price?: string
    ) {
        return this.productsService.search({
            name,
            categoryName,
            price: price ? Number(price) : undefined,
        });
    }
}
