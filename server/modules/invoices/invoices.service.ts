import { InvoiceRepository } from './invoices.repository';
import { CreateInvoiceInput } from './invoices.schema';
import { AppError } from '../../middleware/errorHandler';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['CONFIRMED'],
  CONFIRMED: ['FAILED'],
  FAILED: ['PAID'],
};

export const InvoiceService = {
  async getAll(userId?: number, role?: string) {
    if (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return InvoiceRepository.findAll();
    }
    return InvoiceRepository.findAll(userId);
  },

  async getById(id: number) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    return invoice;
  },

  async create(data: CreateInvoiceInput) {
    return InvoiceRepository.create(data);
  },

  async updateStatus(id: number, newStatus: string) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

    const allowed = VALID_TRANSITIONS[invoice.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${invoice.status} to ${newStatus}`,
        400,
        'INVALID_TRANSITION'
      );
    }

    return InvoiceRepository.updateStatus(id, newStatus);
  },
};
