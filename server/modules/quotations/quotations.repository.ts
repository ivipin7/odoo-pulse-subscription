import { pool } from '../../config/db';

export const quotationsRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT q.*,
              u.name as customer_name, u.email as customer_email,
              d.code as discount_code, d.percent as discount_percent
       FROM quotations q
       JOIN users u ON q.customer_id = u.id
       LEFT JOIN discounts d ON q.discount_id = d.id
       ORDER BY q.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT q.*,
              u.name as customer_name, u.email as customer_email, u.phone as customer_phone, u.company as customer_company,
              d.code as discount_code, d.percent as discount_percent,
              json_agg(json_build_object(
                'id', qi.id,
                'product_id', qi.product_id,
                'product_name', p.name,
                'variant_id', qi.variant_id,
                'quantity', qi.quantity,
                'unit_price', qi.unit_price,
                'subtotal', qi.quantity * qi.unit_price
              )) as items
       FROM quotations q
       JOIN users u ON q.customer_id = u.id
       LEFT JOIN discounts d ON q.discount_id = d.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       LEFT JOIN products p ON qi.product_id = p.id
       WHERE q.id = $1
       GROUP BY q.id, u.name, u.email, u.phone, u.company, d.code, d.percent`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const qResult = await client.query(
        `INSERT INTO quotations (customer_id, billing_period, discount_id, notes, valid_until, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.customer_id, data.billing_period, data.discount_id || null, data.notes || null, data.valid_until || null, data.total_amount || 0]
      );
      const quotation = qResult.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [quotation.id, item.product_id, item.variant_id || null, item.quantity, item.unit_price]
        );
      }

      // Update total
      const totalResult = await client.query(
        `SELECT SUM(quantity * unit_price) as total FROM quotation_items WHERE quotation_id = $1`,
        [quotation.id]
      );
      await client.query(
        `UPDATE quotations SET total_amount = $1 WHERE id = $2`,
        [totalResult.rows[0].total, quotation.id]
      );

      await client.query('COMMIT');
      return { ...quotation, total_amount: totalResult.rows[0].total };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string) {
    const result = await pool.query(
      `UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  async softDelete(id: string) {
    const result = await pool.query(
      `UPDATE quotations SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },
};
