import { db } from "../../db/pool.js";
import type { CreatePaymentInput } from "./payments.schema.js";

export const paymentsRepository = {
  async findAll(page = 1, limit = 20, filters: { status?: string; customerId?: string } = {}) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) { params.push(filters.status); conditions.push(`p.status = $${params.length}`); }
    if (filters.customerId) { params.push(filters.customerId); conditions.push(`p.customer_id = $${params.length}`); }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const countResult = await db.query(`SELECT COUNT(*) FROM payments p ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT p.*, i.invoice_number, u.first_name || ' ' || u.last_name as customer_name
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN users u ON p.customer_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows: result.rows, total };
  },

  async findById(id: string) {
    const result = await db.query(
      `SELECT p.*, i.invoice_number, u.first_name || ' ' || u.last_name as customer_name
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN users u ON p.customer_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: CreatePaymentInput, customerId: string) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const seqResult = await client.query("SELECT nextval('payment_number_seq')");
      const payNumber = `PAY-${String(seqResult.rows[0].nextval).padStart(6, "0")}`;

      const result = await client.query(
        `INSERT INTO payments (payment_number, invoice_id, customer_id, amount, payment_method, status, payment_date, notes)
         VALUES ($1, $2, $3, $4, $5, 'COMPLETED', NOW(), $6)
         RETURNING *`,
        [payNumber, data.invoice_id, customerId, data.amount, data.payment_method, data.notes || null]
      );

      // Update invoice status to PAID if full amount covered
      const invoice = await client.query("SELECT total FROM invoices WHERE id = $1", [data.invoice_id]);
      const totalPaid = await client.query(
        "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1 AND status = 'COMPLETED'",
        [data.invoice_id]
      );

      if (parseFloat(totalPaid.rows[0].paid) >= parseFloat(invoice.rows[0].total)) {
        await client.query("UPDATE invoices SET status = 'PAID', paid_date = NOW(), updated_at = NOW() WHERE id = $1", [data.invoice_id]);
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async retryFailed(invoiceId: string) {
    // Mark failed invoice as confirmed for retry
    const result = await db.query(
      "UPDATE invoices SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1 AND status = 'FAILED' RETURNING *",
      [invoiceId]
    );
    return result.rows[0] || null;
  },
};
