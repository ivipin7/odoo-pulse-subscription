import { pool } from '../../config/db';

export const usersRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, name, email, phone, company, role, is_active, gst_number, 
              created_at, updated_at, last_login
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT id, name, email, phone, company, role, is_active, gst_number,
              created_at, updated_at, last_login
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
       RETURNING id, name, email, phone, company, role, is_active, gst_number, created_at, updated_at`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async softDelete(id: string) {
    const result = await pool.query(
      `UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0];
  },

  async getStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE role = 'CUSTOMER') as customers,
        COUNT(*) FILTER (WHERE role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')) as staff,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
      FROM users WHERE deleted_at IS NULL
    `);
    return result.rows[0];
  },
};
