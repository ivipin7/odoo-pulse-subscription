import { SubscriptionRepository } from './subscriptions.repository';
import { CreateSubscriptionInput } from './subscriptions.schema';
import { AppError } from '../../middleware/errorHandler';

// Valid transitions enforced here (service layer owns business logic)
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['QUOTATION'],
  QUOTATION: ['ACTIVE'],
  ACTIVE: ['AT_RISK'],
  AT_RISK: ['ACTIVE', 'CLOSED'],
};

export const SubscriptionService = {
  async getAll(userId?: number, role?: string) {
    // Admin roles see all, customers see only theirs
    if (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return SubscriptionRepository.findAll();
    }
    return SubscriptionRepository.findAll(userId);
  },

  async getById(id: number) {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    return sub;
  },

  async create(data: CreateSubscriptionInput) {
    return SubscriptionRepository.create(data);
  },

  async updateStatus(id: number, newStatus: string) {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    const allowed = VALID_TRANSITIONS[sub.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${sub.status} to ${newStatus}`,
        400,
        'INVALID_TRANSITION'
      );
    }

    return SubscriptionRepository.updateStatus(id, newStatus);
  },
};
