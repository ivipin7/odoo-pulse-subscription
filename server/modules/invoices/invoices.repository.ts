import { pool } from '../../config/db';

export const InvoiceRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT i.*, u.name as customer_name, u.email as customer_email,
        s.status as subscription_status, p.name as product_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN products p ON s.product_id = p.id
      WHERE i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `);
    return result.rows;
  },

  async findByUserId(userId: string) {
    const result = await pool.query(`
      SELECT i.*, p.name as product_name
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN products p ON s.product_id = p.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT i.*, u.name as customer_name, u.email as customer_email,
        u.company, u.gst_number,
        s.status as subscription_status, s.billing_period,
        p.name as product_name, pv.name as variant_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_variants pv ON s.variant_id = pv.id
      WHERE i.id = $1 AND i.deleted_at IS NULL
    `, [id]);
    return result.rows[0] || null;
  },

  async getNextInvoiceNumber() {
    const result = await pool.query(
      "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length === 0) return 'INV-2025-001';
    const last = result.rows[0].invoice_number;
    const num = parseInt(last.split('-')[2]) + 1;
    return `INV-2025-${String(num).padStart(3, '0')}`;
  },

  async create(data: {
    invoice_number: string;
    subscription_id: number;
    user_id: number;
    amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    due_date: string;
  }) {
    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, subscription_id, user_id, amount, tax_amount, discount_amount, total_amount, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.invoice_number, data.subscription_id, data.user_id, data.amount, data.tax_amount, data.discount_amount, data.total_amount, data.due_date]
    );
    return result.rows[0];
  },

  async updateStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  },
};
