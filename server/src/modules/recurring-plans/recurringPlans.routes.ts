import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { db } from "../../db/pool.js";
import { sendSuccess, sendList } from "../../utils/response.js";
import { validate } from "../../middleware/validate.js";
import { z } from "zod";

const router = Router();

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  billing_period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  billing_interval: z.number().int().min(1).default(1),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  min_quantity: z.number().int().min(1).default(1),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  auto_close: z.boolean().default(false),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(true),
});
const updatePlanSchema = createPlanSchema.partial();

// List all plans
router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const [data, countRes] = await Promise.all([
      db.query("SELECT * FROM recurring_plans WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
      db.query("SELECT COUNT(*) FROM recurring_plans WHERE is_active = true"),
    ]);
    sendList(res, data.rows, parseInt(countRes.rows[0].count, 10), page, limit);
  } catch (e) { next(e); }
});

// Get by id
router.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query("SELECT * FROM recurring_plans WHERE id = $1 AND is_active = true", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Plan not found" } });
    sendSuccess(res, rows[0]);
  } catch (e) { next(e); }
});

// Create
router.post("/", authenticate, authorize("ADMIN"), validate(createPlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, billing_period, billing_interval, description, price, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable } = req.body;
    const { rows } = await db.query(
      `INSERT INTO recurring_plans (name, billing_period, billing_interval, description, price, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, billing_period, billing_interval || 1, description || null, price || 0, min_quantity || 1, start_date || null, end_date || null, auto_close ?? false, closable ?? true, pausable ?? false, renewable ?? true]
    );
    sendSuccess(res, rows[0], "Plan created", 201);
  } catch (e) { next(e); }
});

// Update
router.put("/:id", authenticate, authorize("ADMIN"), validate(updatePlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of ["name", "billing_period", "billing_interval", "description", "price", "min_quantity", "start_date", "end_date", "auto_close", "closable", "pausable", "renewable"]) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${idx++}`); values.push(req.body[key]); }
    }
    if (!fields.length) return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "No fields to update" } });
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE recurring_plans SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} AND is_active = true RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Plan not found" } });
    sendSuccess(res, rows[0]);
  } catch (e) { next(e); }
});

// Soft delete
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      "UPDATE recurring_plans SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Plan not found" } });
    sendSuccess(res, null, "Plan deleted");
  } catch (e) { next(e); }
});

export const recurringPlanRoutes = router;
