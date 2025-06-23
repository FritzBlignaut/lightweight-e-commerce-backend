import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryParams } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  async findAll(params: ProductQueryParams) {
    const { search, minPrice, maxPrice, limit = 10, offset = 0 } = params;

    // Use Prisma's generated type for the where clause
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined)
        where.price = { ...where.price, gte: minPrice };
      if (maxPrice !== undefined)
        where.price = { ...where.price, lte: maxPrice };
    }

    // Use the transaction with proper typing
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, skip: offset, take: limit }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({ where: { id: Number(id) } });
  }

  update(id: string, data: UpdateProductDto) {
    return this.prisma.product.update({ where: { id: Number(id) }, data });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id: Number(id) } });
  }
}
