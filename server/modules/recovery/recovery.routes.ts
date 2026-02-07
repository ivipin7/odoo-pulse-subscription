import { Router } from 'express';
import { RecoveryController } from './recovery.controller';

const router = Router();

/**
 * Recovery Routes — Admin dashboard for payment recovery monitoring
 *
 * GET /api/recovery/dashboard  — Recovery KPIs (failed, at-risk, recovered, revenue)
 * GET /api/recovery/at-risk    — At-risk subscriptions with details + retry info
 * GET /api/recovery/timeline   — Recovery actions audit log (payment_retries)
 */

// Recovery dashboard KPIs
router.get('/dashboard', RecoveryController.getDashboard);

// At-risk subscriptions list
router.get('/at-risk', RecoveryController.getAtRiskSubscriptions);

// Recovery timeline (audit log)
router.get('/timeline', RecoveryController.getTimeline);

export default router;
