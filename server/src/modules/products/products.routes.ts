import { Router } from "express";
import { productsController } from "./products.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createProductSchema, updateProductSchema } from "./products.schema.js";

const router = Router();

// Public
router.get("/", productsController.list);
router.get("/:id", productsController.getById);

// Admin only
router.post("/", authenticate, authorize("ADMIN"), validate(createProductSchema), productsController.create);
router.put("/:id", authenticate, authorize("ADMIN"), validate(updateProductSchema), productsController.update);
router.delete("/:id", authenticate, authorize("ADMIN"), productsController.delete);

// Product Variants
router.get("/:id/variants", authenticate, productsController.getVariants);
router.post("/:id/variants", authenticate, authorize("ADMIN"), productsController.addVariant);
router.delete("/:id/variants/:variantId", authenticate, authorize("ADMIN"), productsController.removeVariant);

// Product Attributes (global)
router.get("/attributes/all", authenticate, productsController.listAttributes);
router.post("/attributes", authenticate, authorize("ADMIN"), productsController.createAttribute);
router.post("/attributes/:attrId/values", authenticate, authorize("ADMIN"), productsController.createAttributeValue);

export const productsRoutes = router;
