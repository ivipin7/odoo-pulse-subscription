import { pool } from '../../config/db';

export const taxesRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM tax_rules
       WHERE deleted_at IS NULL
       ORDER BY region, name
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT * FROM tax_rules WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByRegion(region: string) {
    const result = await pool.query(
      `SELECT * FROM tax_rules WHERE region = $1 AND is_active = true AND deleted_at IS NULL`,
      [region]
    );
    return result.rows;
  },

  async create(data: any) {
    const result = await pool.query(
      `INSERT INTO tax_rules (name, region, tax_type, rate, is_active, applicable_categories)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, data.region, data.tax_type, data.rate, data.is_active ?? true, data.applicable_categories ? JSON.stringify(data.applicable_categories) : null]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE tax_rules SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async softDelete(id: string) {
    const result = await pool.query(
      `UPDATE tax_rules SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0];
  },

  async calculateTax(amount: number, region: string) {
    const rules = await taxesRepository.findByRegion(region);
    if (rules.length === 0) return { tax_amount: 0, rules_applied: [] };

    let totalTax = 0;
    const applied: any[] = [];
    for (const rule of rules) {
      const taxAmount = (amount * parseFloat(rule.rate)) / 100;
      totalTax += taxAmount;
      applied.push({
        rule_id: rule.id,
        name: rule.name,
        type: rule.tax_type,
        rate: rule.rate,
        amount: taxAmount,
      });
    }
    return { tax_amount: totalTax, rules_applied: applied };
  },
};
