import { discountsRepository } from './discounts.repository';
import { CreateDiscountInput, UpdateDiscountInput } from './discounts.schema';

export const discountsService = {
  async getAllDiscounts(limit?: number, offset?: number) {
    return discountsRepository.findAll(limit, offset);
  },

  async getDiscountById(id: string) {
    const discount = await discountsRepository.findById(id);
    if (!discount) throw { status: 404, message: 'Discount not found' };
    return discount;
  },

  async createDiscount(data: CreateDiscountInput) {
    const existing = await discountsRepository.findByCode(data.code);
    if (existing) throw { status: 409, message: `Discount code ${data.code} already exists` };
    return discountsRepository.create(data);
  },

  async updateDiscount(id: string, data: UpdateDiscountInput) {
    const discount = await discountsRepository.findById(id);
    if (!discount) throw { status: 404, message: 'Discount not found' };
    return discountsRepository.update(id, data);
  },

  async deleteDiscount(id: string) {
    const discount = await discountsRepository.findById(id);
    if (!discount) throw { status: 404, message: 'Discount not found' };
    return discountsRepository.softDelete(id);
  },

  async validateDiscountCode(code: string, orderAmount: number) {
    return discountsRepository.validateDiscount(code, orderAmount);
  },
};
