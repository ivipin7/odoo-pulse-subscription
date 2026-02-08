import { db } from "../../db/pool.js";

export const invoicesRepository = {
  async findAll(page = 1, limit = 20, filters: { status?: string; customerId?: string } = {}) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) { params.push(filters.status); conditions.push(`i.status = $${params.length}`); }
    if (filters.customerId) { params.push(filters.customerId); conditions.push(`i.customer_id = $${params.length}`); }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const countResult = await db.query(`SELECT COUNT(*) FROM invoices i ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT i.*, u.first_name || ' ' || u.last_name as customer_name,
              s.subscription_number
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows: result.rows, total };
  },

  async findById(id: string) {
    const result = await db.query(
      `SELECT i.*, u.first_name || ' ' || u.last_name as customer_name,
              s.subscription_number
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getLines(invoiceId: string) {
    const result = await db.query(
      `SELECT il.*, p.name as product_name
       FROM invoice_lines il
       LEFT JOIN products p ON il.product_id = p.id
       WHERE il.invoice_id = $1`,
      [invoiceId]
    );
    return result.rows;
  },

  async createFromSubscription(subscriptionId: string, createdBy: string) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Get subscription
      const subResult = await client.query("SELECT * FROM subscriptions WHERE id = $1", [subscriptionId]);
      const sub = subResult.rows[0];
      if (!sub) throw new Error("Subscription not found");

      // Get subscription lines
      const linesResult = await client.query(
        `SELECT sl.*, t.tax_computation, t.amount as tax_rate, d.discount_type, d.value as discount_value
         FROM subscription_lines sl
         LEFT JOIN taxes t ON sl.tax_id = t.id
         LEFT JOIN discounts d ON sl.discount_id = d.id
         WHERE sl.subscription_id = $1`,
        [subscriptionId]
      );

      // Generate invoice number
      const seqResult = await client.query("SELECT nextval('invoice_number_seq')");
      const invNumber = `INV-${String(seqResult.rows[0].nextval).padStart(6, "0")}`;

      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const invoiceLines: Array<{
        productId: string; description: string; quantity: number;
        unitPrice: number; discountAmt: number; taxAmt: number; lineSubtotal: number;
      }> = [];

      for (const line of linesResult.rows) {
        let lineSubtotal = line.quantity * parseFloat(line.unit_price);

        // Apply discount
        let discountAmt = 0;
        if (line.discount_type === "PERCENTAGE") {
          discountAmt = lineSubtotal * (parseFloat(line.discount_value) / 100);
        } else if (line.discount_type === "FIXED") {
          discountAmt = parseFloat(line.discount_value || "0");
        }
        lineSubtotal -= discountAmt;

        // Apply tax
        let taxAmt = 0;
        if (line.tax_computation === "PERCENTAGE") {
          taxAmt = lineSubtotal * (parseFloat(line.tax_rate) / 100);
        } else if (line.tax_computation === "FIXED") {
          taxAmt = parseFloat(line.tax_rate || "0") * line.quantity;
        }

        subtotal += line.quantity * parseFloat(line.unit_price);
        totalDiscount += discountAmt;
        totalTax += taxAmt;

        invoiceLines.push({
          productId: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: parseFloat(line.unit_price),
          discountAmt,
          taxAmt,
          lineSubtotal: lineSubtotal + taxAmt,
        });
      }

      const total = subtotal - totalDiscount + totalTax;

      // Calculate due date based on payment terms
      let dueDays = 0;
      if (sub.payment_terms === "NET_15") dueDays = 15;
      else if (sub.payment_terms === "NET_30") dueDays = 30;
      else if (sub.payment_terms === "NET_60") dueDays = 60;

      const invResult = await client.query(
        `INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_amount,
         discount_amount, total, due_date, created_by)
         VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6, $7, NOW() + interval '1 day' * $8, $9)
         RETURNING *`,
        [invNumber, subscriptionId, sub.customer_id, subtotal, totalTax, totalDiscount, total, dueDays, createdBy]
      );
      const invoice = invResult.rows[0];

      // Insert lines
      for (const line of invoiceLines) {
        await client.query(
          `INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price,
           discount_amount, tax_amount, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [invoice.id, line.productId, line.description, line.quantity, line.unitPrice,
           line.discountAmt, line.taxAmt, line.lineSubtotal]
        );
      }

      // Increment discount usage counts
      const discountIds = linesResult.rows
        .filter((l: any) => l.discount_id)
        .map((l: any) => l.discount_id);
      const uniqueDiscountIds = [...new Set(discountIds)];
      for (const discId of uniqueDiscountIds) {
        await client.query(
          "UPDATE discounts SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1",
          [discId]
        );
      }

      await client.query("COMMIT");
      return invoice;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string) {
    const extra = status === "PAID" ? ", paid_date = NOW()" : "";
    const result = await db.query(
      `UPDATE invoices SET status = $1${extra}, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  },

  async findDueSubscriptions() {
    // Find ACTIVE subscriptions that have a recurring plan and
    // no open (DRAFT/CONFIRMED) invoices pending
    const result = await db.query(`
      SELECT s.id, s.subscription_number, s.customer_id, s.recurring_plan_id,
             rp.name as plan_name, rp.billing_period, rp.billing_interval,
             u.first_name || ' ' || u.last_name as customer_name,
             MAX(i.created_at) as last_invoice_date
      FROM subscriptions s
      JOIN recurring_plans rp ON s.recurring_plan_id = rp.id
      JOIN users u ON s.customer_id = u.id
      LEFT JOIN invoices i ON i.subscription_id = s.id
      WHERE s.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM invoices inv
          WHERE inv.subscription_id = s.id
          AND inv.status IN ('DRAFT', 'CONFIRMED')
        )
      GROUP BY s.id, s.subscription_number, s.customer_id, s.recurring_plan_id,
               rp.name, rp.billing_period, rp.billing_interval,
               u.first_name, u.last_name
      HAVING MAX(i.created_at) IS NULL
        OR (
          CASE rp.billing_period
            WHEN 'DAILY'   THEN MAX(i.created_at) + interval '1 day'   * rp.billing_interval
            WHEN 'WEEKLY'  THEN MAX(i.created_at) + interval '1 week'  * rp.billing_interval
            WHEN 'MONTHLY' THEN MAX(i.created_at) + interval '1 month' * rp.billing_interval
            WHEN 'YEARLY'  THEN MAX(i.created_at) + interval '1 year'  * rp.billing_interval
          END
        ) <= NOW()
      ORDER BY last_invoice_date ASC NULLS FIRST
    `);
    return result.rows;
  },
};
