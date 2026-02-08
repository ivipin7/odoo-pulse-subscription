import { paymentsRepository } from "./payments.repository.js";
import { AppError } from "../../utils/AppError.js";
import type { CreatePaymentInput } from "./payments.schema.js";
import { db } from "../../db/pool.js";

export const paymentsService = {
  async list(page: number, limit: number, filters: { status?: string; customerId?: string }) {
    return paymentsRepository.findAll(page, limit, filters);
  },

  async getById(id: string) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) throw new AppError(404, "NOT_FOUND", "Payment not found");
    return payment;
  },

  async process(data: CreatePaymentInput, userId: string) {
    // Verify invoice exists and is confirmed
    const invoice = await db.query("SELECT * FROM invoices WHERE id = $1", [data.invoice_id]);
    if (!invoice.rows[0]) throw new AppError(404, "NOT_FOUND", "Invoice not found");
    if (invoice.rows[0].status !== "CONFIRMED" && invoice.rows[0].status !== "FAILED") {
      throw new AppError(400, "INVALID_STATE", "Invoice must be CONFIRMED to accept payment");
    }
    return paymentsRepository.create(data, invoice.rows[0].customer_id);
  },

  async retry(invoiceId: string) {
    const result = await paymentsRepository.retryFailed(invoiceId);
    if (!result) throw new AppError(400, "RETRY_FAILED", "Invoice not in FAILED state or not found");
    return result;
  },
};
