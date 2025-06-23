import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;

  // Create a mock for PrismaService with all the methods we need
  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      // Setup
      const userId = '1';
      const mockCartItems = [
        {
          id: 'item1',
          productId: 1,
          quantity: 2,
          product: { id: 1, name: 'Test Product', price: 10.99, stock: 10 },
        },
      ];

      const mockCart = {
        id: 'cart1',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: mockCartItems,
      };

      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);

      // Execute
      const result = await service.getOrCreateCart(userId);

      // Assert
      expect(mockPrismaService.cart.findFirst).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      expect(mockPrismaService.cart.create).not.toHaveBeenCalled();

      expect(result).toEqual({
        id: 'cart1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: [
          {
            id: 'item1',
            productId: 1,
            quantity: 2,
            product: { id: 1, name: 'Test Product', price: 10.99, stock: 10 },
            subtotal: 21.98,
          },
        ],
        totalCost: 21.98,
      });
    });

    it('should create new cart if none exists', async () => {
      // Setup
      const userId = '1';

      mockPrismaService.cart.findFirst.mockResolvedValue(null);

      const mockNewCart = {
        id: 'newCart1',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };

      mockPrismaService.cart.create.mockResolvedValue(mockNewCart);

      // Execute
      const result = await service.getOrCreateCart(userId);

      // Assert
      expect(mockPrismaService.cart.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.cart.create).toHaveBeenCalledWith({
        data: { userId: 1 },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'newCart1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: [],
        totalCost: 0,
      });
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      // Setup
      const userId = '1';
      const productId = '1';
      const quantity = 2;

      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        stock: 10,
      };

      // Mock service's own getOrCreateCart method
      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      const mockCreatedItem = {
        id: 'newItem1',
        cartId: 'cart1',
        productId: 1,
        quantity: 2,
      };

      mockPrismaService.cartItem.create.mockResolvedValue(mockCreatedItem);

      // Execute
      const result = await service.addItem(userId, productId, quantity);

      // Assert
      expect(service.getOrCreateCart).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.cartItem.findUnique).toHaveBeenCalledWith({
        where: {
          cartId_productId: {
            cartId: 'cart1',
            productId: 1,
          },
        },
      });

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart1',
          productId: 1,
          quantity: 2,
        },
      });

      expect(result).toEqual(mockCreatedItem);
    });

    it('should update quantity if item already exists in cart', async () => {
      // Setup
      const userId = '1';
      const productId = '1';
      const quantity = 2;

      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        stock: 10,
      };

      const existingItem = {
        id: 'existingItem1',
        cartId: 'cart1',
        productId: 1,
        quantity: 1,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(existingItem);

      const updatedItem = {
        ...existingItem,
        quantity: 3, // 1 (existing) + 2 (new)
      };

      mockPrismaService.cartItem.update.mockResolvedValue(updatedItem);

      // Execute
      const result = await service.addItem(userId, productId, quantity);

      // Assert
      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: {
          cartId_productId: {
            cartId: 'cart1',
            productId: 1,
          },
        },
        data: {
          quantity: 3,
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should throw BadRequestException if quantity is less than 1', async () => {
      // Execute & Assert
      await expect(service.addItem('1', '1', 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addItem('1', '1', -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Setup
      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.addItem('1', '999', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if requested quantity exceeds stock', async () => {
      // Setup
      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        stock: 2,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.addItem('1', '1', 3)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      // Setup
      const userId = '1';
      const productId = '1';
      const quantity = 3;

      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        stock: 5,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const updatedItem = {
        id: 'item1',
        cartId: 'cart1',
        productId: 1,
        quantity: 3,
      };

      mockPrismaService.cartItem.update.mockResolvedValue(updatedItem);

      // Execute
      const result = await service.updateItem(userId, productId, quantity);

      // Assert
      expect(service.getOrCreateCart).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: {
          cartId_productId: {
            cartId: 'cart1',
            productId: 1,
          },
        },
        data: {
          quantity: 3,
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should throw BadRequestException if quantity is less than 1', async () => {
      // Execute & Assert
      await expect(service.updateItem('1', '1', 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateItem('1', '1', -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Setup
      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.updateItem('1', '999', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if requested quantity exceeds stock', async () => {
      // Setup
      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        stock: 2,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Execute & Assert
      await expect(service.updateItem('1', '1', 3)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      // Setup
      const userId = '1';
      const productId = '1';

      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);

      const deletedItem = {
        id: 'item1',
        cartId: 'cart1',
        productId: 1,
        quantity: 2,
      };

      mockPrismaService.cartItem.delete.mockResolvedValue(deletedItem);

      // Execute
      const result = await service.removeItem(userId, productId);

      // Assert
      expect(service.getOrCreateCart).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.cartItem.delete).toHaveBeenCalledWith({
        where: {
          cartId_productId: {
            cartId: 'cart1',
            productId: 1,
          },
        },
      });

      expect(result).toEqual(deletedItem);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      // Setup
      const userId = '1';

      const mockCart = {
        id: 'cart1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        totalCost: 0,
      };

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(mockCart);

      const deleteResult = { count: 3 };
      mockPrismaService.cartItem.deleteMany.mockResolvedValue(deleteResult);

      // Execute
      const result = await service.clearCart(userId);

      // Assert
      expect(service.getOrCreateCart).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart1' },
      });

      expect(result).toEqual(deleteResult);
    });
  });
});
