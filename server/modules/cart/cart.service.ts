import { CartRepository } from './cart.repository';
import { AddCartItemInput, UpdateCartItemInput } from './cart.schema';
import { AppError } from '../../middleware/errorHandler';

export const CartService = {
  async getCart(userId: number) {
    return CartRepository.findByUser(userId);
  },

  async addItem(userId: number, data: AddCartItemInput) {
    return CartRepository.addItem(userId, data);
  },

  async updateItem(id: number, userId: number, data: UpdateCartItemInput) {
    const item = await CartRepository.updateQuantity(id, userId, data.quantity);
    if (!item) throw new AppError('Cart item not found', 404, 'NOT_FOUND');
    return item;
  },

  async removeItem(id: number, userId: number) {
    await CartRepository.removeItem(id, userId);
    return { message: 'Item removed from cart' };
  },

  async clearCart(userId: number) {
    await CartRepository.clearCart(userId);
    return { message: 'Cart cleared' };
  },
};
