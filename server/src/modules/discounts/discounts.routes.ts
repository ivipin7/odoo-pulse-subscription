import { Router } from "express";
import { discountsController } from "./discounts.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createDiscountSchema, updateDiscountSchema, validateDiscountSchema, applyCodeSchema } from "./discounts.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", discountsController.list);
router.get("/:id", discountsController.getById);
router.post("/", authorize("ADMIN"), validate(createDiscountSchema), discountsController.create);
router.put("/:id", authorize("ADMIN"), validate(updateDiscountSchema), discountsController.update);
router.delete("/:id", authorize("ADMIN"), discountsController.delete);
router.post("/validate", validate(validateDiscountSchema), discountsController.validate);
router.post("/apply-code", validate(applyCodeSchema), discountsController.applyCode);

export const discountsRoutes = router;
