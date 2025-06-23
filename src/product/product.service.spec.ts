import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryParams } from './dto/product-query.dto';

describe('ProductService', () => {
  let service: ProductService;

  // Mock PrismaService
  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      // Mock data
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10,
      };
      const mockProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      // Execute
      const result = await service.create(createProductDto);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: createProductDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return products with default pagination', async () => {
      // Mock data
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10.99, stock: 5 },
        { id: 2, name: 'Product 2', price: 20.99, stock: 10 },
      ];
      const mockCount = 2;
      const queryParams: ProductQueryParams = {};

      // Setup mocks - use mockImplementation like in the search test
      mockPrismaService.$transaction.mockImplementation((operations) => {
        // Check that operations is an array with 2 items
        expect(operations).toHaveLength(2);
        return Promise.resolve([mockProducts, mockCount]);
      });

      // Execute
      const result = await service.findAll(queryParams);

      // Assert
      expect(result).toEqual({ items: mockProducts, total: mockCount });

      // Only check that $transaction was called
      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Check that findMany and count were called with appropriate parameters
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 10,
        }),
      );

      expect(mockPrismaService.product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should apply search filter correctly', async () => {
      // Mock data
      const mockProducts = [
        { id: 1, name: 'Test Product', price: 10.99, stock: 5 },
      ];
      const mockCount = 1;
      const queryParams: ProductQueryParams = { search: 'test' };

      // Setup mocks - use mockImplementation to handle the array parameter
      mockPrismaService.$transaction.mockImplementation((operations) => {
        // Check that operations is an array with 2 items
        expect(operations).toHaveLength(2);
        return Promise.resolve([mockProducts, mockCount]);
      });

      // Execute
      const result = await service.findAll(queryParams);

      // Assert
      expect(result).toEqual({ items: mockProducts, total: mockCount });

      // Only check that $transaction was called
      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Check that findMany and count were called with appropriate filters
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );

      expect(mockPrismaService.product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply price filters correctly', async () => {
      // Mock data
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 15.99, stock: 5 },
        { id: 2, name: 'Product 2', price: 25.99, stock: 10 },
      ];
      const mockCount = 2;
      const queryParams: ProductQueryParams = { minPrice: 10, maxPrice: 30 };

      // Setup mocks
      mockPrismaService.$transaction.mockResolvedValue([
        mockProducts,
        mockCount,
      ]);

      // Execute
      await service.findAll(queryParams);

      // Assert
      // Remove this unused whereCondition or use it in an assertion
      /*
      const whereCondition = {
        price: {
          gte: 10,
          lte: 30,
        },
      };
      */

      // Verify the expected arguments were passed to $transaction
      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Check if findMany and count were called with the right price filters
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 10,
              lte: 30,
            },
          }),
        }),
      );

      expect(mockPrismaService.product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 10,
              lte: 30,
            },
          }),
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      // Mock data
      const mockProducts = [
        { id: 5, name: 'Product 5', price: 50.99, stock: 5 },
        { id: 6, name: 'Product 6', price: 60.99, stock: 10 },
      ];
      const mockCount = 10; // Total products
      const queryParams: ProductQueryParams = { limit: 2, offset: 4 };

      // Setup mocks
      mockPrismaService.$transaction.mockResolvedValue([
        mockProducts,
        mockCount,
      ]);

      // Execute
      const result = await service.findAll(queryParams);

      // Assert
      expect(result).toEqual({ items: mockProducts, total: mockCount });

      // Verify pagination parameters
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 4,
          take: 2,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      // Mock data
      const productId = '1';
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Execute
      const result = await service.findOne(productId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if product not found', async () => {
      // Mock data
      const productId = '999';

      // Setup mock
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Execute
      const result = await service.findOne(productId);

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should handle non-numeric IDs gracefully', async () => {
      // Mock data
      const productId = 'abc';

      // Execute
      await service.findOne(productId);

      // Assert - should try to convert to number but result in NaN
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: NaN },
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      // Mock data
      const productId = '1';
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 149.99,
      };
      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Product',
        description: 'Test description',
        price: 149.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockPrismaService.product.update.mockResolvedValue(mockUpdatedProduct);

      // Execute
      const result = await service.update(productId, updateProductDto);

      // Assert
      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateProductDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      // Mock data
      const productId = '1';
      const mockDeletedProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockPrismaService.product.delete.mockResolvedValue(mockDeletedProduct);

      // Execute
      const result = await service.remove(productId);

      // Assert
      expect(result).toEqual(mockDeletedProduct);
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
