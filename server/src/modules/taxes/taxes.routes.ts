import { Router } from "express";
import { taxesRepository } from "./taxes.repository.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createTaxSchema, updateTaxSchema } from "./taxes.schema.js";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { Request, Response, NextFunction } from "express";

const router = Router();
router.use(authenticate);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await taxesRepository.findAll()); } catch (e) { next(e); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taxesRepository.findById(req.params.id);
    if (!t) throw new AppError(404, "NOT_FOUND", "Tax not found");
    sendSuccess(res, t);
  } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN"), validate(createTaxSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await taxesRepository.create(req.body, req.user!.userId), "Created", 201); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN"), validate(updateTaxSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taxesRepository.update(req.params.id, req.body);
    if (!t) throw new AppError(404, "NOT_FOUND", "Tax not found");
    sendSuccess(res, t, "Updated");
  } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taxesRepository.delete(req.params.id);
    if (!t) throw new AppError(404, "NOT_FOUND", "Tax not found");
    sendSuccess(res, null, "Deleted");
  } catch (e) { next(e); }
});

export const taxesRoutes = router;
