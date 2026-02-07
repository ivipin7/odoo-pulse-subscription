import { pool } from '../../config/db';

export const InvoiceRepository = {
  async findAll(userId?: number) {
    let query = `
      SELECT i.*, u.name as customer_name, u.email as customer_email,
             s.status as subscription_status, p.name as product_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN products p ON s.product_id = p.id
      WHERE i.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (userId) {
      query += ' AND i.user_id = $1';
      params.push(userId);
    }
    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT i.*, u.name as customer_name, u.email as customer_email,
             s.status as subscription_status, p.name as product_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN products p ON s.product_id = p.id
      WHERE i.id = $1 AND i.deleted_at IS NULL
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: any) {
    // Generate invoice number
    const countResult = await pool.query('SELECT COUNT(*) FROM invoices');
    const num = parseInt(countResult.rows[0].count) + 1;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, subscription_id, user_id, amount, tax_amount, discount_amount, total_amount, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8) RETURNING *`,
      [invoice_number, data.subscription_id, data.user_id, data.amount, data.tax_amount, data.discount_amount, data.total_amount, data.due_date]
    );
    return result.rows[0];
  },

  async updateStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },
};
