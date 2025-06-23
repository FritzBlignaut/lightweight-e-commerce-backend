import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductController', () => {
  let controller: ProductController;

  // Mock ProductService
  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products with default pagination', async () => {
      // Mock data
      const expectedResult = {
        items: [
          { id: 1, name: 'Product 1', price: 10.99, stock: 5 },
          { id: 2, name: 'Product 2', price: 20.99, stock: 10 },
        ],
        total: 2,
      };

      // Setup mock
      mockProductService.findAll.mockResolvedValue(expectedResult);

      // Execute
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProductService.findAll).toHaveBeenCalledWith({
        search: undefined,
        minPrice: NaN, // Number(undefined) is NaN
        maxPrice: NaN,
        limit: 10,
        offset: 0,
      });
    });

    it('should apply search and price filters correctly', async () => {
      // Mock data
      const expectedResult = {
        items: [{ id: 1, name: 'Test Product', price: 15.99, stock: 5 }],
        total: 1,
      };

      // Setup mock
      mockProductService.findAll.mockResolvedValue(expectedResult);

      // Execute
      const result = await controller.findAll('test', 10, 20, 10, 0);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProductService.findAll).toHaveBeenCalledWith({
        search: 'test',
        minPrice: 10,
        maxPrice: 20,
        limit: 10,
        offset: 0,
      });
    });

    it('should apply custom pagination correctly', async () => {
      // Mock data
      const expectedResult = {
        items: [
          { id: 5, name: 'Product 5', price: 50.99, stock: 5 },
          { id: 6, name: 'Product 6', price: 60.99, stock: 10 },
        ],
        total: 10,
      };

      // Setup mock
      mockProductService.findAll.mockResolvedValue(expectedResult);

      // Execute
      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        2,
        4,
      );

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProductService.findAll).toHaveBeenCalledWith({
        search: undefined,
        minPrice: NaN,
        maxPrice: NaN,
        limit: 2,
        offset: 4,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      // Mock data
      const productId = '1';
      const expectedProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockProductService.findOne.mockResolvedValue(expectedProduct);

      // Execute
      const result = await controller.findOne(productId);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(mockProductService.findOne).toHaveBeenCalledWith(productId);
    });

    it('should handle non-existent products', async () => {
      // Mock data
      const productId = '999';

      // Setup mock
      mockProductService.findOne.mockResolvedValue(null);

      // Execute
      const result = await controller.findOne(productId);

      // Assert
      expect(result).toBeNull();
      expect(mockProductService.findOne).toHaveBeenCalledWith(productId);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      // Mock data
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        description: 'New product description',
        price: 29.99,
        stock: 15,
      };
      const expectedProduct = {
        id: 3,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockProductService.create.mockResolvedValue(expectedProduct);

      // Execute
      const result = await controller.create(createProductDto);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(mockProductService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      // Mock data
      const productId = '1';
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 39.99,
      };
      const expectedProduct = {
        id: 1,
        name: 'Updated Product',
        description: 'Original description',
        price: 39.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockProductService.update.mockResolvedValue(expectedProduct);

      // Execute
      const result = await controller.update(productId, updateProductDto);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(mockProductService.update).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      // Mock data
      const productId = '1';
      const deletedProduct = {
        id: 1,
        name: 'Deleted Product',
        description: 'Description',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      mockProductService.remove.mockResolvedValue(deletedProduct);

      // Execute
      const result = await controller.remove(productId);

      // Assert
      expect(result).toEqual(deletedProduct);
      expect(mockProductService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
