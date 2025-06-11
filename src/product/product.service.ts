import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  findAll() {
    return this.prisma.product.findMany();
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
