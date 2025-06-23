import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

// Define type for the request object used in tests
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email?: string;
    role?: string;
  };
}

describe('OrderService', () => {
  let service: OrderService;

  // Mock PrismaService
  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    orderHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('placeOrder', () => {
    it('should successfully place an order and clear the cart', async () => {
      // Mock data
      const userId = '1';
      const mockCart = {
        id: 'cart-id',
        userId: 1,
        items: [
          {
            id: 'item1',
            cartId: 'cart-id',
            productId: 1,
            quantity: 2,
            product: {
              id: 1,
              name: 'Test Product',
              price: 10.99,
              stock: 5,
            },
          },
        ],
      };
      const mockOrder = {
        id: 'order-id',
        userId: 1,
        total: 21.98, // 2 * 10.99
        status: 'PLACED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({ id: 1, stock: 3 });
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      // Execute
      const result = await service.placeOrder(userId);

      // Assert
      expect(result).toEqual(mockOrder);

      // Check cart was found
      expect(mockPrismaService.cart.findFirst).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Check order was created
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          total: 21.98,
          items: {
            create: [
              {
                productId: 1,
                quantity: 2,
                price: 10.99,
              },
            ],
          },
        },
      });

      // Check stock was updated
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stock: { decrement: 2 },
        },
      });

      // Check cart was cleared
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-id' },
      });
    });

    it('should throw BadRequestException when cart is empty', async () => {
      // Mock data
      const userId = '1';

      // Setup mocks - empty cart
      mockPrismaService.cart.findFirst.mockResolvedValue({
        id: 'cart-id',
        userId: 1,
        items: [],
      });

      // Execute & Assert
      await expect(service.placeOrder(userId)).rejects.toThrow(
        new BadRequestException('Cart is empty'),
      );
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when cart is not found', async () => {
      // Mock data
      const userId = '1';

      // Setup mocks - no cart
      mockPrismaService.cart.findFirst.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.placeOrder(userId)).rejects.toThrow(
        new BadRequestException('Cart is empty'),
      );
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when not enough stock', async () => {
      // Mock data
      const userId = '1';
      const mockCart = {
        id: 'cart-id',
        userId: 1,
        items: [
          {
            id: 'item1',
            cartId: 'cart-id',
            productId: 1,
            quantity: 10, // More than available stock
            product: {
              id: 1,
              name: 'Test Product',
              price: 10.99,
              stock: 5, // Only 5 in stock
            },
          },
        ],
      };

      // Setup mocks
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);

      // Execute & Assert
      await expect(service.placeOrder(userId)).rejects.toThrow(
        new BadRequestException('Not enough stock for Test Product'),
      );
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllOrders', () => {
    it('should return paginated orders with filters', async () => {
      // Mock data
      const query = {
        page: 2,
        limit: 5,
        email: 'test',
        minTotal: 10,
        maxTotal: 100,
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31',
      };
      const mockOrders = [
        {
          id: 'order1',
          total: 50,
          status: 'PLACED',
          user: { id: 1, email: 'test@example.com' },
          items: [],
        },
      ];
      const mockCount = 15;

      // Setup mocks
      mockPrismaService.$transaction.mockResolvedValue([mockOrders, mockCount]);

      // Execute
      const result = await service.getAllOrders(query);

      // Assert
      expect(result).toEqual({
        data: mockOrders,
        total: mockCount,
        page: 2,
        limit: 5,
        totalPages: 3, // Math.ceil(15/5)
      });

      // Verify transaction was called
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle requests with default parameters', async () => {
      // Mock data - empty query
      const query = {};
      const mockOrders = [{ id: 'order1' }];
      const mockCount = 1;

      // Setup mocks
      mockPrismaService.$transaction.mockResolvedValue([mockOrders, mockCount]);

      // Execute
      const result = await service.getAllOrders(query);

      // Assert
      expect(result).toEqual({
        data: mockOrders,
        total: mockCount,
        page: 1, // Default
        limit: 10, // Default
        totalPages: 1,
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return orders for a specific user', async () => {
      // Mock data
      const userId = '1';
      const mockOrders = [
        {
          id: 'order1',
          userId: 1,
          total: 50,
          status: 'PLACED',
          items: [],
        },
      ];

      // Setup mocks
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      // Execute
      const result = await service.getOrders(userId);

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and create history entry', async () => {
      // Mock data
      const orderId = 'order-id';
      const status = OrderStatus.SHIPPED;
      // Create a properly typed request object
      const req: RequestWithUser = {
        user: {
          userId: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as RequestWithUser;

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PLACED,
      };
      const mockUpdatedOrder = {
        id: orderId,
        status: OrderStatus.SHIPPED,
      };
      const mockHistoryEntry = {
        id: 'history-id',
        orderId,
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.SHIPPED,
        changedById: 1,
      };

      // Setup mocks
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.$transaction.mockImplementation((operations) => {
        expect(operations).toHaveLength(2);
        return Promise.resolve([mockUpdatedOrder, mockHistoryEntry]);
      });

      // Execute
      const result = await service.updateOrderStatus(orderId, status, req);

      // Assert
      expect(result).toEqual([mockUpdatedOrder, mockHistoryEntry]);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      // Setup mocks
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      // Create a properly typed request object
      const req: RequestWithUser = {
        user: { userId: '1' },
      } as RequestWithUser;

      // Execute & Assert
      await expect(
        service.updateOrderStatus('non-existent', OrderStatus.SHIPPED, req),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when status is unchanged', async () => {
      // Mock data
      const orderId = 'order-id';
      const status = OrderStatus.PLACED; // Same status as current
      const mockOrder = {
        id: orderId,
        status: OrderStatus.PLACED,
      };

      // Create a properly typed request object
      const req: RequestWithUser = {
        user: { userId: '1' },
      } as RequestWithUser;

      // Setup mocks
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      // Execute & Assert
      await expect(
        service.updateOrderStatus(orderId, status, req),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getOrderHistory', () => {
    it('should return order history entries', async () => {
      // Mock data
      const orderId = 'order-id';
      const mockHistoryEntries = [
        {
          id: 'history1',
          orderId,
          fromStatus: OrderStatus.PLACED,
          toStatus: OrderStatus.SHIPPED,
          changedAt: new Date(),
          changedBy: { id: 1, email: 'admin@example.com' },
        },
      ];

      // Setup mocks
      mockPrismaService.orderHistory.findMany.mockResolvedValue(
        mockHistoryEntries,
      );

      // Execute
      const result = await service.getOrderHistory(orderId);

      // Assert
      expect(result).toEqual(mockHistoryEntries);
      expect(mockPrismaService.orderHistory.findMany).toHaveBeenCalledWith({
        where: { orderId },
        include: {
          changedBy: {
            select: { id: true, email: true },
          },
        },
        orderBy: { changedAt: 'desc' },
      });
    });
  });
});
