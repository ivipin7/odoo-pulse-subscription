import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createSubscriptionSchema, updateSubscriptionSchema, updateStatusSchema } from "./subscriptions.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", subscriptionsController.list);
router.get("/:id", subscriptionsController.getById);
router.get("/:id/usage", subscriptionsController.getUsage);
router.post("/", authorize("ADMIN", "INTERNAL", "PORTAL"), validate(createSubscriptionSchema), subscriptionsController.create);
router.put("/:id", authorize("ADMIN", "INTERNAL"), validate(updateSubscriptionSchema), subscriptionsController.update);
router.patch("/:id/status", authorize("ADMIN", "INTERNAL", "PORTAL"), validate(updateStatusSchema), subscriptionsController.updateStatus);
router.post("/:id/renew", authorize("ADMIN", "INTERNAL", "PORTAL"), subscriptionsController.renew);
router.delete("/:id", authorize("ADMIN"), subscriptionsController.delete);

export const subscriptionsRoutes = router;
