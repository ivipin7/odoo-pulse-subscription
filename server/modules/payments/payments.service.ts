import { pool } from '../../config/db';
import { paymentsRepository } from './payments.repository';
import { ProcessPaymentInput, RetryPaymentInput } from './payments.schema';

const MAX_RETRIES = 3;

/**
 * Simulate a payment gateway call.
 * In production, replace with real Razorpay/Stripe SDK.
 * Returns { success, transaction_ref, gateway_response }
 */
async function simulatePaymentGateway(
  amount: number,
  method: string
): Promise<{ success: boolean; transaction_ref: string; gateway_response: object; error?: string }> {
  // Simulate ~70% success rate for demo
  const success = Math.random() > 0.3;
  const transaction_ref = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success,
    transaction_ref,
    gateway_response: {
      gateway: 'simulated',
      amount,
      method,
      transaction_ref,
      status: success ? 'captured' : 'failed',
      timestamp: new Date().toISOString(),
      failure_reason: success ? null : 'Insufficient funds',
    },
    error: success ? undefined : 'Payment gateway declined: Insufficient funds',
  };
}

export const paymentsService = {
  /**
   * Process a new payment for an invoice.
   */
  async processPayment(data: ProcessPaymentInput, userId: string) {
    // Get the invoice
    const invoiceResult = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [data.invoice_id]
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) throw { status: 404, message: 'Invoice not found' };
    if (invoice.status === 'PAID') throw { status: 400, message: 'Invoice is already paid' };
    if (invoice.status === 'DRAFT') throw { status: 400, message: 'Invoice must be confirmed before payment' };

    // Call payment gateway
    const gatewayResult = await simulatePaymentGateway(
      parseFloat(invoice.total_amount),
      data.payment_method
    );

    const paymentStatus = gatewayResult.success ? 'SUCCESS' : 'FAILED';

    // Create payment record
    const payment = await paymentsRepository.create({
      invoice_id: data.invoice_id,
      user_id: userId,
      amount: parseFloat(invoice.total_amount),
      payment_method: data.payment_method,
      status: paymentStatus,
      transaction_ref: gatewayResult.transaction_ref,
      gateway_response: gatewayResult.gateway_response,
    });

    // Update invoice status
    const newInvoiceStatus = gatewayResult.success ? 'PAID' : 'FAILED';
    await pool.query(
      `UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newInvoiceStatus, data.invoice_id]
    );

    // If payment failed and invoice is linked to a subscription, mark subscription AT_RISK
    if (!gatewayResult.success && invoice.subscription_id) {
      await pool.query(
        `UPDATE subscriptions SET status = 'AT_RISK', updated_at = NOW()
         WHERE id = $1 AND status = 'ACTIVE'`,
        [invoice.subscription_id]
      );
    }

    // If payment succeeded and subscription was AT_RISK, restore to ACTIVE
    if (gatewayResult.success && invoice.subscription_id) {
      await pool.query(
        `UPDATE subscriptions SET status = 'ACTIVE', updated_at = NOW()
         WHERE id = $1 AND status = 'AT_RISK'`,
        [invoice.subscription_id]
      );
    }

    return {
      payment,
      invoice_status: newInvoiceStatus,
      gateway_success: gatewayResult.success,
      error: gatewayResult.error,
    };
  },

  /**
   * ═══════════════════════════════════════════════════════════════
   * CORE: Retry a failed payment with idempotency + row locking
   * ═══════════════════════════════════════════════════════════════
   * 
   * This is THE critical feature for the hackathon.
   * 
   * Flow:
   * 1. Acquire row lock on invoice (SELECT ... FOR UPDATE)
   * 2. Validate: invoice must be FAILED, retry count < MAX_RETRIES
   * 3. Call payment gateway
   * 4. Log retry attempt in payment_retries table
   * 5. If success: invoice → PAID, subscription → ACTIVE
   * 6. If fail + retries exhausted: subscription → CLOSED
   * 7. All within a single transaction for consistency
   */
  async retryPayment(invoiceId: string, data?: RetryPaymentInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Step 1: Lock the invoice row to prevent concurrent retries
      const invoice = await paymentsRepository.lockInvoiceForRetry(invoiceId, client);
      if (!invoice) {
        throw { status: 404, message: 'Invoice not found' };
      }

      // Step 2: Validate state
      if (invoice.status !== 'FAILED') {
        throw { status: 400, message: `Cannot retry: invoice status is ${invoice.status}, expected FAILED` };
      }

      const retryCount = await paymentsRepository.getRetryCount(invoiceId);
      if (retryCount >= MAX_RETRIES) {
        throw { status: 400, message: `Maximum retry attempts (${MAX_RETRIES}) exhausted for this invoice` };
      }

      const attemptNumber = retryCount + 1;
      const paymentMethod = data?.payment_method || 'CARD'; // Default to CARD

      // Step 3: Call payment gateway
      const gatewayResult = await simulatePaymentGateway(
        parseFloat(invoice.total_amount),
        paymentMethod
      );

      // Step 4: Log retry attempt
      await client.query(
        `INSERT INTO payment_retries (invoice_id, attempt_number, status, payment_method, gateway_response, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoiceId,
          attemptNumber,
          gatewayResult.success ? 'SUCCESS' : 'FAILED',
          paymentMethod,
          JSON.stringify(gatewayResult.gateway_response),
          gatewayResult.error || null,
        ]
      );

      if (gatewayResult.success) {
        // Step 5a: Success → Invoice PAID, create payment record
        await client.query(
          `UPDATE invoices SET status = 'PAID', updated_at = NOW() WHERE id = $1`,
          [invoiceId]
        );

        await client.query(
          `INSERT INTO payments (invoice_id, user_id, amount, payment_method, status, transaction_ref, gateway_response)
           VALUES ($1, $2, $3, $4, 'SUCCESS', $5, $6)`,
          [
            invoiceId,
            invoice.user_id,
            invoice.total_amount,
            paymentMethod,
            gatewayResult.transaction_ref,
            JSON.stringify(gatewayResult.gateway_response),
          ]
        );

        // Restore subscription to ACTIVE if it was AT_RISK
        if (invoice.subscription_id && invoice.subscription_status === 'AT_RISK') {
          await client.query(
            `UPDATE subscriptions SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
            [invoice.subscription_id]
          );
        }
      } else if (attemptNumber >= MAX_RETRIES) {
        // Step 6: All retries exhausted → close subscription
        if (invoice.subscription_id) {
          await client.query(
            `UPDATE subscriptions SET status = 'CLOSED', closed_reason = 'payment_failure', updated_at = NOW()
             WHERE id = $1`,
            [invoice.subscription_id]
          );
        }
      }

      await client.query('COMMIT');

      return {
        success: gatewayResult.success,
        attempt_number: attemptNumber,
        max_retries: MAX_RETRIES,
        retries_remaining: MAX_RETRIES - attemptNumber,
        invoice_status: gatewayResult.success ? 'PAID' : 'FAILED',
        subscription_status: gatewayResult.success
          ? 'ACTIVE'
          : attemptNumber >= MAX_RETRIES
          ? 'CLOSED'
          : 'AT_RISK',
        transaction_ref: gatewayResult.transaction_ref,
        error: gatewayResult.error,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getAllPayments(limit?: number, offset?: number) {
    return paymentsRepository.findAll(limit, offset);
  },

  async getPaymentsByUser(userId: string, limit?: number, offset?: number) {
    return paymentsRepository.findByUserId(userId, limit, offset);
  },

  async getPaymentById(id: string) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) throw { status: 404, message: 'Payment not found' };
    return payment;
  },

  async getPaymentsByInvoice(invoiceId: string) {
    return paymentsRepository.findByInvoiceId(invoiceId);
  },

  async getRetryHistory(invoiceId: string) {
    return paymentsRepository.getRetriesByInvoiceId(invoiceId);
  },

  // ── Recovery Dashboard ─────────────────────────────────────────

  async getRecoveryDashboard() {
    const [stats, atRisk, timeline] = await Promise.all([
      paymentsRepository.getRecoveryStats(),
      paymentsRepository.getAtRiskSubscriptions(),
      paymentsRepository.getRecoveryTimeline(),
    ]);

    return {
      stats: {
        failed_invoices: parseInt(stats.failed_invoices, 10),
        recovered_invoices: parseInt(stats.recovered_invoices, 10),
        at_risk_revenue: parseFloat(stats.at_risk_revenue),
        recovered_revenue: parseFloat(stats.recovered_revenue),
        at_risk_subscriptions: parseInt(stats.at_risk_subscriptions, 10),
        recovery_rate: stats.failed_invoices > 0
          ? ((parseInt(stats.recovered_invoices, 10) / (parseInt(stats.failed_invoices, 10) + parseInt(stats.recovered_invoices, 10))) * 100).toFixed(1)
          : '0.0',
      },
      at_risk_subscriptions: atRisk,
      recovery_timeline: timeline,
    };
  },

  async getAtRiskSubscriptions(limit?: number) {
    return paymentsRepository.getAtRiskSubscriptions(limit);
  },

  async getRecoveryTimeline(days?: number) {
    return paymentsRepository.getRecoveryTimeline(days);
  },
};
