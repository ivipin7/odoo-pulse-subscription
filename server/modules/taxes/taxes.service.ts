import { taxesRepository } from './taxes.repository';
import { CreateTaxRuleInput, UpdateTaxRuleInput } from './taxes.schema';

export const taxesService = {
  async getAllTaxRules(limit?: number, offset?: number) {
    return taxesRepository.findAll(limit, offset);
  },

  async getTaxRuleById(id: string) {
    const rule = await taxesRepository.findById(id);
    if (!rule) throw { status: 404, message: 'Tax rule not found' };
    return rule;
  },

  async createTaxRule(data: CreateTaxRuleInput) {
    return taxesRepository.create(data);
  },

  async updateTaxRule(id: string, data: UpdateTaxRuleInput) {
    const rule = await taxesRepository.findById(id);
    if (!rule) throw { status: 404, message: 'Tax rule not found' };
    return taxesRepository.update(id, data);
  },

  async deleteTaxRule(id: string) {
    const rule = await taxesRepository.findById(id);
    if (!rule) throw { status: 404, message: 'Tax rule not found' };
    return taxesRepository.softDelete(id);
  },

  async calculateTax(amount: number, region: string) {
    return taxesRepository.calculateTax(amount, region);
  },
};
