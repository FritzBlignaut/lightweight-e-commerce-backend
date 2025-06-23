import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock auth service
  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      // Mock data
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = { id: 1, email: 'test@example.com', role: 'CUSTOMER' };
      const loginResponse = { access_token: 'jwt-token' };

      // Setup mocks
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(loginResponse);

      // Execute
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(loginResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(user);
    });

    it('should propagate exceptions from validateUser', async () => {
      // Mock data
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      // Setup mocks
      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Execute & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      // Mock data
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
      };
      const registrationResponse = { access_token: 'jwt-token' };

      // Setup mocks
      mockAuthService.register.mockResolvedValue(registrationResponse);

      // Execute
      const result = await controller.register(registerDto);

      // Assert
      expect(result).toEqual(registrationResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should register a user with specified role', async () => {
      // Mock data
      const registerDto = {
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
      };
      const registrationResponse = { access_token: 'admin-jwt-token' };

      // Setup mocks
      mockAuthService.register.mockResolvedValue(registrationResponse);

      // Execute
      const result = await controller.register(registerDto);

      // Assert
      expect(result).toEqual(registrationResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      // Mock data
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      // Setup mocks to simulate error
      mockAuthService.register.mockRejectedValue(
        new Error('Email already exists'),
      );

      // Execute & Assert
      await expect(controller.register(registerDto)).rejects.toThrow();
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile from request object', () => {
      // Mock Request object
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
      };
      const mockRequest = {
        user: mockUser,
      } as unknown as Request;

      // Execute
      const result = controller.getProfile(mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
