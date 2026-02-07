import { quotationsRepository } from './quotations.repository';
import { CreateQuotationInput, UpdateQuotationStatusInput } from './quotations.schema';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'DECLINED', 'EXPIRED'],
  ACCEPTED: ['CONVERTED'],
};

export const quotationsService = {
  async getAllQuotations(limit?: number, offset?: number) {
    return quotationsRepository.findAll(limit, offset);
  },

  async getQuotationById(id: string) {
    const quotation = await quotationsRepository.findById(id);
    if (!quotation) throw { status: 404, message: 'Quotation not found' };
    return quotation;
  },

  async createQuotation(data: CreateQuotationInput) {
    return quotationsRepository.create(data);
  },

  async updateQuotationStatus(id: string, data: UpdateQuotationStatusInput) {
    const quotation = await quotationsRepository.findById(id);
    if (!quotation) throw { status: 404, message: 'Quotation not found' };

    const allowed = VALID_TRANSITIONS[quotation.status];
    if (!allowed || !allowed.includes(data.status)) {
      throw {
        status: 400,
        message: `Cannot transition from ${quotation.status} to ${data.status}. Allowed: ${allowed?.join(', ') || 'none'}`,
      };
    }

    return quotationsRepository.updateStatus(id, data.status);
  },

  async deleteQuotation(id: string) {
    const quotation = await quotationsRepository.findById(id);
    if (!quotation) throw { status: 404, message: 'Quotation not found' };
    if (quotation.status !== 'DRAFT') throw { status: 400, message: 'Only DRAFT quotations can be deleted' };
    return quotationsRepository.softDelete(id);
  },
};
