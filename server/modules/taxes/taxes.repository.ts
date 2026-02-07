import { pool } from '../../config/db';

export const TaxRepository = {
  async findAll() {
    const result = await pool.query('SELECT * FROM tax_rules ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query('SELECT * FROM tax_rules WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: any) {
    const result = await pool.query(
      `INSERT INTO tax_rules (name, rate, type, applicable_to, region, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *`,
      [data.name, data.rate, data.type, data.applicable_to, data.region]
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
      `UPDATE tax_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },
};
