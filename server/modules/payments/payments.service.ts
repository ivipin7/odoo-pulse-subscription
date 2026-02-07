import { pool } from '../../config/db';
import { PaymentRepository } from './payments.repository';

/**
 * ═══════════════════════════════════════════════════════════════
 * PAYMENT SERVICE — THE CORE RECOVERY ENGINE
 * ═══════════════════════════════════════════════════════════════
 *
 * This is the MOST IMPORTANT file in the entire project.
 * It contains the Failed Payment Retry Engine — the primary
 * differentiator for the hackathon demo.
 *
 * RULES (MEMORIZE):
 * 1. Only FAILED invoices can be retried
 * 2. Max 3 retries (enforced at service + DB level)
 * 3. Must be IDEMPOTENT — calling retry twice for same attempt = same result
 * 4. PAID invoices must NEVER be retried
 * 5. Every attempt is recorded in payment_retries audit log
 * 6. All state transitions are ATOMIC (single transaction)
 *
 * STATE MACHINES:
 *   Invoice:       DRAFT → CONFIRMED → FAILED → PAID
 *   Subscription:  DRAFT → QUOTATION → ACTIVE → AT_RISK → CLOSED
 *                                        ↑         ↓
 *                                        └── PAID ──┘ (recovery)
 *
 * TRANSITION TABLE:
 *   Payment fails        → Invoice: CONFIRMED → FAILED, Sub: ACTIVE → AT_RISK
 *   Retry succeeds       → Invoice: FAILED → PAID, Sub: AT_RISK → ACTIVE
 *   Retry limit (3) hit  → Invoice: stays FAILED, Sub: AT_RISK → CLOSED
 */
export const PaymentService = {

  // ─────────────────────────────────────────────────────────────
  // CORE: RETRY FAILED PAYMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Retry a failed payment for an invoice
   *
   * This is the PRIMARY FEATURE of the entire application.
   * Uses PostgreSQL transaction with row-level locking for safety.
   *
   * @param invoiceId - The ID of the failed invoice to retry
   * @returns Retry result with updated states
   * @throws Error if invoice not found, already paid, not failed, or limit reached
   */
  async retryPayment(invoiceId: number) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // ── Step 1: Lock the invoice row (prevent race conditions) ──
      const invoice = await PaymentRepository.findInvoiceForUpdate(client, invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }
      if (invoice.status === 'PAID') {
        throw new Error('Invoice already paid — cannot retry');
      }
      if (invoice.status !== 'FAILED') {
        throw new Error('Only FAILED invoices can be retried');
      }
      if (invoice.retry_count >= 3) {
        throw new Error('Maximum retry limit (3) reached');
      }

      // ── Step 2: Simulate payment gateway call ──
      const paymentSuccess = this.simulatePaymentGateway();

      // ── Step 3: Calculate attempt number ──
      const attemptNumber = invoice.retry_count + 1;

      // ── Step 4: Handle SUCCESS path ──
      if (paymentSuccess) {
        // Create successful payment record
        const payment = await PaymentRepository.createPayment(client, {
          paymentRef: `PAY-RETRY-${invoiceId}-${attemptNumber}`,
          invoiceId: invoiceId,
          userId: invoice.user_id,
          amount: parseFloat(invoice.total_amount),
          method: 'UPI',
          status: 'SUCCESS',
          gatewayRef: `GW-RETRY-${Date.now()}`,
        });

        // Record SUCCESS in audit log
        await PaymentRepository.createRetryRecord(client, {
          invoiceId,
          paymentId: payment.id,
          attemptNumber,
          status: 'SUCCESS',
          failureReason: null,
        });

        // Invoice: FAILED → PAID
        await PaymentRepository.markInvoicePaid(client, invoiceId, attemptNumber);

        // Subscription: AT_RISK → ACTIVE (recovery!)
        await PaymentRepository.recoverSubscription(client, invoice.subscription_id);

        await client.query('COMMIT');

        return {
          success: true,
          invoiceId,
          attempt: attemptNumber,
          invoiceStatus: 'PAID' as const,
          subscriptionStatus: 'ACTIVE' as const,
          retriesRemaining: 3 - attemptNumber,
          paymentRef: payment.payment_ref,
          message: `Payment recovered successfully on attempt ${attemptNumber}. Subscription restored to ACTIVE.`,
        };
      }

      // ── Step 5: Handle FAILURE path ──

      // Record FAILED attempt in audit log
      await PaymentRepository.createRetryRecord(client, {
        invoiceId,
        paymentId: null,
        attemptNumber,
        status: 'FAILED',
        failureReason: 'Payment gateway declined the transaction',
      });

      // Increment retry count on invoice
      await PaymentRepository.incrementInvoiceRetry(client, invoiceId, attemptNumber);

      // If all 3 retries exhausted → CLOSE the subscription
      if (attemptNumber >= 3) {
        await PaymentRepository.closeSubscription(client, invoice.subscription_id);

        await client.query('COMMIT');

        return {
          success: false,
          invoiceId,
          attempt: attemptNumber,
          invoiceStatus: 'FAILED' as const,
          subscriptionStatus: 'CLOSED' as const,
          retriesRemaining: 0,
          paymentRef: null,
          message: `All 3 retry attempts exhausted. Subscription has been CLOSED.`,
        };
      }

      // Still have retries remaining
      await client.query('COMMIT');

      return {
        success: false,
        invoiceId,
        attempt: attemptNumber,
        invoiceStatus: 'FAILED' as const,
        subscriptionStatus: 'AT_RISK' as const,
        retriesRemaining: 3 - attemptNumber,
        paymentRef: null,
        message: `Retry attempt ${attemptNumber} failed. ${3 - attemptNumber} retries remaining.`,
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // PROCESS INITIAL PAYMENT (simulate gateway for an invoice)
  // ─────────────────────────────────────────────────────────────

  /**
   * Process a payment for a CONFIRMED invoice
   * Simulates the initial payment attempt
   *
   * @param invoiceId - The invoice to process payment for
   * @param method - Payment method (UPI, CREDIT_CARD, etc.)
   * @returns Payment result
   */
  async processPayment(invoiceId: number, method: string = 'UPI') {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Lock and fetch the invoice
      const invoice = await PaymentRepository.findInvoiceForUpdate(client, invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }
      if (invoice.status === 'PAID') {
        throw new Error('Invoice already paid — cannot retry');
      }
      if (invoice.status !== 'CONFIRMED') {
        throw new Error('Only CONFIRMED invoices can be processed');
      }

      // Simulate payment gateway
      const paymentSuccess = this.simulatePaymentGateway();
      const paymentRef = `PAY-${invoiceId}-${Date.now()}`;

      if (paymentSuccess) {
        // Create payment record
        const payment = await PaymentRepository.createPayment(client, {
          paymentRef,
          invoiceId,
          userId: invoice.user_id,
          amount: parseFloat(invoice.total_amount),
          method,
          status: 'SUCCESS',
          gatewayRef: `GW-${Date.now()}`,
        });

        // Invoice → PAID
        await PaymentRepository.markInvoicePaid(client, invoiceId, 0);

        await client.query('COMMIT');

        return {
          success: true,
          invoiceId,
          paymentId: payment.id,
          paymentRef,
          invoiceStatus: 'PAID' as const,
          message: 'Payment processed successfully.',
        };
      }

      // Payment failed
      const payment = await PaymentRepository.createPayment(client, {
        paymentRef,
        invoiceId,
        userId: invoice.user_id,
        amount: parseFloat(invoice.total_amount),
        method,
        status: 'FAILED',
        failureReason: 'Payment gateway declined the transaction',
      });

      // Invoice → FAILED
      await PaymentRepository.failInvoice(client, invoiceId);

      // Subscription → AT_RISK
      await PaymentRepository.markSubscriptionAtRisk(client, invoice.subscription_id);

      await client.query('COMMIT');

      return {
        success: false,
        invoiceId,
        paymentId: payment.id,
        paymentRef,
        invoiceStatus: 'FAILED' as const,
        message: 'Payment failed. Subscription moved to AT_RISK. Retry available.',
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // PAYMENT GATEWAY SIMULATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Simulate a payment gateway response
   *
   * For DEMO: Override this to return deterministic results.
   * - Use `forceSuccess()` to guarantee next retry succeeds
   * - Use `forceFailure()` to guarantee next retry fails
   *
   * Default: ~60% success rate
   */
  simulatePaymentGateway(): boolean {
    // Check if demo mode override is set
    if (PaymentService._demoForceResult !== null) {
      const result = PaymentService._demoForceResult;
      PaymentService._demoForceResult = null; // one-shot
      return result;
    }
    return Math.random() > 0.4; // 60% success
  },

  // Demo mode control (for guaranteed demo outcomes)
  _demoForceResult: null as boolean | null,

  /**
   * Force the next payment attempt to succeed (for demo)
   */
  forceNextSuccess() {
    PaymentService._demoForceResult = true;
  },

  /**
   * Force the next payment attempt to fail (for demo)
   */
  forceNextFailure() {
    PaymentService._demoForceResult = false;
  },

  // ─────────────────────────────────────────────────────────────
  // READ OPERATIONS (LIST / GET BY ID)
  // ─────────────────────────────────────────────────────────────

  /**
   * List all payments with optional filters
   */
  async getAllPayments(filters?: { status?: string; userId?: number; limit?: number; offset?: number }) {
    return PaymentRepository.findAllPayments(filters);
  },

  /**
   * Get a single payment by ID
   */
  async getPaymentById(id: number) {
    const payment = await PaymentRepository.findPaymentById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  },

  // ─────────────────────────────────────────────────────────────
  // RECOVERY DASHBOARD
  // ─────────────────────────────────────────────────────────────

  /**
   * Recovery Dashboard KPIs
   * Returns: failed_count, at_risk_count, recovered_count,
   *          revenue_at_risk, revenue_recovered, closed_count
   */
  async getRecoveryDashboard() {
    return PaymentRepository.getRecoveryKPIs();
  },

  /**
   * Get at-risk subscriptions with full details
   * Returns subscriptions where status = 'AT_RISK' with
   * customer info, product info, invoice details, retry counts
   */
  async getAtRiskSubscriptions() {
    return PaymentRepository.getAtRiskSubscriptions();
  },

  /**
   * Get recovery timeline (audit log)
   * Returns last N retry attempts ordered by date
   */
  async getRecoveryTimeline(limit: number = 20) {
    return PaymentRepository.getRecoveryTimeline(limit);
  },
};
