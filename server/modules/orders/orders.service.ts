import { ordersRepository } from './orders.repository';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schema';

export const ordersService = {
  async getAllOrders(limit?: number, offset?: number) {
    return ordersRepository.findAll(limit, offset);
  },

  async getOrdersByUser(userId: string, limit?: number, offset?: number) {
    return ordersRepository.findByUserId(userId, limit, offset);
  },

  async getOrderById(id: string) {
    const order = await ordersRepository.findById(id);
    if (!order) throw { status: 404, message: 'Order not found' };
    return order;
  },

  async createOrder(data: CreateOrderInput, userId: string) {
    return ordersRepository.create(data, userId);
  },

  async updateOrderStatus(id: string, data: UpdateOrderStatusInput) {
    const order = await ordersRepository.findById(id);
    if (!order) throw { status: 404, message: 'Order not found' };
    return ordersRepository.updateStatus(id, data.status);
  },
};
