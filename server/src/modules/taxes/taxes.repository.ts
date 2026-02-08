import { db } from "../../db/pool.js";
import type { CreateTaxInput } from "./taxes.schema.js";

export const taxesRepository = {
  async findAll() {
    const result = await db.query("SELECT * FROM taxes WHERE is_active = true ORDER BY created_at DESC");
    return result.rows;
  },
  async findById(id: string) {
    const result = await db.query("SELECT * FROM taxes WHERE id = $1", [id]);
    return result.rows[0] || null;
  },
  async create(data: CreateTaxInput, createdBy: string) {
    const result = await db.query(
      "INSERT INTO taxes (name, tax_computation, amount, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [data.name, data.tax_computation, data.amount, createdBy]
    );
    return result.rows[0];
  },
  async update(id: string, data: Partial<CreateTaxInput>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.tax_computation !== undefined) { fields.push(`tax_computation = $${idx++}`); values.push(data.tax_computation); }
    if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount); }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = NOW()");
    values.push(id);
    const result = await db.query(`UPDATE taxes SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    return result.rows[0] || null;
  },
  async delete(id: string) {
    const result = await db.query("UPDATE taxes SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  },
};
