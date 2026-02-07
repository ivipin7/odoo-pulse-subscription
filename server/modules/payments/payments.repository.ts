import { pool } from '../../config/db';

export const PaymentRepository = {
  async findAll(userId?: number) {
    let query = `
      SELECT pay.*, i.invoice_number, u.name as customer_name
      FROM payments pay
      JOIN invoices i ON pay.invoice_id = i.id
      JOIN users u ON pay.user_id = u.id
    `;
    const params: any[] = [];
    if (userId) {
      query += ' WHERE pay.user_id = $1';
      params.push(userId);
    }
    query += ' ORDER BY pay.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT pay.*, i.invoice_number, u.name as customer_name
      FROM payments pay
      JOIN invoices i ON pay.invoice_id = i.id
      JOIN users u ON pay.user_id = u.id
      WHERE pay.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: any) {
    const countResult = await pool.query('SELECT COUNT(*) FROM payments');
    const num = parseInt(countResult.rows[0].count) + 1;
    const payment_ref = `PAY-${String(num).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO payments (payment_ref, invoice_id, user_id, amount, method, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [payment_ref, data.invoice_id, data.user_id, data.amount, data.method, data.status || 'PENDING']
    );
    return result.rows[0];
  },
};
