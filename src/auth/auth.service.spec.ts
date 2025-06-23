import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  // Mock services
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    // Create spies for bcrypt methods
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve('hashedPassword'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'CUSTOMER',
      };

      // Setup mocks with proper typing - no need to redefine mockedBcrypt here
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Execute
      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'CUSTOMER',
      };

      // Setup mocks - use the pre-defined mockedBcrypt
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Execute & Assert
      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
    });
  });

  describe('login', () => {
    it('should generate a JWT token', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
      };
      const mockToken = 'jwt-token';

      // Setup mocks
      mockJwtService.sign.mockReturnValue(mockToken);

      // Execute
      const result = await service.login(mockUser);

      // Assert
      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    it('should create a new user and return JWT token', async () => {
      // Mock data
      const mockUserData = {
        email: 'new@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        id: 1,
        email: 'new@example.com',
        password: hashedPassword,
        role: 'CUSTOMER',
      };
      const mockToken = 'jwt-token';

      // Setup mocks
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      // Execute
      const result = await service.register(mockUserData);

      // Assert
      expect(result).toEqual({ access_token: mockToken });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: hashedPassword,
          role: 'CUSTOMER',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: createdUser.email,
        sub: createdUser.id,
        role: createdUser.role,
      });
    });

    it('should create a user with specified role', async () => {
      // Mock data
      const mockUserData = {
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        id: 1,
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      };

      // Setup mocks
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('admin-token');

      // Execute
      await service.register(mockUserData);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
    });
  });

  // Add more test cases for error scenarios and edge cases
  describe('error handling', () => {
    it('should handle database errors during user validation', async () => {
      // Setup mocks to throw an error
      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Execute & Assert
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow();
    });

    it('should handle database errors during user registration', async () => {
      // Setup mocks
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Execute & Assert
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow();
    });

    it('should handle bcrypt errors', async () => {
      // Setup mocks to simulate bcrypt error
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      // Execute & Assert
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow();
    });
  });
});
