import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // Mock AuthService
  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Mock data
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const registrationResponse = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      // Setup mock
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

      const registrationResponse = {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      // Setup mock
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

  describe('login', () => {
    it('should login a user and return token', async () => {
      // Mock data
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      const loginResponse = {
        access_token: 'jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'CUSTOMER',
        },
      };

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

    it('should handle invalid credentials', async () => {
      // Mock data
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Setup mock to simulate authentication failure
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      // Execute & Assert
      await expect(controller.login(loginDto)).rejects.toThrow();
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });
});
