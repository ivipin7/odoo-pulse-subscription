import { pool } from '../../config/db';

export const discountsRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT d.*, 
              (SELECT COUNT(*) FROM discount_usage du WHERE du.discount_id = d.id) as times_used
       FROM discounts d
       WHERE d.deleted_at IS NULL
       ORDER BY d.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT d.*,
              (SELECT COUNT(*) FROM discount_usage du WHERE du.discount_id = d.id) as times_used
       FROM discounts d WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByCode(code: string) {
    const result = await pool.query(
      `SELECT * FROM discounts WHERE code = $1 AND deleted_at IS NULL`,
      [code]
    );
    return result.rows[0] || null;
  },

  async create(data: any) {
    const result = await pool.query(
      `INSERT INTO discounts (code, description, type, value, min_order_amount, max_uses, valid_from, valid_until, is_active, applicable_products)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.code, data.description || null, data.type, data.value,
        data.min_order_amount || 0, data.max_uses || null,
        data.valid_from, data.valid_until, data.is_active ?? true,
        data.applicable_products ? JSON.stringify(data.applicable_products) : null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE discounts SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async softDelete(id: string) {
    const result = await pool.query(
      `UPDATE discounts SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0];
  },

  async validateDiscount(code: string, orderAmount: number) {
    const discount = await discountsRepository.findByCode(code);
    if (!discount) return { valid: false, error: 'Discount code not found' };
    if (!discount.is_active) return { valid: false, error: 'Discount is inactive' };
    if (new Date(discount.valid_from) > new Date()) return { valid: false, error: 'Discount not yet active' };
    if (new Date(discount.valid_until) < new Date()) return { valid: false, error: 'Discount has expired' };
    if (discount.min_order_amount && orderAmount < parseFloat(discount.min_order_amount)) {
      return { valid: false, error: `Minimum order amount is ₹${discount.min_order_amount}` };
    }
    if (discount.max_uses) {
      const usageResult = await pool.query(
        `SELECT COUNT(*) as count FROM discount_usage WHERE discount_id = $1`,
        [discount.id]
      );
      if (parseInt(usageResult.rows[0].count, 10) >= discount.max_uses) {
        return { valid: false, error: 'Discount usage limit reached' };
      }
    }

    const discountAmount = discount.type === 'PERCENT'
      ? (orderAmount * parseFloat(discount.value)) / 100
      : parseFloat(discount.value);

    return { valid: true, discount, discount_amount: Math.min(discountAmount, orderAmount) };
  },
};
