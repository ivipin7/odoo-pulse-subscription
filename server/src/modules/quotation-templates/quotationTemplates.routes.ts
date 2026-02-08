import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { db } from "../../db/pool.js";
import { sendSuccess, sendList } from "../../utils/response.js";
import { validate } from "../../middleware/validate.js";
import { z } from "zod";

const router = Router();

const templateLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().min(1).default(1),
  description: z.string().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  recurring_plan_id: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().uuid().nullable().optional()
  ),
  validity_days: z.coerce.number().int().min(1).default(30),
  notes: z.string().optional(),
  lines: z.array(templateLineSchema).min(1),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  recurring_plan_id: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().uuid().nullable().optional()
  ),
  validity_days: z.coerce.number().int().min(1).optional(),
  notes: z.string().optional(),
  lines: z.array(templateLineSchema).min(1).optional(),
});

// List
router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || "").trim();

    let whereClause = "qt.is_active = true";
    const params: any[] = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND qt.name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    params.push(limit, offset);
    const [data, countRes] = await Promise.all([
      db.query(
        `SELECT qt.*, rp.name as plan_name,
         (SELECT COUNT(*) FROM quotation_template_lines qtl WHERE qtl.template_id = qt.id) as line_count
         FROM quotation_templates qt
         LEFT JOIN recurring_plans rp ON qt.recurring_plan_id = rp.id
         WHERE ${whereClause} ORDER BY qt.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        params
      ),
      db.query(
        `SELECT COUNT(*) FROM quotation_templates qt WHERE ${whereClause}`,
        search ? [`%${search}%`] : []
      ),
    ]);
    sendList(res, data.rows, parseInt(countRes.rows[0].count, 10), page, limit);
  } catch (e) { next(e); }
});

// Get by id with lines
router.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT qt.*, rp.name as plan_name FROM quotation_templates qt
       LEFT JOIN recurring_plans rp ON qt.recurring_plan_id = rp.id
       WHERE qt.id = $1 AND qt.is_active = true`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Template not found" } });
    
    const lines = await db.query(
      `SELECT qtl.*, p.name as product_name, p.sales_price as unit_price FROM quotation_template_lines qtl
       JOIN products p ON qtl.product_id = p.id
       WHERE qtl.template_id = $1`,
      [req.params.id]
    );
    sendSuccess(res, { ...rows[0], lines: lines.rows });
  } catch (e) { next(e); }
});

// Create with lines
router.post("/", authenticate, authorize("ADMIN"), validate(createTemplateSchema), async (req: Request, res: Response, next: NextFunction) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const { name, recurring_plan_id, validity_days, notes, lines } = req.body;
    const { rows } = await client.query(
      "INSERT INTO quotation_templates (name, recurring_plan_id, validity_days, notes) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, recurring_plan_id, validity_days || 30, notes || null]
    );
    const template = rows[0];
    for (const line of lines) {
      await client.query(
        "INSERT INTO quotation_template_lines (template_id, product_id, quantity, description) VALUES ($1,$2,$3,$4)",
        [template.id, line.product_id, line.quantity || 1, line.description || null]
      );
    }
    await client.query("COMMIT");
    sendSuccess(res, template, "Template created", 201);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// Update (header + lines replacement)
router.put("/:id", authenticate, authorize("ADMIN"), validate(updateTemplateSchema), async (req: Request, res: Response, next: NextFunction) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Update header fields
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of ["name", "recurring_plan_id", "validity_days", "notes"]) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${idx++}`); values.push(req.body[key]); }
    }
    if (fields.length) {
      values.push(req.params.id);
      const { rows } = await client.query(
        `UPDATE quotation_templates SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} AND is_active = true RETURNING *`,
        values
      );
      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Template not found" } });
      }
    }

    // Replace lines if provided
    if (req.body.lines && req.body.lines.length > 0) {
      await client.query("DELETE FROM quotation_template_lines WHERE template_id = $1", [req.params.id]);
      for (const line of req.body.lines) {
        await client.query(
          "INSERT INTO quotation_template_lines (template_id, product_id, quantity, description) VALUES ($1,$2,$3,$4)",
          [req.params.id, line.product_id, line.quantity || 1, line.description || null]
        );
      }
    }

    await client.query("COMMIT");

    // Fetch updated template with plan name
    const { rows: updated } = await db.query(
      `SELECT qt.*, rp.name as plan_name FROM quotation_templates qt
       LEFT JOIN recurring_plans rp ON qt.recurring_plan_id = rp.id
       WHERE qt.id = $1`,
      [req.params.id]
    );
    sendSuccess(res, updated[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// Soft delete
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      "UPDATE quotation_templates SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Template not found" } });
    sendSuccess(res, null, "Template deleted");
  } catch (e) { next(e); }
});

export const quotationTemplateRoutes = router;
