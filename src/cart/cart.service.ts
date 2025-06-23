import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId: Number(userId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: Number(userId) },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
      subtotal: item.quantity * item.product.price,
    }));

    const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items,
      totalCost,
    };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (quantity <= 0)
      throw new BadRequestException('Quantity must be at least 1');

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
    });

    const requestedQty = existing ? existing.quantity + quantity : quantity;

    if (requestedQty > product.stock) {
      throw new BadRequestException(`Only ${product.stock} item(s) in stock`);
    }

    if (existing) {
      return this.prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: Number(productId),
          },
        },
        data: {
          quantity: requestedQty,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: Number(productId),
        quantity: requestedQty,
      },
    });
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (quantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} item(s) in stock`);
    }

    return this.prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
      data: {
        quantity,
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
