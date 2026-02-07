import { pool } from '../../config/db';
import { PaymentRepository } from './payments.repository';
import { ProcessPaymentInput } from './payments.schema';
import { AppError } from '../../middleware/errorHandler';

export const PaymentService = {
  async getAll(userId?: number, role?: string) {
    if (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return PaymentRepository.findAll();
    }
    return PaymentRepository.findAll(userId);
  },

  async getById(id: number) {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    return payment;
  },

  async processPayment(data: ProcessPaymentInput) {
    // Simulate gateway — Siva will enhance with retry engine
    const success = Math.random() > 0.3;
    const payment = await PaymentRepository.create({
      ...data,
      status: success ? 'SUCCESS' : 'FAILED',
    });

    if (success) {
      await pool.query("UPDATE invoices SET status = 'PAID' WHERE id = $1", [data.invoice_id]);
    } else {
      await pool.query("UPDATE invoices SET status = 'FAILED' WHERE id = $1 AND status = 'CONFIRMED'", [data.invoice_id]);
    }

    return payment;
  },

  /**
   * Retry a failed payment — SIVA OWNS THIS (payment-recovery)
   * Placeholder: Siva will implement the full transactional retry engine
   */
  async retryPayment(invoiceId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1 FOR UPDATE',
        [invoiceId]
      );
      const invoice = invoiceResult.rows[0];
      if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      if (invoice.status === 'PAID') throw new AppError('Invoice already paid', 400, 'ALREADY_PAID');
      if (invoice.status !== 'FAILED') throw new AppError('Only FAILED invoices can be retried', 400, 'INVALID_STATUS');
      if (invoice.retry_count >= 3) throw new AppError('Max retry limit (3) reached', 400, 'RETRY_LIMIT');

      const paymentSuccess = Math.random() > 0.4;
      const attemptNumber = invoice.retry_count + 1;

      await client.query(
        `INSERT INTO payment_retries (invoice_id, attempt_number, status, failure_reason)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, attemptNumber, paymentSuccess ? 'SUCCESS' : 'FAILED', paymentSuccess ? null : 'Simulated failure']
      );

      if (paymentSuccess) {
        await client.query(
          `UPDATE invoices SET status = 'PAID', retry_count = $1, last_retry_at = NOW() WHERE id = $2`,
          [attemptNumber, invoiceId]
        );
        await client.query(
          `INSERT INTO payments (payment_ref, invoice_id, user_id, amount, method, status)
           VALUES ($1, $2, $3, $4, 'UPI', 'SUCCESS')`,
          [`PAY-RETRY-${invoiceId}-${attemptNumber}`, invoiceId, invoice.user_id, invoice.total_amount]
        );
        await client.query(
          `UPDATE subscriptions SET status = 'ACTIVE' WHERE id = $1 AND status = 'AT_RISK'`,
          [invoice.subscription_id]
        );
      } else {
        await client.query(
          `UPDATE invoices SET retry_count = $1, last_retry_at = NOW() WHERE id = $2`,
          [attemptNumber, invoiceId]
        );
        if (attemptNumber >= 3) {
          await client.query(
            `UPDATE subscriptions SET status = 'CLOSED', closed_at = NOW() WHERE id = $1 AND status = 'AT_RISK'`,
            [invoice.subscription_id]
          );
        }
      }

      await client.query('COMMIT');
      return {
        invoiceId,
        attempt: attemptNumber,
        success: paymentSuccess,
        invoiceStatus: paymentSuccess ? 'PAID' : 'FAILED',
        subscriptionStatus: paymentSuccess ? 'ACTIVE' : (attemptNumber >= 3 ? 'CLOSED' : 'AT_RISK'),
        retriesRemaining: 3 - attemptNumber,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Recovery Dashboard KPIs */
  async getRecoveryDashboard() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM invoices WHERE status = 'FAILED') as failed_count,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'AT_RISK') as at_risk_count,
        (SELECT COUNT(*) FROM payment_retries WHERE status = 'SUCCESS') as recovered_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'FAILED') as revenue_at_risk,
        (SELECT COALESCE(SUM(i.total_amount), 0)
         FROM invoices i
         JOIN payment_retries pr ON pr.invoice_id = i.id
         WHERE pr.status = 'SUCCESS') as revenue_recovered
    `);
    return result.rows[0];
  },

  /** At-risk subscriptions */
  async getAtRiskSubscriptions() {
    const result = await pool.query(`
      SELECT s.*, u.name as customer_name, u.email,
        p.name as product_name,
        i.id as invoice_id, i.invoice_number, i.retry_count, i.total_amount,
        i.last_retry_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN invoices i ON i.subscription_id = s.id AND i.status = 'FAILED'
      WHERE s.status = 'AT_RISK'
      ORDER BY i.retry_count DESC, s.updated_at DESC
    `);
    return result.rows;
  },

  /** Recovery timeline audit log */
  async getRecoveryTimeline() {
    const result = await pool.query(`
      SELECT pr.*, i.invoice_number, u.name as customer_name
      FROM payment_retries pr
      JOIN invoices i ON pr.invoice_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY pr.attempted_at DESC
      LIMIT 20
    `);
    return result.rows;
  },
};
