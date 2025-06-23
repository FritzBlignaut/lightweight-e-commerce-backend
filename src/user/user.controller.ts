import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// Define interface for the authenticated request
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Get user information' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: RequestWithUser) {
    return req.user;
  }

  @ApiOperation({ summary: 'Create a new user' })
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
