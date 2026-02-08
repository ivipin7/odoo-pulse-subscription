import { Router, type Request, type Response } from "express";
import { db } from "../../db/pool.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// ── POST /api/orders/calculate ── Calculate taxes for cart items (preview)
router.post("/calculate", authenticate, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "No items" });
    }

    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const lineSubtotal = item.unit_price * item.quantity;
      subtotal += lineSubtotal;

      const result = await db.query(
        `SELECT t.amount as tax_rate, t.tax_computation
         FROM products p
         LEFT JOIN taxes t ON t.id = p.tax_id AND t.is_active = true
         WHERE p.id = $1`,
        [item.product_id]
      );
      if (result.rows[0]?.tax_rate) {
        const taxRate = parseFloat(result.rows[0].tax_rate);
        if (result.rows[0].tax_computation === "PERCENTAGE") {
          totalTax += lineSubtotal * (taxRate / 100);
        } else {
          totalTax += taxRate * item.quantity;
        }
      }
    }

    res.json({ success: true, data: { subtotal, tax_amount: totalTax, total: subtotal + totalTax } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/orders ── Create order from cart (customer only)
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole === "ADMIN" || userRole === "INTERNAL") {
      return res.status(403).json({ success: false, error: "Admins cannot place orders" });
    }

    const { items, shipping_address, notes, discount_code } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Generate order number
      const seqResult = await client.query("SELECT nextval('order_number_seq') AS num");
      const orderNumber = `ORD-${String(seqResult.rows[0].num).padStart(5, "0")}`;

      // Calculate totals with tax
      let subtotal = 0;
      let totalTax = 0;
      const lineData: Array<{
        product_id: string;
        variant_id: string | null;
        plan_id: string | null;
        description: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        tax_amount: number;
      }> = [];

      for (const item of items) {
        const lineSubtotal = item.unit_price * item.quantity;
        subtotal += lineSubtotal;

        // Look up product tax
        let lineTax = 0;
        const productResult = await client.query(
          `SELECT p.tax_id, t.amount as tax_rate, t.tax_computation
           FROM products p
           LEFT JOIN taxes t ON t.id = p.tax_id AND t.is_active = true
           WHERE p.id = $1`,
          [item.product_id]
        );
        if (productResult.rows[0]?.tax_rate) {
          const taxRate = parseFloat(productResult.rows[0].tax_rate);
          const computation = productResult.rows[0].tax_computation;
          if (computation === "PERCENTAGE") {
            lineTax = lineSubtotal * (taxRate / 100);
          } else {
            lineTax = taxRate * item.quantity;
          }
        }
        totalTax += lineTax;

        lineData.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          plan_id: item.plan_id || null,
          description: `${item.product_name}${item.variant_label ? ` (${item.variant_label})` : ""}${item.plan_name ? ` — ${item.plan_name}` : ""}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: lineSubtotal,
          tax_amount: lineTax,
        });
      }

      // Apply discount code if provided
      let discountAmount = 0;
      let discountId: string | null = null;
      if (discount_code) {
        const discountResult = await client.query(
          `SELECT * FROM discounts WHERE UPPER(code) = UPPER($1) AND is_active = true`,
          [discount_code]
        );
        if (discountResult.rows.length > 0) {
          const d = discountResult.rows[0];
          const now = new Date();
          const startOk = !d.start_date || new Date(d.start_date) <= now;
          const endOk = !d.end_date || new Date(d.end_date) >= now;
          const usageOk = !d.limit_usage || d.usage_count < d.limit_usage;
          if (startOk && endOk && usageOk && subtotal >= parseFloat(d.min_purchase)) {
            if (d.discount_type === "PERCENTAGE") {
              discountAmount = subtotal * (parseFloat(d.value) / 100);
            } else {
              discountAmount = parseFloat(d.value);
            }
            discountId = d.id;
            // Increment usage
            await client.query(
              `UPDATE discounts SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1`,
              [d.id]
            );
          }
        }
      }

      const total = subtotal + totalTax - discountAmount;

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (order_number, customer_id, status, subtotal, tax_amount, discount_amount, discount_id, total, shipping_address, notes)
         VALUES ($1, $2, 'CONFIRMED', $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [orderNumber, userId, subtotal, totalTax, discountAmount, discountId, total, shipping_address || null, notes || null]
      );
      const order = orderResult.rows[0];

      // Insert order lines
      for (const line of lineData) {
        await client.query(
          `INSERT INTO order_lines (order_id, product_id, variant_id, plan_id, description, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, line.product_id, line.variant_id, line.plan_id, line.description, line.quantity, line.unit_price, line.subtotal]
        );
      }

      await client.query("COMMIT");

      // Return with lines
      const linesResult = await db.query(
        `SELECT ol.*, p.name as product_name, p.product_type
         FROM order_lines ol
         JOIN products p ON p.id = ol.product_id
         WHERE ol.order_id = $1`,
        [order.id]
      );

      res.status(201).json({
        success: true,
        data: { ...order, lines: linesResult.rows },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/orders ── List orders (customer sees own, admin sees all)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const isAdmin = userRole === "ADMIN" || userRole === "INTERNAL";

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const countResult = await db.query(
      isAdmin
        ? "SELECT COUNT(*) FROM orders"
        : "SELECT COUNT(*) FROM orders WHERE customer_id = $1",
      isAdmin ? [] : [userId]
    );

    const result = await db.query(
      isAdmin
        ? `SELECT o.*, u.first_name, u.last_name, u.email,
                  (SELECT COUNT(*) FROM order_lines WHERE order_id = o.id) as line_count
           FROM orders o
           JOIN users u ON u.id = o.customer_id
           ORDER BY o.created_at DESC
           LIMIT $1 OFFSET $2`
        : `SELECT o.*, u.first_name, u.last_name, u.email,
                  (SELECT COUNT(*) FROM order_lines WHERE order_id = o.id) as line_count
           FROM orders o
           JOIN users u ON u.id = o.customer_id
           WHERE o.customer_id = $3
           ORDER BY o.created_at DESC
           LIMIT $1 OFFSET $2`,
      isAdmin ? [limit, offset] : [limit, offset, userId]
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/orders/:id ── Get order detail
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const isAdmin = userRole === "ADMIN" || userRole === "INTERNAL";

    const orderResult = await db.query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.phone, u.address
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Only allow customer to see their own order
    if (!isAdmin && order.customer_id !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const linesResult = await db.query(
      `SELECT ol.*, p.name as product_name, p.product_type
       FROM order_lines ol
       JOIN products p ON p.id = ol.product_id
       WHERE ol.order_id = $1
       ORDER BY ol.created_at`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...order, lines: linesResult.rows },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/orders/:id/status ── Update order status (admin only)
router.patch("/:id/status", authenticate, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== "ADMIN" && userRole !== "INTERNAL") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { status } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as ordersRoutes };
