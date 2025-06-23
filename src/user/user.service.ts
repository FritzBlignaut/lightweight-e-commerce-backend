import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async create(createUserDto: CreateUserDto) {
    // First, check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Fixed bcrypt call with explicit type casting
    // This tells TypeScript to trust us that the returned value is a string
    const hashedPassword: string = (await bcrypt.hash(
      createUserDto.password,
      10,
    )) as string;

    // Use type casting to ensure TypeScript knows this is a valid Role
    const userRole: Role = createUserDto.role || Role.CUSTOMER;

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        role: userRole,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
