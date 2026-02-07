import { InvoiceRepository } from './invoices.repository';
import { CreateInvoiceInput } from './invoices.schema';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['CONFIRMED'],
  CONFIRMED: ['FAILED', 'PAID'],
  FAILED: ['PAID'],  // via retry
  PAID: [],           // terminal state
};

export const InvoiceService = {
  async getAll(userId?: string, role?: string) {
    if (role && ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(role)) {
      return InvoiceRepository.findAll();
    }
    if (userId) return InvoiceRepository.findByUserId(userId);
    return InvoiceRepository.findAll();
  },

  async getById(id: number) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw { status: 404, code: 'NOT_FOUND', message: 'Invoice not found' };
    return invoice;
  },

  async create(data: CreateInvoiceInput) {
    const invoiceNumber = await InvoiceRepository.getNextInvoiceNumber();
    return InvoiceRepository.create({
      invoice_number: invoiceNumber,
      ...data,
    });
  },

  async updateStatus(id: number, newStatus: string) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw { status: 404, code: 'NOT_FOUND', message: 'Invoice not found' };

    const allowed = VALID_TRANSITIONS[invoice.status] || [];
    if (!allowed.includes(newStatus)) {
      throw {
        status: 400,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${invoice.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      };
    }

    return InvoiceRepository.updateStatus(id, newStatus);
  },
};
