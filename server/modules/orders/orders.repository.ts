import { pool } from '../../config/db';

export const OrderRepository = {
  async findAll(userId?: number) {
    let query = `
      SELECT o.*, u.name as customer_name,
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'product_id', oi.product_id,
            'product_name', p.name, 'variant_name', pv.name,
            'quantity', oi.quantity, 'unit_price', oi.unit_price,
            'billing_period', oi.billing_period
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (userId) {
      query += ' AND o.user_id = $1';
      params.push(userId);
    }
    query += ' GROUP BY o.id, u.name ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT o.*, u.name as customer_name,
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'product_id', oi.product_id,
            'product_name', p.name, 'variant_name', pv.name,
            'quantity', oi.quantity, 'unit_price', oi.unit_price,
            'billing_period', oi.billing_period
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.id = $1 AND o.deleted_at IS NULL
      GROUP BY o.id, u.name
    `, [id]);
    return result.rows[0] || null;
  },

  async create(userId: number, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const countResult = await client.query('SELECT COUNT(*) FROM orders');
      const num = parseInt(countResult.rows[0].count) + 1;
      const order_number = `ORD-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;

      const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
      const tax_amount = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
      const discount_amount = data.discount_amount || 0;
      const total_amount = subtotal + tax_amount - discount_amount;

      const orderResult = await client.query(
        `INSERT INTO orders (order_number, user_id, total_amount, tax_amount, discount_amount, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
        [order_number, userId, total_amount, tax_amount, discount_amount]
      );
      const order = orderResult.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, billing_period)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.variant_id || null, item.quantity, item.unit_price, item.billing_period]
        );
      }

      await client.query('COMMIT');
      return this.findById(order.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
