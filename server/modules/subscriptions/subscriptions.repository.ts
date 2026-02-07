import { pool } from '../../config/db';

export const SubscriptionRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT s.*, u.name as customer_name, u.email as customer_email,
        p.name as product_name, pv.name as variant_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_variants pv ON s.variant_id = pv.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `);
    return result.rows;
  },

  async findByUserId(userId: string) {
    const result = await pool.query(`
      SELECT s.*, p.name as product_name, pv.name as variant_name
      FROM subscriptions s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_variants pv ON s.variant_id = pv.id
      WHERE s.user_id = $1 AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT s.*, u.name as customer_name, u.email as customer_email, u.company,
        p.name as product_name, pv.name as variant_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_variants pv ON s.variant_id = pv.id
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    user_id: number;
    product_id: number;
    variant_id?: number;
    billing_period: string;
    amount: number;
    start_date: string;
    next_billing: string;
  }) {
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, product_id, variant_id, billing_period, amount, start_date, next_billing, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE') RETURNING *`,
      [data.user_id, data.product_id, data.variant_id || null, data.billing_period, data.amount, data.start_date, data.next_billing]
    );
    return result.rows[0];
  },

  async updateStatus(id: number, status: string) {
    const extra = status === 'CLOSED' ? ', closed_at = NOW()' : '';
    const result = await pool.query(
      `UPDATE subscriptions SET status = $1${extra} WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  },
};
