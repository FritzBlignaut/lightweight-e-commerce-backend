import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany();
  }

  async create(data: {
    name: string;
    description: string;
    price: number;
    stock: number;
  }) {
    return this.prisma.product.create({ data });
  }

  async updateStock(productId: number, newStock: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
  }
}
