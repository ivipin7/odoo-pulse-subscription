import { db } from "../../db/pool.js";
import type { CreateSubscriptionInput } from "./subscriptions.schema.js";

export const subscriptionsRepository = {
  async findAll(page = 1, limit = 20, filters: { status?: string; customerId?: string; search?: string } = {}) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) { params.push(filters.status); conditions.push(`s.status = $${params.length}`); }
    if (filters.customerId) { params.push(filters.customerId); conditions.push(`s.customer_id = $${params.length}`); }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(s.subscription_number ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const countResult = await db.query(`SELECT COUNT(*) FROM subscriptions s JOIN users u ON s.customer_id = u.id ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email,
              rp.name as plan_name,
              COALESCE(sl.line_total, 0) as untaxed_amount,
              COALESCE(sl.tax_total, 0) as tax_amount,
              COALESCE(sl.line_total, 0) + COALESCE(sl.tax_total, 0) as total_amount
       FROM subscriptions s
       JOIN users u ON s.customer_id = u.id
       LEFT JOIN recurring_plans rp ON s.recurring_plan_id = rp.id
       LEFT JOIN LATERAL (
         SELECT SUM(sl2.subtotal) as line_total,
                SUM(CASE WHEN t2.tax_computation = 'PERCENTAGE' THEN sl2.subtotal * t2.amount / 100
                         WHEN t2.tax_computation = 'FIXED' THEN t2.amount * sl2.quantity
                         ELSE 0 END) as tax_total
         FROM subscription_lines sl2
         LEFT JOIN taxes t2 ON sl2.tax_id = t2.id
         WHERE sl2.subscription_id = s.id
       ) sl ON true
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows: result.rows, total };
  },

  async findById(id: string) {
    const result = await db.query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email,
              rp.name as plan_name
       FROM subscriptions s
       JOIN users u ON s.customer_id = u.id
       LEFT JOIN recurring_plans rp ON s.recurring_plan_id = rp.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getLines(subscriptionId: string) {
    const result = await db.query(
      `SELECT sl.*, p.name as product_name, d.name as discount_name,
              t.name as tax_name, t.amount as tax_rate, t.tax_computation,
              CASE WHEN t.tax_computation = 'PERCENTAGE' THEN sl.subtotal * t.amount / 100
                   WHEN t.tax_computation = 'FIXED' THEN t.amount * sl.quantity
                   ELSE 0 END as tax_amount,
              sl.subtotal + CASE WHEN t.tax_computation = 'PERCENTAGE' THEN sl.subtotal * t.amount / 100
                                 WHEN t.tax_computation = 'FIXED' THEN t.amount * sl.quantity
                                 ELSE 0 END as amount
       FROM subscription_lines sl
       JOIN products p ON sl.product_id = p.id
       LEFT JOIN discounts d ON sl.discount_id = d.id
       LEFT JOIN taxes t ON sl.tax_id = t.id
       WHERE sl.subscription_id = $1
       ORDER BY sl.created_at`,
      [subscriptionId]
    );
    return result.rows;
  },

  async create(data: CreateSubscriptionInput, createdBy: string) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Generate subscription number
      const seqResult = await client.query("SELECT nextval('subscription_number_seq')");
      const subNumber = `SUB-${String(seqResult.rows[0].nextval).padStart(6, "0")}`;

      const result = await client.query(
        `INSERT INTO subscriptions (subscription_number, customer_id, recurring_plan_id, quotation_template_id,
         start_date, expiration_date, payment_terms, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [subNumber, data.customer_id, data.recurring_plan_id || null, data.quotation_template_id || null,
         data.start_date || null, data.expiration_date || null, data.payment_terms, data.notes || null, createdBy]
      );
      const subscription = result.rows[0];

      // Insert lines
      if (data.lines && data.lines.length > 0) {
        for (const line of data.lines) {
          const subtotal = line.quantity * line.unit_price;
          await client.query(
            `INSERT INTO subscription_lines (subscription_id, product_id, description, quantity, unit_price, discount_id, tax_id, subtotal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [subscription.id, line.product_id, line.description || null, line.quantity, line.unit_price,
             line.discount_id || null, line.tax_id || null, subtotal]
          );
        }
      }

      await client.query("COMMIT");
      return subscription;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string, extra?: { cancellation_reason?: string }) {
    const fields = ["status = $1", "updated_at = NOW()"];
    const values: unknown[] = [status];
    let idx = 2;

    if (status === "PAUSED") {
      fields.push(`paused_at = NOW()`);
    } else if (status === "ACTIVE") {
      // If resuming from PAUSED, set resumed_at
      fields.push(`resumed_at = NOW()`);
    }

    if (status === "CANCELLED") {
      fields.push(`cancelled_at = NOW()`);
      if (extra?.cancellation_reason) {
        fields.push(`cancellation_reason = $${idx}`);
        values.push(extra.cancellation_reason);
        idx++;
      }
    }

    values.push(id);
    const result = await db.query(
      `UPDATE subscriptions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async update(id: string, data: Partial<CreateSubscriptionInput>) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (data.customer_id !== undefined) { fields.push(`customer_id = $${idx++}`); values.push(data.customer_id); }
      if (data.recurring_plan_id !== undefined) { fields.push(`recurring_plan_id = $${idx++}`); values.push(data.recurring_plan_id || null); }
      if (data.start_date !== undefined) { fields.push(`start_date = $${idx++}`); values.push(data.start_date || null); }
      if (data.expiration_date !== undefined) { fields.push(`expiration_date = $${idx++}`); values.push(data.expiration_date || null); }
      if (data.payment_terms !== undefined) { fields.push(`payment_terms = $${idx++}`); values.push(data.payment_terms); }
      if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes); }

      if (fields.length > 0) {
        fields.push("updated_at = NOW()");
        values.push(id);
        await client.query(
          `UPDATE subscriptions SET ${fields.join(", ")} WHERE id = $${idx}`,
          values
        );
      }

      // Replace lines if provided
      if (data.lines) {
        await client.query("DELETE FROM subscription_lines WHERE subscription_id = $1", [id]);
        for (const line of data.lines) {
          const subtotal = line.quantity * line.unit_price;
          await client.query(
            `INSERT INTO subscription_lines (subscription_id, product_id, description, quantity, unit_price, discount_id, tax_id, subtotal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, line.product_id, line.description || null, line.quantity, line.unit_price,
             line.discount_id || null, line.tax_id || null, subtotal]
          );
        }
      }

      await client.query("COMMIT");
      return this.findById(id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async renew(originalId: string, createdBy: string) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Fetch original subscription
      const origResult = await client.query("SELECT * FROM subscriptions WHERE id = $1", [originalId]);
      const orig = origResult.rows[0];
      if (!orig) throw new Error("Subscription not found");

      // Generate new subscription number
      const seqResult = await client.query("SELECT nextval('subscription_number_seq')");
      const subNumber = `SUB-${String(seqResult.rows[0].nextval).padStart(6, "0")}`;

      // Calculate new dates: start today, same duration as original
      const today = new Date();
      let newExpiration: Date | null = null;
      if (orig.start_date && orig.expiration_date) {
        const origStart = new Date(orig.start_date);
        const origEnd = new Date(orig.expiration_date);
        const durationMs = origEnd.getTime() - origStart.getTime();
        newExpiration = new Date(today.getTime() + durationMs);
      }

      const result = await client.query(
        `INSERT INTO subscriptions (subscription_number, customer_id, recurring_plan_id, quotation_template_id,
         start_date, expiration_date, payment_terms, notes, created_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT')
         RETURNING *`,
        [subNumber, orig.customer_id, orig.recurring_plan_id, orig.quotation_template_id,
         today.toISOString().split("T")[0],
         newExpiration ? newExpiration.toISOString().split("T")[0] : null,
         orig.payment_terms, orig.notes ? `Renewed from ${orig.subscription_number}. ${orig.notes}` : `Renewed from ${orig.subscription_number}`,
         createdBy]
      );
      const newSub = result.rows[0];

      // Copy subscription lines
      const linesResult = await client.query(
        "SELECT product_id, description, quantity, unit_price, discount_id, tax_id, subtotal FROM subscription_lines WHERE subscription_id = $1",
        [originalId]
      );
      for (const line of linesResult.rows) {
        await client.query(
          `INSERT INTO subscription_lines (subscription_id, product_id, description, quantity, unit_price, discount_id, tax_id, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newSub.id, line.product_id, line.description, line.quantity, line.unit_price,
           line.discount_id, line.tax_id, line.subtotal]
        );
      }

      await client.query("COMMIT");
      return newSub;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(id: string) {
    const result = await db.query("DELETE FROM subscriptions WHERE id = $1 AND status = 'DRAFT' RETURNING id", [id]);
    return result.rows[0] || null;
  },
};
