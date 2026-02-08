import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Route imports
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { subscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes.js";
import { invoicesRoutes } from "./modules/invoices/invoices.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { discountsRoutes } from "./modules/discounts/discounts.routes.js";
import { taxesRoutes } from "./modules/taxes/taxes.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { recurringPlanRoutes } from "./modules/recurring-plans/recurringPlans.routes.js";
import { quotationTemplateRoutes } from "./modules/quotation-templates/quotationTemplates.routes.js";
import { shopRoutes } from "./modules/shop/shop.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { churnRoutes } from "./modules/churn/churn.routes.js";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/recurring-plans", recurringPlanRoutes);
app.use("/api/quotation-templates", quotationTemplateRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/churn", churnRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
});

export default app;
