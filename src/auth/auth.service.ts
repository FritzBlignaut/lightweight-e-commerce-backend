import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    // Fix bcrypt compare type safety issue
    const isMatch = (await bcrypt.compare(password, user.password)) as boolean;
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  // Fix async method with no await by removing async or adding necessary await
  login(user: { id: number; email: string; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: { email: string; password: string; role?: string }) {
    // Fix bcrypt hash type safety issue
    const hashed = (await bcrypt.hash(data.password, 10)) as string;

    // Fix Role type safety by using proper typing
    const role: Role = (data.role as Role) || 'CUSTOMER';

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        role: role,
      },
    });

    return this.login(user);
  }
}
