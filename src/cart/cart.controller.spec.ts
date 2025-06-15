import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

describe('CartController', () => {
  let controller: CartController;
  let cartService: CartService;

  // Mock CartService
  const mockCartService = {
    getOrCreateCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  };

  // Mock request with user
  const mockRequest = {
    user: { userId: '1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get<CartService>(CartService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return the user cart', async () => {
      // Mock data
      const mockCart = {
        id: 'cart-id',
        userId: 1,
        items: [
          {
            id: 'item-id',
            productId: 1,
            quantity: 2,
            product: {
              name: 'Test Product',
              price: 10.99,
            },
            subtotal: 21.98,
          },
        ],
        total: 21.98,
      };
      
      // Setup mock
      mockCartService.getOrCreateCart.mockResolvedValue(mockCart);

      // Execute
      const result = await controller.getCart(mockRequest);

      // Assert
      expect(result).toEqual(mockCart);
      expect(mockCartService.getOrCreateCart).toHaveBeenCalledWith('1');
    });
  });

  describe('addItem', () => {
    it('should add an item to the cart', async () => {
      // Mock data
      const addItemDto: AddCartItemDto = {
        productId: '1',
        quantity: 2,
      };
      const mockCartItem = {
        id: 'item-id',
        cartId: 'cart-id',
        productId: 1,
        quantity: 2,
      };
      
      // Setup mock
      mockCartService.addItem.mockResolvedValue(mockCartItem);

      // Execute
      const result = await controller.addItem(mockRequest, addItemDto);

      // Assert
      expect(result).toEqual(mockCartItem);
      expect(mockCartService.addItem).toHaveBeenCalledWith(
        '1',
        addItemDto.productId,
        addItemDto.quantity
      );
    });
  });

  describe('updateItem', () => {
    it('should update an item in the cart', async () => {
      // Mock data
      const updateItemDto = {
        productId: '1',
        quantity: 3,
      };
      const mockUpdatedItem = {
        id: 'item-id',
        cartId: 'cart-id',
        productId: 1,
        quantity: 3,
      };
      
      // Setup mock
      mockCartService.updateItem.mockResolvedValue(mockUpdatedItem);

      // Execute
      const result = await controller.updateItem(mockRequest, updateItemDto);

      // Assert
      expect(result).toEqual(mockUpdatedItem);
      expect(mockCartService.updateItem).toHaveBeenCalledWith(
        '1',
        updateItemDto.productId,
        updateItemDto.quantity
      );
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', async () => {
      // Mock data
      const productId = '1';
      const mockRemovedItem = {
        id: 'item-id',
        cartId: 'cart-id',
        productId: 1,
        quantity: 2,
      };
      
      // Setup mock
      mockCartService.removeItem.mockResolvedValue(mockRemovedItem);

      // Execute
      const result = await controller.removeItem(mockRequest, productId);

      // Assert
      expect(result).toEqual(mockRemovedItem);
      expect(mockCartService.removeItem).toHaveBeenCalledWith('1', productId);
    });
  });

  describe('clearCart', () => {
    it('should clear the cart', async () => {
      // Mock data
      const mockDeleteResult = { count: 2 };
      
      // Setup mock
      mockCartService.clearCart.mockResolvedValue(mockDeleteResult);

      // Execute
      const result = await controller.clearCart(mockRequest);

      // Assert
      expect(result).toEqual(mockDeleteResult);
      expect(mockCartService.clearCart).toHaveBeenCalledWith('1');
    });
  });
});
