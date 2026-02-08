import { Router, Request, Response, NextFunction } from "express";
import { db } from "../../db/pool.js";
import { sendSuccess, sendList } from "../../utils/response.js";

const router = Router();

// ── Public shop product listing ──────────────────────────────────
router.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const productType = req.query.product_type as string | undefined;
    const sortBy = req.query.sort as string || "created_at";
    const sortDir = req.query.dir === "asc" ? "ASC" : "DESC";
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;

    let where = "WHERE p.is_active = true";
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }
    if (productType) {
      params.push(productType);
      where += ` AND p.product_type = $${params.length}`;
    }
    if (minPrice !== undefined) {
      params.push(minPrice);
      where += ` AND p.sales_price >= $${params.length}`;
    }
    if (maxPrice !== undefined) {
      params.push(maxPrice);
      where += ` AND p.sales_price <= $${params.length}`;
    }

    const allowedSort: Record<string, string> = {
      price: "p.sales_price",
      name: "p.name",
      created_at: "p.created_at",
    };
    const orderCol = allowedSort[sortBy] || "p.created_at";

    const countRes = await db.query(`SELECT COUNT(*) FROM products p ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT p.id, p.name, p.product_type, p.description, p.sales_price, p.cost_price,
              t.name as tax_name, t.amount as tax_amount, t.tax_computation
       FROM products p
       LEFT JOIN taxes t ON p.tax_id = t.id
       ${where}
       ORDER BY ${orderCol} ${sortDir}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    sendList(res, result.rows, total, page, limit);
  } catch (e) { next(e); }
});

// ── Single product detail with plans + variants ──────────────────
router.get("/products/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: products } = await db.query(
      `SELECT p.*, t.name as tax_name, t.amount as tax_amount, t.tax_computation
       FROM products p LEFT JOIN taxes t ON p.tax_id = t.id
       WHERE p.id = $1 AND p.is_active = true`,
      [req.params.id]
    );
    if (!products.length) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Product not found" } });
    }

    // Get all active recurring plans (for pricing table)
    const { rows: plans } = await db.query(
      "SELECT id, name, billing_period, billing_interval, price, description FROM recurring_plans WHERE is_active = true ORDER BY price ASC"
    );

    // Get product variants
    const { rows: variants } = await db.query(
      `SELECT pv.id, pv.product_id, pv.sku, pv.price_override, pv.attribute_value_id,
              pav.value as attribute_value, pav.extra_price,
              pa.name as attribute_name
       FROM product_variants pv
       JOIN product_attribute_values pav ON pv.attribute_value_id = pav.id
       JOIN product_attributes pa ON pav.attribute_id = pa.id
       WHERE pv.product_id = $1 AND pv.is_active = true
       ORDER BY pa.name, pav.value`,
      [req.params.id]
    );

    // Get active discounts applicable
    const { rows: discounts } = await db.query(
      `SELECT id, name, discount_type, value
       FROM discounts
       WHERE is_active = true
         AND (applies_to = 'ALL' OR applies_to = 'PRODUCTS')
         AND (start_date IS NULL OR start_date <= CURRENT_DATE)
         AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       ORDER BY value DESC`
    );

    sendSuccess(res, {
      ...products[0],
      plans,
      variants,
      discounts,
    });
  } catch (e) { next(e); }
});

// ── Product types for category filter ────────────────────────────
router.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT product_type, COUNT(*) as count
       FROM products WHERE is_active = true
       GROUP BY product_type ORDER BY product_type`
    );
    sendSuccess(res, rows);
  } catch (e) { next(e); }
});

// ── Price range ──────────────────────────────────────────────────
router.get("/price-range", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      "SELECT COALESCE(MIN(sales_price), 0) as min, COALESCE(MAX(sales_price), 0) as max FROM products WHERE is_active = true"
    );
    sendSuccess(res, rows[0]);
  } catch (e) { next(e); }
});

export const shopRoutes = router;
