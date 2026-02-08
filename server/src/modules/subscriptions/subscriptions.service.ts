import { subscriptionsRepository } from "./subscriptions.repository.js";
import { AppError } from "../../utils/AppError.js";
import { db } from "../../db/pool.js";
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "./subscriptions.schema.js";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["QUOTATION"],
  QUOTATION: ["CONFIRMED", "DRAFT"],
  CONFIRMED: ["ACTIVE"],
  ACTIVE: ["CLOSED", "PAUSED", "CANCELLED"],
  PAUSED: ["ACTIVE", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

export const subscriptionsService = {
  async list(page: number, limit: number, filters: { status?: string; customerId?: string; search?: string }) {
    return subscriptionsRepository.findAll(page, limit, filters);
  },

  async getById(id: string) {
    const subscription = await subscriptionsRepository.findById(id);
    if (!subscription) throw new AppError(404, "NOT_FOUND", "Subscription not found");
    const lines = await subscriptionsRepository.getLines(id);
    return { ...subscription, lines };
  },

  async create(data: CreateSubscriptionInput, userId: string) {
    return subscriptionsRepository.create(data, userId);
  },

  async update(id: string, data: UpdateSubscriptionInput) {
    const existing = await subscriptionsRepository.findById(id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Subscription not found");
    if (existing.status !== "DRAFT" && existing.status !== "QUOTATION") {
      throw new AppError(400, "INVALID_STATE", "Can only edit subscriptions in DRAFT or QUOTATION status");
    }
    return subscriptionsRepository.update(id, data);
  },

  async updateStatus(id: string, newStatus: string, cancellationReason?: string) {
    const existing = await subscriptionsRepository.findById(id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Subscription not found");

    const allowed = STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(400, "INVALID_TRANSITION", `Cannot transition from ${existing.status} to ${newStatus}`);
    }

    // If pausing, check that the plan allows it
    if (newStatus === "PAUSED") {
      if (existing.recurring_plan_id) {
        const planResult = await db.query("SELECT pausable FROM recurring_plans WHERE id = $1", [existing.recurring_plan_id]);
        const plan = planResult.rows[0];
        if (plan && !plan.pausable) {
          throw new AppError(400, "NOT_PAUSABLE", "This subscription's plan does not allow pausing");
        }
      }
    }

    // Require reason for cancellation
    if (newStatus === "CANCELLED" && !cancellationReason) {
      throw new AppError(400, "REASON_REQUIRED", "A cancellation reason is required");
    }

    return subscriptionsRepository.updateStatus(id, newStatus, { cancellation_reason: cancellationReason });
  },

  async renew(id: string, userId: string) {
    const existing = await subscriptionsRepository.findById(id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Subscription not found");

    if (existing.status !== "CLOSED" && existing.status !== "CANCELLED") {
      throw new AppError(400, "INVALID_STATE", "Only CLOSED or CANCELLED subscriptions can be renewed");
    }

    // Check if plan is renewable
    if (existing.recurring_plan_id) {
      const planResult = await db.query("SELECT renewable FROM recurring_plans WHERE id = $1", [existing.recurring_plan_id]);
      const plan = planResult.rows[0];
      if (plan && !plan.renewable) {
        throw new AppError(400, "NOT_RENEWABLE", "This subscription's plan does not allow renewal");
      }
    }

    return subscriptionsRepository.renew(id, userId);
  },

  async delete(id: string) {
    const result = await subscriptionsRepository.delete(id);
    if (!result) throw new AppError(400, "DELETE_FAILED", "Can only delete DRAFT subscriptions");
    return result;
  },
};
