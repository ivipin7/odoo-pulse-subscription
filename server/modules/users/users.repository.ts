import { pool } from '../../config/db';

export const UserRepository = {
  async findAll() {
    const result = await pool.query(
      `SELECT id, name, email, phone, company, gst_number, role, department, status, last_login, created_at
       FROM users ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(
      `SELECT id, name, email, phone, company, gst_number, role, department, status, last_login, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async update(id: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, department, status`,
      values
    );
    return result.rows[0];
  },
};
