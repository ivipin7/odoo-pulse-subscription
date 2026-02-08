import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { db } from "../../db/pool.js";
import { sendSuccess } from "../../utils/response.js";

const router = Router();
router.use(authenticate);

// ────────────────────────────────────────────────
// Churn-risk scoring algorithm
// ────────────────────────────────────────────────
// Analyses real data signals per customer to produce a 0-100 risk score:
//   - Late / failed payments          (max 30 pts)
//   - Overdue unpaid invoices         (max 25 pts)
//   - Subscription age (new = risky)  (max 15 pts)
//   - Payment gaps / inactivity       (max 15 pts)
//   - Approaching expiration          (max 15 pts)
// ────────────────────────────────────────────────

interface RiskFactor {
  factor: string;
  score: number;
  detail: string;
}

interface AtRiskSubscription {
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string | null;
  status: string;
  start_date: string | null;
  expiration_date: string | null;
  total_amount: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: RiskFactor[];
  recommended_actions: string[];
}

// GET /api/churn/at-risk  — admin / internal only
router.get(
  "/at-risk",
  authorize("ADMIN", "INTERNAL"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch all non-closed subscriptions with customer info
      const subsResult = await db.query(`
        SELECT
          s.id            AS subscription_id,
          s.subscription_number,
          s.customer_id,
          u.first_name || ' ' || u.last_name AS customer_name,
          u.email         AS customer_email,
          rp.name         AS plan_name,
          s.status,
          s.start_date,
          s.expiration_date,
          s.created_at,
          COALESCE(SUM(sl.subtotal), 0) AS total_amount
        FROM subscriptions s
        JOIN users u            ON s.customer_id = u.id
        LEFT JOIN recurring_plans rp ON s.recurring_plan_id = rp.id
        LEFT JOIN subscription_lines sl ON sl.subscription_id = s.id
        WHERE s.status IN ('ACTIVE', 'CONFIRMED', 'QUOTATION')
        GROUP BY s.id, s.subscription_number, s.customer_id,
                 u.first_name, u.last_name, u.email, rp.name,
                 s.status, s.start_date, s.expiration_date, s.created_at
      `);

      if (subsResult.rows.length === 0) {
        return sendSuccess(res, { atRisk: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } });
      }

      const customerIds = [...new Set(subsResult.rows.map((r: any) => r.customer_id))];

      // Batch-fetch payment & invoice signals for all relevant customers
      const [failedPayments, overdueInvoices, lastPaymentDates, invoiceCounts] = await Promise.all([
        // Failed / late payments per customer
        db.query(`
          SELECT p.customer_id,
                 COUNT(*) FILTER (WHERE p.status = 'FAILED')   AS failed_count,
                 COUNT(*) FILTER (WHERE p.status = 'COMPLETED' AND p.payment_date > i.due_date) AS late_count,
                 COUNT(*) AS total_payments
          FROM payments p
          JOIN invoices i ON p.invoice_id = i.id
          WHERE p.customer_id = ANY($1)
          GROUP BY p.customer_id
        `, [customerIds]),

        // Current overdue invoices per customer
        db.query(`
          SELECT i.customer_id,
                 COUNT(*) AS overdue_count,
                 COALESCE(SUM(i.total), 0) AS overdue_amount,
                 MIN(i.due_date) AS oldest_due
          FROM invoices i
          WHERE i.status = 'CONFIRMED' AND i.due_date < NOW() AND i.customer_id = ANY($1)
          GROUP BY i.customer_id
        `, [customerIds]),

        // Last payment date per customer
        db.query(`
          SELECT customer_id, MAX(payment_date) AS last_payment
          FROM payments
          WHERE status = 'COMPLETED' AND customer_id = ANY($1)
          GROUP BY customer_id
        `, [customerIds]),

        // Total invoices per customer (to gauge activity)
        db.query(`
          SELECT customer_id, COUNT(*) AS invoice_count
          FROM invoices
          WHERE customer_id = ANY($1)
          GROUP BY customer_id
        `, [customerIds]),
      ]);

      // Index lookup maps
      const failedMap = new Map(failedPayments.rows.map((r: any) => [r.customer_id, r]));
      const overdueMap = new Map(overdueInvoices.rows.map((r: any) => [r.customer_id, r]));
      const lastPayMap = new Map(lastPaymentDates.rows.map((r: any) => [r.customer_id, r]));
      const invCountMap = new Map(invoiceCounts.rows.map((r: any) => [r.customer_id, r]));

      const now = new Date();
      const results: AtRiskSubscription[] = [];

      for (const sub of subsResult.rows) {
        const factors: RiskFactor[] = [];
        let score = 0;

        const cid = sub.customer_id;
        const failed = failedMap.get(cid);
        const overdue = overdueMap.get(cid);
        const lastPay = lastPayMap.get(cid);
        const invCount = invCountMap.get(cid);

        // ──── Signal 1: Failed / late payments (max 30) ────
        if (failed) {
          const failedCnt = parseInt(failed.failed_count, 10);
          const lateCnt = parseInt(failed.late_count, 10);
          const totalPay = parseInt(failed.total_payments, 10);

          if (failedCnt > 0) {
            const fScore = Math.min(failedCnt * 8, 20);
            score += fScore;
            factors.push({ factor: "Failed Payments", score: fScore, detail: `${failedCnt} failed payment(s)` });
          }
          if (lateCnt > 0 && totalPay > 0) {
            const lateRatio = lateCnt / totalPay;
            const lScore = Math.min(Math.round(lateRatio * 20), 10);
            score += lScore;
            factors.push({ factor: "Late Payments", score: lScore, detail: `${lateCnt} of ${totalPay} payments were late (${Math.round(lateRatio * 100)}%)` });
          }
        }

        // ──── Signal 2: Overdue invoices (max 25) ────
        if (overdue) {
          const cnt = parseInt(overdue.overdue_count, 10);
          const oldestDue = new Date(overdue.oldest_due);
          const daysPastDue = Math.floor((now.getTime() - oldestDue.getTime()) / 86400000);

          let oScore = Math.min(cnt * 5, 10);
          if (daysPastDue > 60) oScore += 15;
          else if (daysPastDue > 30) oScore += 10;
          else if (daysPastDue > 14) oScore += 5;
          oScore = Math.min(oScore, 25);

          score += oScore;
          factors.push({
            factor: "Overdue Invoices",
            score: oScore,
            detail: `${cnt} overdue invoice(s), oldest ${daysPastDue} days past due (₹${parseFloat(overdue.overdue_amount).toFixed(0)})`,
          });
        }

        // ──── Signal 3: Subscription age – new subs churn more (max 15) ────
        if (sub.start_date) {
          const ageDays = Math.floor((now.getTime() - new Date(sub.start_date).getTime()) / 86400000);
          if (ageDays < 30) {
            score += 15;
            factors.push({ factor: "New Subscription", score: 15, detail: `Only ${ageDays} days old — high early-churn risk` });
          } else if (ageDays < 90) {
            score += 8;
            factors.push({ factor: "Recent Subscription", score: 8, detail: `${ageDays} days old — still in early phase` });
          }
        }

        // ──── Signal 4: Payment inactivity / gaps (max 15) ────
        if (lastPay) {
          const daysSincePay = Math.floor((now.getTime() - new Date(lastPay.last_payment).getTime()) / 86400000);
          if (daysSincePay > 90) {
            score += 15;
            factors.push({ factor: "Payment Inactivity", score: 15, detail: `No payment in ${daysSincePay} days` });
          } else if (daysSincePay > 45) {
            score += 8;
            factors.push({ factor: "Payment Gap", score: 8, detail: `Last payment ${daysSincePay} days ago` });
          }
        } else if (invCount && parseInt(invCount.invoice_count, 10) > 0) {
          // Has invoices but zero payments
          score += 12;
          factors.push({ factor: "No Payments", score: 12, detail: `${invCount.invoice_count} invoice(s) issued but no payment ever received` });
        }

        // ──── Signal 5: Approaching expiration (max 15) ────
        if (sub.expiration_date) {
          const daysToExpiry = Math.floor((new Date(sub.expiration_date).getTime() - now.getTime()) / 86400000);
          if (daysToExpiry < 0) {
            score += 15;
            factors.push({ factor: "Expired", score: 15, detail: `Expired ${Math.abs(daysToExpiry)} days ago — needs renewal` });
          } else if (daysToExpiry <= 7) {
            score += 12;
            factors.push({ factor: "Expiring Soon", score: 12, detail: `Expires in ${daysToExpiry} day(s)` });
          } else if (daysToExpiry <= 30) {
            score += 6;
            factors.push({ factor: "Upcoming Expiry", score: 6, detail: `Expires in ${daysToExpiry} days` });
          }
        }

        // Normalize to 0-100
        const finalScore = Math.min(score, 100);
        const level: AtRiskSubscription["risk_level"] =
          finalScore >= 70 ? "CRITICAL" :
          finalScore >= 45 ? "HIGH" :
          finalScore >= 20 ? "MEDIUM" : "LOW";

        // Generate actionable recommendations
        const actions: string[] = [];
        if (factors.some((f) => f.factor === "Failed Payments")) actions.push("Contact customer about payment method issues");
        if (factors.some((f) => f.factor === "Overdue Invoices")) actions.push("Send payment reminder or escalate collection");
        if (factors.some((f) => f.factor === "No Payments")) actions.push("Follow up on unpaid invoices — possible billing issue");
        if (factors.some((f) => f.factor === "Payment Inactivity" || f.factor === "Payment Gap")) actions.push("Schedule a check-in call to re-engage customer");
        if (factors.some((f) => f.factor === "New Subscription" || f.factor === "Recent Subscription")) actions.push("Initiate onboarding outreach to improve retention");
        if (factors.some((f) => f.factor === "Expiring Soon" || f.factor === "Upcoming Expiry")) actions.push("Send renewal offer or discount to retain customer");
        if (factors.some((f) => f.factor === "Expired")) actions.push("Urgent: reach out with a win-back offer before customer is lost");
        if (level === "CRITICAL") actions.push("Assign dedicated account manager immediately");

        results.push({
          subscription_id: sub.subscription_id,
          subscription_number: sub.subscription_number,
          customer_id: sub.customer_id,
          customer_name: sub.customer_name,
          customer_email: sub.customer_email,
          plan_name: sub.plan_name,
          status: sub.status,
          start_date: sub.start_date,
          expiration_date: sub.expiration_date,
          total_amount: parseFloat(sub.total_amount),
          risk_score: finalScore,
          risk_level: level,
          risk_factors: factors,
          recommended_actions: actions,
        });
      }

      // Sort by risk score descending
      results.sort((a, b) => b.risk_score - a.risk_score);

      const summary = {
        total: results.length,
        critical: results.filter((r) => r.risk_level === "CRITICAL").length,
        high: results.filter((r) => r.risk_level === "HIGH").length,
        medium: results.filter((r) => r.risk_level === "MEDIUM").length,
        low: results.filter((r) => r.risk_level === "LOW").length,
        avg_score: results.length ? Math.round(results.reduce((s, r) => s + r.risk_score, 0) / results.length) : 0,
        at_risk_revenue: results
          .filter((r) => r.risk_level === "CRITICAL" || r.risk_level === "HIGH")
          .reduce((s, r) => s + r.total_amount, 0),
      };

      sendSuccess(res, { atRisk: results, summary });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/churn/score/:subscriptionId — single subscription risk score
router.get(
  "/score/:subscriptionId",
  authorize("ADMIN", "INTERNAL"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Redirect to at-risk and filter — keeps logic DRY
      // For a single sub we do targeted query
      const { subscriptionId } = req.params;

      const subRes = await db.query(`
        SELECT s.id, s.customer_id, s.status, s.start_date, s.expiration_date
        FROM subscriptions s WHERE s.id = $1
      `, [subscriptionId]);

      if (subRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Subscription not found" } });
      }

      const sub = subRes.rows[0];
      const cid = sub.customer_id;
      const now = new Date();

      const [failed, overdue, lastPay, invCount] = await Promise.all([
        db.query(`
          SELECT COUNT(*) FILTER (WHERE p.status = 'FAILED') AS failed_count,
                 COUNT(*) FILTER (WHERE p.status = 'COMPLETED' AND p.payment_date > i.due_date) AS late_count,
                 COUNT(*) AS total_payments
          FROM payments p JOIN invoices i ON p.invoice_id = i.id
          WHERE p.customer_id = $1`, [cid]),
        db.query(`
          SELECT COUNT(*) AS overdue_count, MIN(due_date) AS oldest_due
          FROM invoices WHERE status = 'CONFIRMED' AND due_date < NOW() AND customer_id = $1`, [cid]),
        db.query(`SELECT MAX(payment_date) AS last_payment FROM payments WHERE status = 'COMPLETED' AND customer_id = $1`, [cid]),
        db.query(`SELECT COUNT(*) AS invoice_count FROM invoices WHERE customer_id = $1`, [cid]),
      ]);

      let score = 0;
      const factors: RiskFactor[] = [];

      // Signal 1: Failed / late
      const f = failed.rows[0];
      const failedCnt = parseInt(f.failed_count, 10);
      const lateCnt = parseInt(f.late_count, 10);
      const totalPay = parseInt(f.total_payments, 10);
      if (failedCnt > 0) { const s = Math.min(failedCnt * 8, 20); score += s; factors.push({ factor: "Failed Payments", score: s, detail: `${failedCnt} failed` }); }
      if (lateCnt > 0 && totalPay > 0) { const r = lateCnt / totalPay; const s = Math.min(Math.round(r * 20), 10); score += s; factors.push({ factor: "Late Payments", score: s, detail: `${lateCnt}/${totalPay} late` }); }

      // Signal 2: Overdue
      const o = overdue.rows[0];
      const odc = parseInt(o.overdue_count, 10);
      if (odc > 0) { const dpd = Math.floor((now.getTime() - new Date(o.oldest_due).getTime()) / 86400000); let s = Math.min(odc * 5, 10); if (dpd > 60) s += 15; else if (dpd > 30) s += 10; else if (dpd > 14) s += 5; s = Math.min(s, 25); score += s; factors.push({ factor: "Overdue Invoices", score: s, detail: `${odc} overdue, ${dpd}d past due` }); }

      // Signal 3: Age
      if (sub.start_date) { const age = Math.floor((now.getTime() - new Date(sub.start_date).getTime()) / 86400000); if (age < 30) { score += 15; factors.push({ factor: "New Subscription", score: 15, detail: `${age}d old` }); } else if (age < 90) { score += 8; factors.push({ factor: "Recent Subscription", score: 8, detail: `${age}d old` }); } }

      // Signal 4: Inactivity
      const lp = lastPay.rows[0];
      if (lp.last_payment) { const d = Math.floor((now.getTime() - new Date(lp.last_payment).getTime()) / 86400000); if (d > 90) { score += 15; factors.push({ factor: "Payment Inactivity", score: 15, detail: `${d}d since last payment` }); } else if (d > 45) { score += 8; factors.push({ factor: "Payment Gap", score: 8, detail: `${d}d ago` }); } }
      else if (parseInt(invCount.rows[0].invoice_count, 10) > 0) { score += 12; factors.push({ factor: "No Payments", score: 12, detail: "Invoices exist but no payment" }); }

      // Signal 5: Expiry
      if (sub.expiration_date) { const dte = Math.floor((new Date(sub.expiration_date).getTime() - now.getTime()) / 86400000); if (dte < 0) { score += 15; factors.push({ factor: "Expired", score: 15, detail: `${Math.abs(dte)}d ago` }); } else if (dte <= 7) { score += 12; factors.push({ factor: "Expiring Soon", score: 12, detail: `${dte}d left` }); } else if (dte <= 30) { score += 6; factors.push({ factor: "Upcoming Expiry", score: 6, detail: `${dte}d left` }); } }

      const finalScore = Math.min(score, 100);
      const level = finalScore >= 70 ? "CRITICAL" : finalScore >= 45 ? "HIGH" : finalScore >= 20 ? "MEDIUM" : "LOW";

      sendSuccess(res, { subscription_id: subscriptionId, risk_score: finalScore, risk_level: level, risk_factors: factors });
    } catch (e) { next(e); }
  }
);

export const churnRoutes = router;
