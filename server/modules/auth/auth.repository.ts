import { pool } from '../../config/db';

export const AuthRepository = {
  async findByEmail(email: string) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async create(data: {
    name: string;
    email: string;
    password_hash: string;
    phone?: string;
    company?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, company, role)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER') RETURNING id, name, email, role, status`,
      [data.name, data.email, data.password_hash, data.phone || null, data.company || null]
    );
    return result.rows[0];
  },

  async findById(id: string) {
    const result = await pool.query(
      'SELECT id, name, email, phone, company, gst_number, role, department, status, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async updateLastLogin(id: number) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  },
};
