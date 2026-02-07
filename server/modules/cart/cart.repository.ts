import { pool } from '../../config/db';

export const cartRepository = {
  async findByUserId(userId: string) {
    const result = await pool.query(
      `SELECT ci.*,
              p.name as product_name, p.base_price, p.image_url,
              pv.name as variant_name, pv.price_modifier
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findItem(userId: string, productId: string, variantId?: string) {
    const result = await pool.query(
      `SELECT * FROM cart_items 
       WHERE user_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
      [userId, productId, variantId || null]
    );
    return result.rows[0] || null;
  },

  async addItem(userId: string, productId: string, variantId: string | null, quantity: number) {
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, variant_id) 
       DO UPDATE SET quantity = cart_items.quantity + $4, updated_at = NOW()
       RETURNING *`,
      [userId, productId, variantId, quantity]
    );
    return result.rows[0];
  },

  async updateQuantity(id: string, userId: string, quantity: number) {
    if (quantity === 0) {
      await pool.query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [id, userId]);
      return null;
    }
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [quantity, id, userId]
    );
    return result.rows[0];
  },

  async removeItem(id: string, userId: string) {
    await pool.query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [id, userId]);
  },

  async clearCart(userId: string) {
    await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
  },

  async getCartTotal(userId: string) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as item_count,
        SUM(ci.quantity) as total_quantity,
        SUM(ci.quantity * (p.base_price + COALESCE(pv.price_modifier, 0))) as total_amount
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },
};
