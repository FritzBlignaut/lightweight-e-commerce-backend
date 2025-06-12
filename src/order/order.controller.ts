import { Body, Controller, Get, Param, Patch, Post, Query, Req, Request, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async placeOrder(@Request() req) {
    return this.orderService.placeOrder(req.user.userId);
  }

  @Get()
  async getOrders(@Request() req) {
    return this.orderService.getOrders(req.user.userId);
  }

  // GET /orders/admin?page=2&limit=5&email=gmail.com&minTotal=20&dateFrom=2024-01-01
  @Roles('ADMIN')
  @Get('admin')
  async getAllOrders(@Query() query: AdminOrderQueryDto) {
    const parsedQuery = {
      ...query,
      page: query.page !== undefined ? Number(query.page) : undefined,
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      minTotal: query.minTotal !== undefined ? Number(query.minTotal) : undefined,
      maxTotal: query.maxTotal !== undefined ? Number(query.maxTotal) : undefined,
    };
    return this.orderService.getAllOrders(parsedQuery);
  }

  @Patch('admin/:orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.orderService.updateOrderStatus(orderId, dto.status, req);
  }

  @Get('admin/:orderId/history')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getOrderHistory(@Param('orderId') orderId: string) {
    return this.orderService.getOrderHistory(orderId);
  }
}
