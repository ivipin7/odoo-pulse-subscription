import { cartRepository } from './cart.repository';
import { AddToCartInput, UpdateCartItemInput } from './cart.schema';

export const cartService = {
  async getCart(userId: string) {
    const [items, totals] = await Promise.all([
      cartRepository.findByUserId(userId),
      cartRepository.getCartTotal(userId),
    ]);
    return {
      items,
      item_count: parseInt(totals.item_count, 10),
      total_quantity: parseInt(totals.total_quantity, 10) || 0,
      total_amount: parseFloat(totals.total_amount) || 0,
    };
  },

  async addToCart(userId: string, data: AddToCartInput) {
    return cartRepository.addItem(userId, data.product_id, data.variant_id || null, data.quantity);
  },

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemInput) {
    return cartRepository.updateQuantity(itemId, userId, data.quantity);
  },

  async removeFromCart(userId: string, itemId: string) {
    return cartRepository.removeItem(itemId, userId);
  },

  async clearCart(userId: string) {
    return cartRepository.clearCart(userId);
  },
};
