import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Request as ExpressRequest } from 'express';

// Define interface for authenticated request
interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req: RequestWithUser) {
    return this.cartService.getOrCreateCart(req.user.userId);
  }

  @Post()
  addItem(@Request() req: RequestWithUser, @Body() body: AddCartItemDto) {
    return this.cartService.addItem(
      req.user.userId,
      body.productId,
      body.quantity,
    );
  }

  @Patch()
  updateItem(
    @Request() req: RequestWithUser,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.updateItem(
      req.user.userId,
      body.productId,
      body.quantity,
    );
  }

  @Delete(':productId')
  removeItem(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @Post('clear')
  clearCart(@Request() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.userId);
  }
}
