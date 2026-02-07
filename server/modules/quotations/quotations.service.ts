import { QuotationRepository } from './quotations.repository';
import { CreateQuotationInput } from './quotations.schema';
import { AppError } from '../../middleware/errorHandler';

export const QuotationService = {
  async getAll() {
    return QuotationRepository.findAll();
  },

  async getById(id: number) {
    const q = await QuotationRepository.findById(id);
    if (!q) throw new AppError('Quotation not found', 404, 'NOT_FOUND');
    return q;
  },

  async create(data: CreateQuotationInput) {
    return QuotationRepository.create(data);
  },

  async updateStatus(id: number, newStatus: string) {
    const q = await QuotationRepository.findById(id);
    if (!q) throw new AppError('Quotation not found', 404, 'NOT_FOUND');
    return QuotationRepository.updateStatus(id, newStatus);
  },
};
