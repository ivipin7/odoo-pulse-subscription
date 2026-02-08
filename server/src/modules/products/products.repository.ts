import { db } from "../../db/pool.js";
import type { CreateProductInput, UpdateProductInput } from "./products.schema.js";

export const productsRepository = {
  async findAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    let where = "WHERE p.is_active = true";
    const params: unknown[] = [];
    if (search) {
      params.push(`%${search}%`);
      where += ` AND p.name ILIKE $${params.length}`;
    }
    const countResult = await db.query(`SELECT COUNT(*) FROM products p ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT p.*, t.name as tax_name, t.amount as tax_amount, t.tax_computation,
              (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true)::int as variant_count
       FROM products p
       LEFT JOIN taxes t ON p.tax_id = t.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows: result.rows, total };
  },

  async findById(id: string) {
    const result = await db.query(
      `SELECT p.*, t.name as tax_name, t.amount as tax_amount, t.tax_computation
       FROM products p LEFT JOIN taxes t ON p.tax_id = t.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: CreateProductInput, createdBy: string) {
    const result = await db.query(
      `INSERT INTO products (name, product_type, description, sales_price, cost_price, tax_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, data.product_type, data.description || null, data.sales_price, data.cost_price, data.tax_id || null, createdBy]
    );
    return result.rows[0];
  },

  async update(id: string, data: UpdateProductInput) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.product_type !== undefined) { fields.push(`product_type = $${idx++}`); values.push(data.product_type); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.sales_price !== undefined) { fields.push(`sales_price = $${idx++}`); values.push(data.sales_price); }
    if (data.cost_price !== undefined) { fields.push(`cost_price = $${idx++}`); values.push(data.cost_price); }
    if (data.tax_id !== undefined) { fields.push(`tax_id = $${idx++}`); values.push(data.tax_id); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string) {
    const result = await db.query(
      "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows[0] || null;
  },

  // Variants
  async getVariants(productId: string) {
    const result = await db.query(
      `SELECT pv.*, pav.value as attribute_value, pav.extra_price, pa.name as attribute_name
       FROM product_variants pv
       JOIN product_attribute_values pav ON pv.attribute_value_id = pav.id
       JOIN product_attributes pa ON pav.attribute_id = pa.id
       WHERE pv.product_id = $1 AND pv.is_active = true`,
      [productId]
    );
    return result.rows;
  },

  async createVariant(productId: string, attributeValueId: string, sku?: string, priceOverride?: number) {
    const result = await db.query(
      `INSERT INTO product_variants (product_id, attribute_value_id, sku, price_override)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [productId, attributeValueId, sku || null, priceOverride ?? null]
    );
    return result.rows[0];
  },

  async deleteVariant(variantId: string) {
    await db.query("UPDATE product_variants SET is_active = false WHERE id = $1", [variantId]);
  },

  // Attributes
  async listAttributes() {
    const attrs = await db.query("SELECT * FROM product_attributes ORDER BY name");
    const values = await db.query(
      "SELECT * FROM product_attribute_values ORDER BY attribute_id, value"
    );
    return attrs.rows.map((a: any) => ({
      ...a,
      values: values.rows.filter((v: any) => v.attribute_id === a.id),
    }));
  },

  async createAttribute(name: string) {
    const result = await db.query(
      "INSERT INTO product_attributes (name) VALUES ($1) RETURNING *",
      [name]
    );
    return result.rows[0];
  },

  async createAttributeValue(attributeId: string, value: string, extraPrice: number) {
    const result = await db.query(
      "INSERT INTO product_attribute_values (attribute_id, value, extra_price) VALUES ($1, $2, $3) RETURNING *",
      [attributeId, value, extraPrice]
    );
    return result.rows[0];
  },
};
