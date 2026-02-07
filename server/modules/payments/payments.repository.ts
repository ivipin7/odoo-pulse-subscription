import { pool } from '../../config/db';

/**
 * Payments Repository — SQL ONLY, no business logic
 * All payment, invoice, subscription, and retry audit queries
 */
export const PaymentRepository = {

  // ─────────────────────────────────────────────
  // INVOICE QUERIES
  // ─────────────────────────────────────────────

  /**
   * Get invoice by ID with row lock (FOR UPDATE) — used in retry transaction
   * Must be called within an active transaction client
   */
  async findInvoiceForUpdate(client: any, invoiceId: number) {
    const result = await client.query(
      'SELECT * FROM invoices WHERE id = $1 FOR UPDATE',
      [invoiceId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get invoice by ID (no lock — for read-only)
   */
  async findInvoiceById(invoiceId: number) {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND deleted_at IS NULL',
      [invoiceId]
    );
    return result.rows[0] || null;
  },

  /**
   * Mark invoice as PAID after successful retry
   */
  async markInvoicePaid(client: any, invoiceId: number, retryCount: number) {
    const result = await client.query(
      `UPDATE invoices
       SET status = 'PAID', retry_count = $1, last_retry_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [retryCount, invoiceId]
    );
    return result.rows[0];
  },

  /**
   * Increment invoice retry count after failed retry
   */
  async incrementInvoiceRetry(client: any, invoiceId: number, retryCount: number) {
    const result = await client.query(
      `UPDATE invoices
       SET retry_count = $1, last_retry_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [retryCount, invoiceId]
    );
    return result.rows[0];
  },

  // ─────────────────────────────────────────────
  // SUBSCRIPTION QUERIES
  // ─────────────────────────────────────────────

  /**
   * Recover subscription: AT_RISK → ACTIVE
   */
  async recoverSubscription(client: any, subscriptionId: number) {
    const result = await client.query(
      `UPDATE subscriptions
       SET status = 'ACTIVE', updated_at = NOW()
       WHERE id = $1 AND status = 'AT_RISK'
       RETURNING *`,
      [subscriptionId]
    );
    return result.rows[0];
  },

  /**
   * Close subscription: AT_RISK → CLOSED (retry limit exhausted)
   */
  async closeSubscription(client: any, subscriptionId: number) {
    const result = await client.query(
      `UPDATE subscriptions
       SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'AT_RISK'
       RETURNING *`,
      [subscriptionId]
    );
    return result.rows[0];
  },

  /**
   * Move subscription to AT_RISK when payment fails
   */
  async markSubscriptionAtRisk(client: any, subscriptionId: number) {
    const result = await client.query(
      `UPDATE subscriptions
       SET status = 'AT_RISK', updated_at = NOW()
       WHERE id = $1 AND status = 'ACTIVE'
       RETURNING *`,
      [subscriptionId]
    );
    return result.rows[0];
  },

  // ─────────────────────────────────────────────
  // PAYMENT RECORD QUERIES
  // ─────────────────────────────────────────────

  /**
   * Create a payment record (successful payment)
   */
  async createPayment(client: any, data: {
    paymentRef: string;
    invoiceId: number;
    userId: number;
    amount: number;
    method: string;
    status: string;
    gatewayRef?: string;
    failureReason?: string;
  }) {
    const result = await client.query(
      `INSERT INTO payments (payment_ref, invoice_id, user_id, amount, method, status, gateway_ref, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.paymentRef,
        data.invoiceId,
        data.userId,
        data.amount,
        data.method,
        data.status,
        data.gatewayRef || null,
        data.failureReason || null,
      ]
    );
    return result.rows[0];
  },

  /**
   * List all payments with invoice and user details
   */
  async findAllPayments(filters?: { status?: string; userId?: number; limit?: number; offset?: number }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.userId) {
      conditions.push(`p.user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const result = await pool.query(
      `SELECT p.*,
              i.invoice_number, i.status as invoice_status, i.retry_count,
              u.name as customer_name, u.email as customer_email
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN users u ON p.user_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payments p ${where}`,
      params
    );

    return {
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  /**
   * Find single payment by ID
   */
  async findPaymentById(paymentId: number) {
    const result = await pool.query(
      `SELECT p.*,
              i.invoice_number, i.status as invoice_status, i.retry_count,
              u.name as customer_name, u.email as customer_email
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [paymentId]
    );
    return result.rows[0] || null;
  },

  // ─────────────────────────────────────────────
  // PAYMENT RETRIES AUDIT LOG
  // ─────────────────────────────────────────────

  /**
   * Record a retry attempt in the audit log
   */
  async createRetryRecord(client: any, data: {
    invoiceId: number;
    paymentId: number | null;
    attemptNumber: number;
    status: string;
    failureReason: string | null;
  }) {
    const result = await client.query(
      `INSERT INTO payment_retries (invoice_id, payment_id, attempt_number, status, failure_reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.invoiceId, data.paymentId, data.attemptNumber, data.status, data.failureReason]
    );
    return result.rows[0];
  },

  // ─────────────────────────────────────────────
  // RECOVERY DASHBOARD QUERIES
  // ─────────────────────────────────────────────

  /**
   * Recovery Dashboard KPIs — single query for all metrics
   */
  async getRecoveryKPIs() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM invoices WHERE status = 'FAILED') as failed_count,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'AT_RISK') as at_risk_count,
        (SELECT COUNT(*) FROM payment_retries WHERE status = 'SUCCESS') as recovered_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'FAILED') as revenue_at_risk,
        (SELECT COALESCE(SUM(i.total_amount), 0)
         FROM invoices i
         JOIN payment_retries pr ON pr.invoice_id = i.id
         WHERE pr.status = 'SUCCESS') as revenue_recovered,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'CLOSED') as closed_count
    `);
    return result.rows[0];
  },

  /**
   * Get at-risk subscriptions with full details
   */
  async getAtRiskSubscriptions() {
    const result = await pool.query(`
      SELECT
        s.id as subscription_id,
        s.status as subscription_status,
        s.start_date,
        s.next_billing,
        s.billing_period,
        s.amount as subscription_amount,
        u.id as user_id,
        u.name as customer_name,
        u.email as customer_email,
        u.company as customer_company,
        u.phone as customer_phone,
        p.name as product_name,
        p.base_price as product_price,
        i.id as invoice_id,
        i.invoice_number,
        i.total_amount as invoice_amount,
        i.retry_count,
        i.last_retry_at,
        i.status as invoice_status,
        i.due_date as invoice_due_date
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN invoices i ON i.subscription_id = s.id AND i.status = 'FAILED'
      WHERE s.status = 'AT_RISK'
      ORDER BY i.retry_count DESC, s.updated_at DESC
    `);
    return result.rows;
  },

  /**
   * Recovery timeline — audit log of all retry attempts
   */
  async getRecoveryTimeline(limit: number = 20) {
    const result = await pool.query(
      `SELECT
        pr.id,
        pr.invoice_id,
        pr.payment_id,
        pr.attempt_number,
        pr.status,
        pr.failure_reason,
        pr.attempted_at,
        i.invoice_number,
        i.total_amount,
        i.retry_count,
        u.name as customer_name,
        u.email as customer_email,
        s.id as subscription_id,
        s.status as subscription_status,
        p.name as product_name
       FROM payment_retries pr
       JOIN invoices i ON pr.invoice_id = i.id
       JOIN users u ON i.user_id = u.id
       JOIN subscriptions s ON i.subscription_id = s.id
       JOIN products p ON s.product_id = p.id
       ORDER BY pr.attempted_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  // ─────────────────────────────────────────────
  // PROCESS PAYMENT (initial payment for invoice)
  // ─────────────────────────────────────────────

  /**
   * Mark invoice as CONFIRMED → ready for payment
   */
  async confirmInvoice(client: any, invoiceId: number) {
    const result = await client.query(
      `UPDATE invoices SET status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1 AND status = 'DRAFT'
       RETURNING *`,
      [invoiceId]
    );
    return result.rows[0];
  },

  /**
   * Mark invoice as FAILED after payment attempt
   */
  async failInvoice(client: any, invoiceId: number) {
    const result = await client.query(
      `UPDATE invoices SET status = 'FAILED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [invoiceId]
    );
    return result.rows[0];
  },
};
