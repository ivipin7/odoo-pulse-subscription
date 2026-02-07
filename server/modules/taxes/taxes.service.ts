import { TaxRepository } from './taxes.repository';
import { AppError } from '../../middleware/errorHandler';

export const TaxService = {
  async getAll() {
    return TaxRepository.findAll();
  },

  async create(data: any) {
    return TaxRepository.create(data);
  },

  async update(id: number, data: any) {
    const existing = await TaxRepository.findById(id);
    if (!existing) throw new AppError('Tax rule not found', 404, 'NOT_FOUND');
    return TaxRepository.update(id, data);
  },
};
