import { Router } from "express";
import { invoicesController } from "./invoices.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createInvoiceSchema, updateInvoiceStatusSchema } from "./invoices.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", invoicesController.list);
router.get("/:id", invoicesController.getById);
router.post("/generate", authorize("ADMIN", "INTERNAL", "PORTAL"), validate(createInvoiceSchema), invoicesController.generate);
router.post("/generate-recurring", authorize("ADMIN", "INTERNAL"), invoicesController.generateRecurring);
router.patch("/:id/status", authorize("ADMIN", "INTERNAL", "PORTAL"), validate(updateInvoiceStatusSchema), invoicesController.updateStatus);

export const invoicesRoutes = router;
