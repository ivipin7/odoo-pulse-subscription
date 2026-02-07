import { DiscountRepository } from './discounts.repository';
import { AppError } from '../../middleware/errorHandler';

export const DiscountService = {
  async getAll() {
    return DiscountRepository.findAll();
  },

  async create(data: any) {
    const existing = await DiscountRepository.findByCode(data.code);
    if (existing) throw new AppError('Discount code already exists', 409, 'CONFLICT');
    return DiscountRepository.create(data);
  },

  async update(id: number, data: any) {
    const existing = await DiscountRepository.findById(id);
    if (!existing) throw new AppError('Discount not found', 404, 'NOT_FOUND');
    return DiscountRepository.update(id, data);
  },

  async validateCode(code: string, orderAmount: number) {
    const discount = await DiscountRepository.findByCode(code);
    if (!discount) throw new AppError('Invalid discount code', 404, 'NOT_FOUND');
    if (discount.status !== 'ACTIVE') throw new AppError('Discount is no longer active', 400, 'INACTIVE_DISCOUNT');

    const now = new Date();
    if (new Date(discount.valid_from) > now) throw new AppError('Discount not yet valid', 400, 'NOT_VALID_YET');
    if (new Date(discount.valid_until) < now) throw new AppError('Discount has expired', 400, 'EXPIRED');
    if (discount.max_uses > 0 && discount.used_count >= discount.max_uses) throw new AppError('Discount usage limit reached', 400, 'LIMIT_REACHED');
    if (orderAmount < discount.min_order) throw new AppError(`Minimum order of ₹${discount.min_order} required`, 400, 'MIN_ORDER');

    let discountAmount: number;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = Math.round(orderAmount * discount.value / 100 * 100) / 100;
    } else {
      discountAmount = discount.value;
    }

    return {
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discount_amount: discountAmount,
      final_amount: Math.max(0, orderAmount - discountAmount),
    };
  },
};
