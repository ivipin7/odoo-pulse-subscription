import { pool } from '../../config/db';
import { CreateProductInput, UpdateProductInput } from './products.schema';

export const ProductRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name,
        COALESCE(
          json_agg(json_build_object('id', pv.id, 'name', pv.name, 'extra_price', pv.extra_price))
          FILTER (WHERE pv.id IS NOT NULL), '[]'
        ) as variants
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.deleted_at IS NULL AND p.is_active = TRUE
      GROUP BY p.id, c.name
      ORDER BY p.id
    `);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name,
        COALESCE(
          json_agg(json_build_object('id', pv.id, 'name', pv.name, 'extra_price', pv.extra_price))
          FILTER (WHERE pv.id IS NOT NULL), '[]'
        ) as variants
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, c.name
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateProductInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prodResult = await client.query(
        `INSERT INTO products (name, description, base_price, category_id, billing_period)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.name, data.description || null, data.base_price, data.category_id, data.billing_period]
      );
      const product = prodResult.rows[0];

      if (data.variants && data.variants.length > 0) {
        for (const v of data.variants) {
          await client.query(
            `INSERT INTO product_variants (product_id, name, extra_price) VALUES ($1, $2, $3)`,
            [product.id, v.name, v.extra_price]
          );
        }
      }

      await client.query('COMMIT');
      return this.findById(product.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id: number, data: UpdateProductInput) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.base_price !== undefined) { fields.push(`base_price = $${idx++}`); values.push(data.base_price); }
    if (data.billing_period !== undefined) { fields.push(`billing_period = $${idx++}`); values.push(data.billing_period); }
    if (data.category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(data.category_id); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
      values
    );
    return this.findById(id);
  },

  async softDelete(id: number) {
    await pool.query('UPDATE products SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [id]);
  },
};
