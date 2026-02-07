import { pool } from '../../config/db';

export const ProductRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name,
        COALESCE(
          json_agg(
            json_build_object('id', pv.id, 'name', pv.name, 'extra_price', pv.extra_price)
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
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
          json_agg(
            json_build_object('id', pv.id, 'name', pv.name, 'extra_price', pv.extra_price)
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
        ) as variants
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, c.name
    `, [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    name: string;
    description?: string;
    base_price: number;
    category_id: number;
    billing_period: string;
  }) {
    const result = await pool.query(
      `INSERT INTO products (name, description, base_price, category_id, billing_period)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description || null, data.base_price, data.category_id, data.billing_period]
    );
    return result.rows[0];
  },

  async createVariant(productId: number, variant: { name: string; extra_price: number }) {
    const result = await pool.query(
      `INSERT INTO product_variants (product_id, name, extra_price)
       VALUES ($1, $2, $3) RETURNING *`,
      [productId, variant.name, variant.extra_price]
    );
    return result.rows[0];
  },

  async update(id: number, data: Partial<{
    name: string;
    description: string;
    base_price: number;
    category_id: number;
    billing_period: string;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async softDelete(id: number) {
    await pool.query(
      'UPDATE products SET deleted_at = NOW(), is_active = FALSE WHERE id = $1',
      [id]
    );
  },

  async findCategories() {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    return result.rows;
  },
};
