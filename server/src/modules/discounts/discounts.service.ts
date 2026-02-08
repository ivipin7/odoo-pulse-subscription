import { discountsRepository } from "./discounts.repository.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateDiscountInput } from "./discounts.schema.js";

export const discountsService = {
  async list() { return discountsRepository.findAll(); },

  async getById(id: string) {
    const d = await discountsRepository.findById(id);
    if (!d) throw new AppError(404, "NOT_FOUND", "Discount not found");
    return d;
  },

  async create(data: CreateDiscountInput, userId: string) {
    return discountsRepository.create(data, userId);
  },

  async update(id: string, data: Partial<CreateDiscountInput>) {
    const d = await discountsRepository.update(id, data);
    if (!d) throw new AppError(404, "NOT_FOUND", "Discount not found");
    return d;
  },

  async delete(id: string) {
    const d = await discountsRepository.delete(id);
    if (!d) throw new AppError(404, "NOT_FOUND", "Discount not found");
    return d;
  },

  async validate(discountId: string, subtotal: number, quantity: number) {
    const d = await discountsRepository.findById(discountId);
    if (!d || !d.is_active) return { valid: false, reason: "Discount not found or inactive" };

    const now = new Date();
    if (d.start_date && new Date(d.start_date) > now) return { valid: false, reason: "Discount not yet active" };
    if (d.end_date && new Date(d.end_date) < now) return { valid: false, reason: "Discount expired" };
    if (d.limit_usage && d.usage_count >= d.limit_usage) return { valid: false, reason: "Discount usage limit reached" };
    if (subtotal < parseFloat(d.min_purchase)) return { valid: false, reason: `Minimum purchase of ₹${d.min_purchase} required` };
    if (quantity < d.min_quantity) return { valid: false, reason: `Minimum quantity of ${d.min_quantity} required` };

    let discountAmount = 0;
    if (d.discount_type === "PERCENTAGE") {
      discountAmount = subtotal * (parseFloat(d.value) / 100);
    } else {
      discountAmount = parseFloat(d.value);
    }

    return { valid: true, discountAmount, discount: d };
  },

  async validateByCode(code: string, subtotal: number, quantity: number) {
    const d = await discountsRepository.findByCode(code);
    if (!d) return { valid: false, reason: "Invalid discount code" };
    return this.validate(d.id, subtotal, quantity);
  },
};
