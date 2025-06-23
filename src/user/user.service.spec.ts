import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

// Import and mock bcrypt properly for TypeScript
import * as bcrypt from 'bcrypt';

// Mock the entire bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
}));

describe('UserService', () => {
  let service: UserService;

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset bcrypt mock
    jest.mocked(bcrypt.hash).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Mock data
      const mockUsers = [
        { id: 1, email: 'user1@example.com', role: 'CUSTOMER' },
        { id: 2, email: 'user2@example.com', role: 'ADMIN' },
      ];

      // Setup mocks
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      // Execute
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Mock data
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashed_password';
      const mockCreatedUser = {
        id: 1,
        email: 'new@example.com',
        role: 'CUSTOMER',
      };

      // Setup mocks
      jest.mocked(bcrypt.hash).mockResolvedValueOnce(hashedPassword);
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // Execute
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: hashedPassword,
          role: 'CUSTOMER', // Default role
        },
      });
    });

    it('should create a user with specified role', async () => {
      // Mock data
      const createUserDto = {
        email: 'admin@example.com',
        password: 'password123',
        role: Role.ADMIN,
      };
      const hashedPassword = 'hashed_password';
      const mockCreatedUser = {
        id: 1,
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      // Setup mocks
      jest.mocked(bcrypt.hash).mockResolvedValueOnce(hashedPassword);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // Execute
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock data
      const createUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };
      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        role: 'CUSTOMER',
      };

      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      // Execute & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      // Mock data
      const email = 'test@example.com';
      const mockUser = { id: 1, email: 'test@example.com', role: 'CUSTOMER' };

      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Execute
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if user not found by email', async () => {
      // Mock data
      const email = 'nonexistent@example.com';

      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Execute
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });
});
