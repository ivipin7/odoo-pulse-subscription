import { pool } from '../../config/db';

export const QuotationRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT q.*, u.name as customer_name,
        COALESCE(
          json_agg(json_build_object(
            'id', qi.id, 'product_name', p.name, 'variant_name', pv.name,
            'quantity', qi.quantity, 'unit_price', qi.unit_price
          )) FILTER (WHERE qi.id IS NOT NULL), '[]'
        ) as items
      FROM quotations q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
      LEFT JOIN products p ON qi.product_id = p.id
      LEFT JOIN product_variants pv ON qi.variant_id = pv.id
      WHERE q.deleted_at IS NULL
      GROUP BY q.id, u.name
      ORDER BY q.created_at DESC
    `);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT q.*, u.name as customer_name,
        COALESCE(
          json_agg(json_build_object(
            'id', qi.id, 'product_name', p.name, 'variant_name', pv.name,
            'quantity', qi.quantity, 'unit_price', qi.unit_price
          )) FILTER (WHERE qi.id IS NOT NULL), '[]'
        ) as items
      FROM quotations q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
      LEFT JOIN products p ON qi.product_id = p.id
      LEFT JOIN product_variants pv ON qi.variant_id = pv.id
      WHERE q.id = $1 AND q.deleted_at IS NULL
      GROUP BY q.id, u.name
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const countResult = await client.query('SELECT COUNT(*) FROM quotations');
      const num = parseInt(countResult.rows[0].count) + 1;
      const quotation_number = `QOT-${String(num).padStart(3, '0')}`;

      const total = data.items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);

      const qResult = await client.query(
        `INSERT INTO quotations (quotation_number, user_id, total_amount, valid_until, status)
         VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING *`,
        [quotation_number, data.user_id, total, data.valid_until]
      );
      const quotation = qResult.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [quotation.id, item.product_id, item.variant_id || null, item.quantity, item.unit_price]
        );
      }

      await client.query('COMMIT');
      return this.findById(quotation.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE quotations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },
};
