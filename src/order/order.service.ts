import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async placeOrder(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId: Number(userId) },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Stock validation
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Not enough stock for ${item.product.name}`,
        );
      }
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId: Number(userId),
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Decrease stock
    for (const item of cart.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  }

  async getAllOrders(query: {
    page?: number;
    limit?: number;
    email?: string;
    minTotal?: number;
    maxTotal?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      email,
      minTotal,
      maxTotal,
      dateFrom,
      dateTo,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      AND: [
        email
          ? {
              user: {
                email: {
                  contains: email,
                  mode: 'insensitive',
                },
              },
            }
          : {},
        minTotal !== undefined ? { total: { gte: minTotal } } : {},
        maxTotal !== undefined ? { total: { lte: maxTotal } } : {},
        dateFrom
          ? {
              createdAt: {
                gte: new Date(dateFrom),
              },
            }
          : {},
        dateTo
          ? {
              createdAt: {
                lte: new Date(dateTo),
              },
            }
          : {},
      ],
    };

    const [orders, count] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId: Number(userId) },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    req: Request & { user: { userId: string } },
  ) {
    const userId = req.user.userId;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === status) {
      throw new BadRequestException('Order already has this status');
    }

    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      this.prisma.orderHistory.create({
        data: {
          orderId,
          changedById: Number(userId),
          fromStatus: order.status,
          toStatus: status,
        },
      }),
    ]);
  }

  async getOrderHistory(orderId: string) {
    return this.prisma.orderHistory.findMany({
      where: { orderId },
      include: {
        changedBy: {
          select: { id: true, email: true },
        },
      },
      orderBy: { changedAt: 'desc' },
    });
  }
}
