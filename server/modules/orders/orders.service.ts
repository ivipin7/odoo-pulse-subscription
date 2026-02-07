import { OrderRepository } from './orders.repository';
import { CreateOrderInput } from './orders.schema';
import { AppError } from '../../middleware/errorHandler';

export const OrderService = {
  async getAll(userId: number, role?: string) {
    if (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return OrderRepository.findAll();
    }
    return OrderRepository.findAll(userId);
  },

  async getById(id: number) {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    return order;
  },

  async create(userId: number, data: CreateOrderInput) {
    return OrderRepository.create(userId, data);
  },
};
