import { ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('product')
export class ProductController {
    constructor(private productService: ProductService) {}

    @ApiOperation({ summary: 'Get all products' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'minPrice', required: false })
    @ApiQuery({ name: 'maxPrice', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('minPrice') minPrice?: number,
        @Query('maxPrice') maxPrice?: number,
        @Query('limit') limit = 10,
        @Query('offset') offset = 0,) {
        return this.productService.findAll({
            search,
            minPrice: Number(minPrice),
            maxPrice: Number(maxPrice),
            limit: Number(limit),
            offset: Number(offset),
        });
    }

    @ApiOperation({ summary: 'Find a product by product id' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findOne(id);
    }

    @ApiOperation({ summary: 'Create a new product' })
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productService.create(createProductDto);
    }

    @ApiOperation({ summary: 'Update an existing product by product id' })
    @Post(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productService.update(id, updateProductDto);
    }

    @ApiOperation({ summary: 'Delete a product by product id' })
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productService.remove(id);
    }
}
