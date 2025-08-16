import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
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
                    const uniqueSuffix =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )

    async createProduct(@Body() body: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
        const imageUrl = file ? `/images/${file.filename}` : null;

        return this.productsService.create({ ...body, imageUrl });
    }
}
