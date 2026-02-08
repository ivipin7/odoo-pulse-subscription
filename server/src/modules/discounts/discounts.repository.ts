import { db } from "../../db/pool.js";
import type { CreateDiscountInput } from "./discounts.schema.js";

export const discountsRepository = {
  async findAll() {
    const result = await db.query("SELECT * FROM discounts ORDER BY created_at DESC");
    return result.rows;
  },

  async findById(id: string) {
    const result = await db.query("SELECT * FROM discounts WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async findByCode(code: string) {
    const result = await db.query("SELECT * FROM discounts WHERE UPPER(code) = UPPER($1) AND is_active = true", [code]);
    return result.rows[0] || null;
  },

  async create(data: CreateDiscountInput, createdBy: string) {
    const result = await db.query(
      `INSERT INTO discounts (name, discount_type, value, min_purchase, min_quantity, start_date, end_date, limit_usage, applies_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [data.name, data.discount_type, data.value, data.min_purchase, data.min_quantity,
       data.start_date || null, data.end_date || null, data.limit_usage ?? null, data.applies_to || 'ALL', createdBy]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<CreateDiscountInput>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.discount_type !== undefined) { fields.push(`discount_type = $${idx++}`); values.push(data.discount_type); }
    if (data.value !== undefined) { fields.push(`value = $${idx++}`); values.push(data.value); }
    if (data.min_purchase !== undefined) { fields.push(`min_purchase = $${idx++}`); values.push(data.min_purchase); }
    if (data.min_quantity !== undefined) { fields.push(`min_quantity = $${idx++}`); values.push(data.min_quantity); }
    if (data.start_date !== undefined) { fields.push(`start_date = $${idx++}`); values.push(data.start_date); }
    if (data.end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(data.end_date); }
    if ((data as any).limit_usage !== undefined) { fields.push(`limit_usage = $${idx++}`); values.push((data as any).limit_usage); }
    if ((data as any).applies_to !== undefined) { fields.push(`applies_to = $${idx++}`); values.push((data as any).applies_to); }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = NOW()");
    values.push(id);

    const result = await db.query(
      `UPDATE discounts SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string) {
    const result = await db.query("UPDATE discounts SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  },
};
