import { pool } from '../../config/db';

export const DiscountRepository = {
  async findAll() {
    const result = await pool.query('SELECT * FROM discounts ORDER BY created_at DESC');
    return result.rows;
  },

  async findByCode(code: string) {
    const result = await pool.query('SELECT * FROM discounts WHERE code = $1', [code]);
    return result.rows[0] || null;
  },

  async findById(id: number) {
    const result = await pool.query('SELECT * FROM discounts WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: any) {
    const result = await pool.query(
      `INSERT INTO discounts (code, description, type, value, min_order, max_uses, valid_from, valid_until, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE') RETURNING *`,
      [data.code, data.description || null, data.type, data.value, data.min_order, data.max_uses, data.valid_from, data.valid_until]
    );
    return result.rows[0];
  },

  async update(id: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'id') {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE discounts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async incrementUsed(id: number) {
    await pool.query('UPDATE discounts SET used_count = used_count + 1 WHERE id = $1', [id]);
  },
};
