import { pool } from '../../config/db';

export const profileRepository = {
  async findById(id: string) {
    const result = await pool.query(
      `SELECT id, name, email, phone, company, role, gst_number, avatar_url,
              is_active, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async update(id: string, data: Record<string, any>) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1
       RETURNING id, name, email, phone, company, role, gst_number, avatar_url, created_at, updated_at`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async getPasswordHash(id: string) {
    const result = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0]?.password_hash;
  },

  async updatePassword(id: string, hash: string) {
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hash, id]
    );
  },

  async getProfileStats(userId: string) {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM subscriptions WHERE user_id = $1 AND status = 'ACTIVE') as active_subscriptions,
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM payments WHERE user_id = $1 AND status = 'SUCCESS') as total_spent,
        (SELECT COUNT(*) FROM invoices WHERE user_id = $1 AND status = 'FAILED') as pending_invoices
    `, [userId]);
    return result.rows[0];
  },
};
