import { SubscriptionRepository } from './subscriptions.repository';
import { CreateSubscriptionInput } from './subscriptions.schema';

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['QUOTATION'],
  QUOTATION: ['ACTIVE'],
  ACTIVE: ['AT_RISK'],
  AT_RISK: ['ACTIVE', 'CLOSED'],
  CLOSED: [],
};

export const SubscriptionService = {
  async getAll(userId?: string, role?: string) {
    // Admins see all; customers see only their own
    if (role && ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(role)) {
      return SubscriptionRepository.findAll();
    }
    if (userId) return SubscriptionRepository.findByUserId(userId);
    return SubscriptionRepository.findAll();
  },

  async getById(id: number) {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw { status: 404, code: 'NOT_FOUND', message: 'Subscription not found' };
    return sub;
  },

  async create(data: CreateSubscriptionInput) {
    const today = new Date();
    const nextBilling = new Date(today);
    if (data.billing_period === 'MONTHLY') nextBilling.setMonth(nextBilling.getMonth() + 1);
    else if (data.billing_period === 'SEMI_ANNUAL') nextBilling.setMonth(nextBilling.getMonth() + 6);
    else nextBilling.setFullYear(nextBilling.getFullYear() + 1);

    return SubscriptionRepository.create({
      ...data,
      variant_id: data.variant_id,
      start_date: today.toISOString().split('T')[0],
      next_billing: nextBilling.toISOString().split('T')[0],
    });
  },

  async updateStatus(id: number, newStatus: string) {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw { status: 404, code: 'NOT_FOUND', message: 'Subscription not found' };

    const allowed = VALID_TRANSITIONS[sub.status] || [];
    if (!allowed.includes(newStatus)) {
      throw {
        status: 400,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${sub.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      };
    }

    return SubscriptionRepository.updateStatus(id, newStatus);
  },
};
