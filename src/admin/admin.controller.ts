import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

interface RequestWithUser extends Request {
  user: {
    userId: string | number;
    email: string;
    roles: string[];
  };
}

@Controller('admin')
export class AdminController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('dashboard')
  getDashboard(@Request() req: RequestWithUser) {
    return { message: `Welcome ${req.user.email}, to the admin dashboard!` };
  }
}
