import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Request } from 'express';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  // Mock UserService
  const mockUserService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return the user from request object', () => {
      // Mock data
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
      };
      
      // Mock request object with user property
      const mockRequest = {
        user: mockUser,
      } as unknown as Request;

      // Execute
      const result = controller.getMe(mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Mock data
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
      };
      const createdUser = {
        id: 1,
        email: 'new@example.com',
        role: 'CUSTOMER',
      };
      
      // Setup mock
      mockUserService.create.mockResolvedValue(createdUser);

      // Execute
      const result = await controller.create(createUserDto);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should create a user with specified role', async () => {
      // Mock data
      const createUserDto: CreateUserDto = {
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
      };
      const createdUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      
      // Setup mock
      mockUserService.create.mockResolvedValue(createdUser);

      // Execute
      const result = await controller.create(createUserDto);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle errors from userService.create', async () => {
      // Mock data
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };
      
      // Setup mock to throw an error
      mockUserService.create.mockRejectedValue(new Error('Email already exists'));

      // Execute & Assert
      await expect(controller.create(createUserDto)).rejects.toThrow('Email already exists');
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });
  });
});
