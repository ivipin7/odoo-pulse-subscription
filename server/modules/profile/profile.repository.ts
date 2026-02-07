import { pool } from '../../config/db';

export const ProfileRepository = {
  async getProfile(userId: number) {
    const userResult = await pool.query(
      `SELECT id, name, email, phone, company, gst_number, role, status, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0] || null;
    if (!user) return null;

    const addrResult = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return { ...user, addresses: addrResult.rows };
  },

  async updateProfile(userId: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return this.getProfile(userId);

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    return this.getProfile(userId);
  },

  async getAddresses(userId: number) {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async addAddress(userId: number, data: any) {
    // If setting as default, clear existing default
    if (data.is_default) {
      await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const result = await pool.query(
      `INSERT INTO addresses (user_id, label, line1, line2, city, state, pin_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, data.label, data.line1, data.line2 || null, data.city, data.state, data.pin_code, data.is_default]
    );
    return result.rows[0];
  },

  async updateAddress(id: number, userId: number, data: any) {
    if (data.is_default) {
      await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return null;

    values.push(id, userId);
    const result = await pool.query(
      `UPDATE addresses SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async deleteAddress(id: number, userId: number) {
    await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
  },
};
