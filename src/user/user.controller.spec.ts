import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserController', () => {
  let controller: UserController;

  // Mock UserService
  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Mock data
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
      };

      // Fix line 63: properly type the createdUser instead of using 'any'
      const createdUser: {
        id: number;
        email: string;
        role: string;
      } = {
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
      mockUserService.create.mockRejectedValue(
        new Error('Email already exists'),
      );

      // Execute & Assert
      await expect(controller.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });
  });
});
