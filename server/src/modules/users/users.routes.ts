import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./users.schema.js";
import { sendSuccess, sendList } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { db } from "../../db/pool.js";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";

const router = Router();
router.use(authenticate);

// List users (admin / internal)
router.get("/", authorize("ADMIN", "INTERNAL"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role as string | undefined;

    let where = "";
    const params: unknown[] = [];
    if (role) { params.push(role); where = `WHERE role = $${params.length}`; }

    const countResult = await db.query(`SELECT COUNT(*) FROM users ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    params.push(limit, offset);
    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone, address, role, is_active, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    sendList(res, result.rows, total, page, limit);
  } catch (e) { next(e); }
});

// Create internal user (admin only)
router.post("/", authorize("ADMIN"), validate(createUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, first_name, last_name, phone, address, role } = req.body;
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) throw new AppError(409, "EMAIL_EXISTS", "Email already registered");

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, address, role, is_active, created_at`,
      [email, hash, first_name, last_name, phone || null, address || null, role || "PORTAL"]
    );
    sendSuccess(res, result.rows[0], "User created", 201);
  } catch (e) { next(e); }
});

// Update user (admin only)
router.put("/:id", authorize("ADMIN"), validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const { first_name, last_name, phone, address, role, email } = req.body;

    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(first_name); }
    if (last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(last_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }

    if (fields.length === 0) throw new AppError(400, "NO_FIELDS", "Nothing to update");
    fields.push("updated_at = NOW()");
    values.push(req.params.id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, email, first_name, last_name, phone, address, role, is_active, created_at`,
      values
    );
    if (!result.rows[0]) throw new AppError(404, "NOT_FOUND", "User not found");
    sendSuccess(res, result.rows[0], "Updated");
  } catch (e) { next(e); }
});

// Toggle active
router.patch("/:id/toggle", authorize("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, is_active",
      [req.params.id]
    );
    if (!result.rows[0]) throw new AppError(404, "NOT_FOUND", "User not found");
    sendSuccess(res, result.rows[0], "Toggled");
  } catch (e) { next(e); }
});

export const usersRoutes = router;
