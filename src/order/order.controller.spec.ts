import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatus } from '@prisma/client';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

// Define the RequestWithUser interface to match the one in controller
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

describe('OrderController', () => {
  let controller: OrderController;

  // Mock OrderService
  const mockOrderService = {
    placeOrder: jest.fn(),
    getOrders: jest.fn(),
    getAllOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrderHistory: jest.fn(),
  };

  // Create a reusable mock request to reduce duplication
  const createMockRequest = (role: string = 'CUSTOMER', userId: string = '1') =>
    ({
      user: {
        userId,
        email: role === 'ADMIN' ? 'admin@example.com' : 'user@example.com',
        role,
      },
    }) as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('placeOrder', () => {
    it('should place an order for the authenticated user', async () => {
      // Use the helper function to create mock request
      const mockRequest = createMockRequest();

      const mockOrder = {
        id: 'order-id',
        userId: 1,
        total: 99.99,
        status: 'PLACED',
      };

      // Setup mock
      mockOrderService.placeOrder.mockResolvedValue(mockOrder);

      // Execute
      const result = await controller.placeOrder(mockRequest);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrderService.placeOrder).toHaveBeenCalledWith('1');
    });
  });

  describe('getOrders', () => {
    it('should get orders for the authenticated user', async () => {
      // Mock data with proper typing
      const mockRequest = {
        user: {
          userId: '1',
          email: 'test@example.com',
          role: 'CUSTOMER',
        },
      } as RequestWithUser;

      const mockOrders = [
        {
          id: 'order-id',
          userId: 1,
          total: 99.99,
          status: 'PLACED',
        },
      ];

      // Setup mock
      mockOrderService.getOrders.mockResolvedValue(mockOrders);

      // Execute
      const result = await controller.getOrders(mockRequest);

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith('1');
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders with pagination and filters for admin', async () => {
      // No changes needed for this test as it doesn't use the request object
      const mockQuery: AdminOrderQueryDto = {
        page: '2',
        limit: '5',
        email: 'test@example.com',
        minTotal: '20',
        maxTotal: '100',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };
      const mockParsedQuery = {
        page: 2,
        limit: 5,
        email: 'test@example.com',
        minTotal: 20,
        maxTotal: 100,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };
      const mockResult = {
        data: [
          {
            id: 'order-id',
            userId: 1,
            total: 50,
            status: 'PLACED',
            user: { email: 'test@example.com' },
          },
        ],
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
      };

      // Setup mock
      mockOrderService.getAllOrders.mockResolvedValue(mockResult);

      // Execute
      const result = await controller.getAllOrders(mockQuery);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOrderService.getAllOrders).toHaveBeenCalledWith(
        mockParsedQuery,
      );
    });

    it('should handle empty query parameters', async () => {
      // No changes needed for this test as it doesn't use the request object
      const mockQuery = {} as AdminOrderQueryDto;
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      // Setup mock
      mockOrderService.getAllOrders.mockResolvedValue(mockResult);

      // Execute
      const result = await controller.getAllOrders(mockQuery);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOrderService.getAllOrders).toHaveBeenCalledWith({});
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      // Mock data with proper typing
      const orderId = 'order-id';
      const dto: UpdateOrderStatusDto = {
        status: OrderStatus.SHIPPED,
      };
      const mockRequest = {
        user: {
          userId: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as RequestWithUser;

      const mockUpdatedOrder = {
        id: 'order-id',
        status: OrderStatus.SHIPPED,
      };

      // Setup mock
      mockOrderService.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      // Execute
      const result = await controller.updateStatus(orderId, dto, mockRequest);

      // Assert
      expect(result).toEqual(mockUpdatedOrder);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        dto.status,
        mockRequest,
      );
    });
  });

  describe('getOrderHistory', () => {
    it('should get order history', async () => {
      // No changes needed for this test as it doesn't use the request object
      const orderId = 'order-id';
      const mockHistory = [
        {
          id: 'history-id',
          orderId,
          fromStatus: OrderStatus.PLACED,
          toStatus: OrderStatus.SHIPPED,
          changedAt: new Date(),
          changedBy: {
            id: 1,
            email: 'admin@example.com',
          },
        },
      ];

      // Setup mock
      mockOrderService.getOrderHistory.mockResolvedValue(mockHistory);

      // Execute
      const result = await controller.getOrderHistory(orderId);

      // Assert
      expect(result).toEqual(mockHistory);
      expect(mockOrderService.getOrderHistory).toHaveBeenCalledWith(orderId);
    });
  });
});
