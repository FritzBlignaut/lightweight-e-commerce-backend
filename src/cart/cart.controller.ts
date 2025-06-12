import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getOrCreateCart(req.user.userId);
  }

  @Post()
  addItem(@Request() req, @Body() body: AddCartItemDto) {
    return this.cartService.addItem(req.user.userId, body.productId, body.quantity);
  }

  @Patch()
  updateItem(@Request() req, @Body() body: { productId: string; quantity: number }) {
    return this.cartService.updateItem(req.user.userId, body.productId, body.quantity);
  }

  @Delete(':productId')
  removeItem(@Request() req, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @Post('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}
