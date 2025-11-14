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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseService } from 'src/products/supabase.service';


@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService, private readonly supabaseService: SupabaseService,) { }

    @ApiOperation({
        summary: 'Crear producto (Administrador / Trabajador)',
        description: 'Crea un nuevo producto. Requiere autenticación y rol ADMINISTRADOR o TRABAJADOR. Enviar multipart/form-data con el campo "imagen".',
    })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Torta de chocolate' },
                description: { type: 'string', example: 'Torta grande para 10 personas' },
                price: { type: 'number', format: 'float', example: 25.5 },
                categoryId: { type: 'string', example: 'categoria-uuid-o-nombre' },
                imagen: { type: 'string', format: 'binary' },
            },
            required: ['name', 'price', 'categoryId', 'imagen'],
        },
    })
    @ApiResponse({ status: 201, description: 'Producto creado correctamente.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Acceso prohibido. Rol insuficiente.' })
    
    //@UseGuards(JwtAuthGuard, RolesGuard)
    //@Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    @Post('create')
    @UseInterceptors(FileInterceptor('imagen'))
    @HttpCode(HttpStatus.CREATED)
    async uploadProductImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() data: CreateProductDto,
    ) {
        if (!file) {
            console.error('No se recibió ningún archivo.');
        }
        const { publicUrl, path } = await this.supabaseService.uploadProductImage(file);

        return this.productsService.create(data, publicUrl, path);
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
