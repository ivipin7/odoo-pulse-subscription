import { pool } from '../../config/db';

export const CartRepository = {
  async findByUser(userId: number) {
    const result = await pool.query(`
      SELECT ci.*, p.name as product_name, p.base_price, p.billing_period,
             pv.name as variant_name, pv.extra_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async addItem(userId: number, data: { product_id: number; variant_id?: number | null; quantity: number }) {
    // Upsert: if same product+variant exists, update quantity
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [userId, data.product_id, data.variant_id || null, data.quantity]
    );
    return result.rows[0];
  },

  async updateQuantity(id: number, userId: number, quantity: number) {
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    );
    return result.rows[0] || null;
  },

  async removeItem(id: number, userId: number) {
    await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
  },

  async clearCart(userId: number) {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  },
};
