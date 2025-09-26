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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @ApiOperation({
        summary: 'Crear un nuevo producto (Protegido por Rol)',
        description: 'Crea un nuevo producto. Requiere un token JWT y que el usuario tenga el rol de TRABAJADOR o ADMINISTRADOR.',
    })
    @ApiConsumes('multipart/form-data') // Indica que se espera un form-data
    @ApiBody({
        description: 'Datos del producto y la imagen a subir. **Autorización: Requiere rol `TRABAJADOR` o `ADMINISTRADOR`**.',
        type: CreateProductDto,
    })
    @ApiResponse({ status: 201, description: 'Producto creado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado (token inválido o ausente).' })
    @ApiResponse({ status: 403, description: 'Prohibido (el usuario no tiene el rol requerido).' })
    @ApiBearerAuth() // Indica que necesita JWT
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

    @ApiOperation({
        summary: 'Buscar productos por nombre (Público)',
        description: 'Endpoint público para buscar productos que coincidan con un nombre.',
    })
    @ApiResponse({ status: 200, description: 'Lista de productos encontrados.' })
    @Get('search/name')
    @HttpCode(HttpStatus.OK)
    async searchProducts(@Query('name') name: string) {
        return this.productsService.searchByName(name);
    }

    @ApiOperation({
        summary: 'Buscar productos por categoría (Público)',
        description: 'Endpoint público para buscar productos por el nombre de la categoría.',
    })
    @ApiResponse({ status: 200, description: 'Lista de productos encontrados en la categoría.' })
    @Get('/search/category')
    async searchProductsByCategory(@Query('name') name: string) {
        return this.productsService.searchByCategory(name)
    }
}
