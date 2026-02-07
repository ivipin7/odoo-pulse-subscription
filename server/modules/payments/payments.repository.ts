import { pool } from '../../config/db';

export const paymentsRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT p.*, 
              u.name as user_name, u.email as user_email,
              i.invoice_number, i.total_amount as invoice_amount,
              s.id as subscription_id
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       ORDER BY p.payment_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findByUserId(userId: string, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT p.*, 
              i.invoice_number, i.total_amount as invoice_amount
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE p.user_id = $1
       ORDER BY p.payment_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT p.*, 
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              i.invoice_number, i.total_amount as invoice_amount, i.status as invoice_status,
              s.id as subscription_id, s.status as subscription_status,
              pr.name as product_name
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       LEFT JOIN products pr ON s.product_id = pr.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByInvoiceId(invoiceId: string) {
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE invoice_id = $1 
       ORDER BY payment_date DESC`,
      [invoiceId]
    );
    return result.rows;
  },

  async create(data: {
    invoice_id: string;
    user_id: string;
    amount: number;
    payment_method: string;
    status: string;
    transaction_ref?: string;
    gateway_response?: object;
  }) {
    const result = await pool.query(
      `INSERT INTO payments (invoice_id, user_id, amount, payment_method, status, transaction_ref, gateway_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.invoice_id, data.user_id, data.amount, data.payment_method, data.status, data.transaction_ref || null, data.gateway_response ? JSON.stringify(data.gateway_response) : null]
    );
    return result.rows[0];
  },

  async updateStatus(id: string, status: string, gatewayResponse?: object) {
    const result = await pool.query(
      `UPDATE payments SET status = $1, gateway_response = COALESCE($2, gateway_response), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [status, gatewayResponse ? JSON.stringify(gatewayResponse) : null]
    );
    return result.rows[0];
  },

  // ── Payment Retries (Recovery Engine) ──────────────────────────

  async getRetryCount(invoiceId: string) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM payment_retries WHERE invoice_id = $1`,
      [invoiceId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async createRetry(data: {
    invoice_id: string;
    attempt_number: number;
    status: string;
    payment_method: string;
    gateway_response?: object;
    error_message?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO payment_retries (invoice_id, attempt_number, status, payment_method, gateway_response, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.invoice_id, data.attempt_number, data.status, data.payment_method, data.gateway_response ? JSON.stringify(data.gateway_response) : null, data.error_message || null]
    );
    return result.rows[0];
  },

  async getRetriesByInvoiceId(invoiceId: string) {
    const result = await pool.query(
      `SELECT * FROM payment_retries 
       WHERE invoice_id = $1 
       ORDER BY attempt_number ASC`,
      [invoiceId]
    );
    return result.rows;
  },

  // ── Recovery Dashboard Queries ─────────────────────────────────

  async getRecoveryStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE i.status = 'FAILED') as failed_invoices,
        COUNT(*) FILTER (WHERE i.status = 'PAID' AND EXISTS (
          SELECT 1 FROM payment_retries pr WHERE pr.invoice_id = i.id
        )) as recovered_invoices,
        COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'FAILED'), 0) as at_risk_revenue,
        COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'PAID' AND EXISTS (
          SELECT 1 FROM payment_retries pr WHERE pr.invoice_id = i.id
        )), 0) as recovered_revenue,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'AT_RISK') as at_risk_subscriptions
      FROM invoices i
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.created_at >= NOW() - INTERVAL '30 days'
    `);
    return result.rows[0];
  },

  async getAtRiskSubscriptions(limit = 20) {
    const result = await pool.query(`
      SELECT s.*, 
             u.name as user_name, u.email as user_email,
             p.name as product_name,
             i.id as latest_invoice_id, i.invoice_number, i.total_amount,
             (SELECT COUNT(*) FROM payment_retries pr WHERE pr.invoice_id = i.id) as retry_count,
             (SELECT MAX(pr.attempted_at) FROM payment_retries pr WHERE pr.invoice_id = i.id) as last_retry_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      JOIN LATERAL (
        SELECT * FROM invoices inv 
        WHERE inv.subscription_id = s.id AND inv.status = 'FAILED'
        ORDER BY inv.created_at DESC LIMIT 1
      ) i ON true
      WHERE s.status = 'AT_RISK'
      ORDER BY i.total_amount DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  },

  async getRecoveryTimeline(days = 30) {
    const result = await pool.query(`
      SELECT 
        date_trunc('day', pr.attempted_at)::date as date,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE pr.status = 'SUCCESS') as successful,
        COUNT(*) FILTER (WHERE pr.status = 'FAILED') as failed,
        COALESCE(SUM(i.total_amount) FILTER (WHERE pr.status = 'SUCCESS'), 0) as recovered_amount
      FROM payment_retries pr
      JOIN invoices i ON pr.invoice_id = i.id
      WHERE pr.attempted_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY date_trunc('day', pr.attempted_at)::date
      ORDER BY date ASC
    `, [days]);
    return result.rows;
  },

  // ── Locking for Idempotent Retry ───────────────────────────────

  async lockInvoiceForRetry(invoiceId: string, client: any) {
    const result = await client.query(
      `SELECT i.*, s.id as subscription_id, s.status as subscription_status, s.user_id
       FROM invoices i
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       WHERE i.id = $1
       FOR UPDATE OF i`,
      [invoiceId]
    );
    return result.rows[0] || null;
  },
};
