import { invoicesRepository } from "./invoices.repository.js";
import { AppError } from "../../utils/AppError.js";
import { db } from "../../db/pool.js";

export const invoicesService = {
  async list(page: number, limit: number, filters: { status?: string; customerId?: string }) {
    return invoicesRepository.findAll(page, limit, filters);
  },

  async getById(id: string) {
    const invoice = await invoicesRepository.findById(id);
    if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");
    const lines = await invoicesRepository.getLines(id);
    return { ...invoice, lines };
  },

  async generateFromSubscription(subscriptionId: string, userId: string) {
    // Guard: subscription must be ACTIVE or CONFIRMED
    const sub = await db.query("SELECT status FROM subscriptions WHERE id = $1", [subscriptionId]);
    if (!sub.rows[0]) throw new AppError(404, "NOT_FOUND", "Subscription not found");
    if (!['ACTIVE', 'CONFIRMED'].includes(sub.rows[0].status)) {
      throw new AppError(400, "INVALID_STATE", `Cannot generate invoice from a ${sub.rows[0].status} subscription. It must be ACTIVE or CONFIRMED.`);
    }

    // Guard: prevent duplicate invoices — check for existing unpaid invoice
    const existing = await db.query(
      "SELECT id, invoice_number FROM invoices WHERE subscription_id = $1 AND status IN ('DRAFT', 'CONFIRMED')",
      [subscriptionId]
    );
    if (existing.rows.length > 0) {
      throw new AppError(400, "DUPLICATE_INVOICE",
        `An unpaid invoice (${existing.rows[0].invoice_number}) already exists for this subscription. Please process or cancel it first.`);
    }

    return invoicesRepository.createFromSubscription(subscriptionId, userId);
  },

  async updateStatus(id: string, newStatus: string) {
    const existing = await invoicesRepository.findById(id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Invoice not found");

    const transitions: Record<string, string[]> = {
      DRAFT: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PAID", "FAILED", "CANCELLED"],
      FAILED: ["CONFIRMED", "CANCELLED"],
      PAID: [],
      CANCELLED: [],
    };

    const allowed = transitions[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(400, "INVALID_TRANSITION", `Cannot transition from ${existing.status} to ${newStatus}`);
    }

    // Auto-record payment when confirming an invoice
    if (newStatus === "CONFIRMED") {
      const updatedInvoice = await invoicesRepository.updateStatus(id, newStatus);

      // Automatically create a payment record for the full amount
      const { paymentsRepository } = await import("../payments/payments.repository.js");
      await paymentsRepository.create(
        {
          invoice_id: id,
          amount: parseFloat(existing.total),
          payment_method: "BANK_TRANSFER" as const,
          notes: "Auto-recorded on invoice confirmation",
        },
        existing.customer_id
      );

      // Re-fetch to get the updated status (should be PAID now)
      return invoicesRepository.findById(id);
    }

    return invoicesRepository.updateStatus(id, newStatus);
  },

  async generateRecurringInvoices(userId: string) {
    const due = await invoicesRepository.findDueSubscriptions();
    const results: { subscriptionId: string; subscriptionNumber: string; invoiceId?: string; invoiceNumber?: string; error?: string }[] = [];

    for (const sub of due) {
      try {
        const invoice = await invoicesRepository.createFromSubscription(sub.id, userId);
        results.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
        });
      } catch (err: any) {
        results.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          error: err.message,
        });
      }
    }

    return {
      generated: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      total: due.length,
      details: results,
    };
  },
};
