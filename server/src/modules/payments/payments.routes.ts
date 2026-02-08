import { Router } from "express";
import { paymentsController } from "./payments.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createPaymentSchema } from "./payments.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", paymentsController.list);
router.get("/:id", paymentsController.getById);
router.post("/", authorize("ADMIN", "INTERNAL"), validate(createPaymentSchema), paymentsController.process);
router.post("/retry/:invoiceId", authorize("ADMIN"), paymentsController.retry);

export const paymentsRoutes = router;
