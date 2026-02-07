import { pool } from '../../config/db';

export const ordersRepository = {
  async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT o.*,
              u.name as user_name, u.email as user_email,
              (SELECT json_agg(json_build_object(
                'id', oi.id, 'product_name', p.name, 'quantity', oi.quantity, 
                'unit_price', oi.unit_price, 'subtotal', oi.quantity * oi.unit_price
              ))
              FROM order_items oi JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = o.id) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.deleted_at IS NULL
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async findByUserId(userId: string, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT o.*,
              (SELECT json_agg(json_build_object(
                'id', oi.id, 'product_name', p.name, 'quantity', oi.quantity, 
                'unit_price', oi.unit_price, 'subtotal', oi.quantity * oi.unit_price
              ))
              FROM order_items oi JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = o.id) as items
       FROM orders o
       WHERE o.user_id = $1 AND o.deleted_at IS NULL
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await pool.query(
      `SELECT o.*,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              (SELECT json_agg(json_build_object(
                'id', oi.id, 'product_id', oi.product_id, 'product_name', p.name,
                'variant_id', oi.variant_id, 'quantity', oi.quantity, 
                'unit_price', oi.unit_price, 'subtotal', oi.quantity * oi.unit_price
              ))
              FROM order_items oi JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = o.id) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getNextOrderNumber() {
    const result = await pool.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 as next
       FROM orders WHERE order_number LIKE 'ORD-%'`
    );
    return `ORD-${String(result.rows[0].next).padStart(4, '0')}`;
  },

  async create(data: any, userId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderNumber = await ordersRepository.getNextOrderNumber();

      const oResult = await client.query(
        `INSERT INTO orders (user_id, order_number, billing_address, notes, total_amount)
         VALUES ($1, $2, $3, $4, 0)
         RETURNING *`,
        [userId, orderNumber, data.billing_address || null, data.notes || null]
      );
      const order = oResult.rows[0];

      let total = 0;
      for (const item of data.items) {
        const subtotal = item.quantity * item.unit_price;
        total += subtotal;
        await client.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.variant_id || null, item.quantity, item.unit_price]
        );
      }

      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE id = $2`,
        [total, order.id]
      );

      await client.query('COMMIT');
      return { ...order, order_number: orderNumber, total_amount: total };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string) {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },
};
