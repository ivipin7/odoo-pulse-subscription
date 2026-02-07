import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/products/products.routes';
import { subscriptionRoutes } from './modules/subscriptions/subscriptions.routes';
import { invoiceRoutes } from './modules/invoices/invoices.routes';
import paymentRoutes from './modules/payments/payments.routes';
import recoveryRoutes from './modules/recovery/recovery.routes';
import orderRoutes from './modules/orders/orders.routes';
import cartRoutes from './modules/cart/cart.routes';
import quotationRoutes from './modules/quotations/quotations.routes';
import discountRoutes from './modules/discounts/discounts.routes';
import taxRoutes from './modules/taxes/taxes.routes';
import userRoutes from './modules/users/users.routes';
import profileRoutes from './modules/profile/profile.routes';

const app = express();

// ─── Global Middleware ────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// ─── Health Check ─────────────────────────────
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

// ─── Global Error Handler (must be LAST) ─────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀 OdooPulse server running on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

export default app;
