import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Catches all errors thrown in controllers/services and returns a consistent JSON response
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Error:', err.message);

  // Map known error messages to HTTP status codes
  const statusMap: Record<string, number> = {
    'Invoice not found': 404,
    'Payment not found': 404,
    'Subscription not found': 404,
    'Invoice already paid — cannot retry': 409,
    'Only FAILED invoices can be retried': 400,
    'Maximum retry limit (3) reached': 400,
    'Subscription is already CLOSED — cannot recover': 400,
    'Invalid invoice ID': 400,
  };

  const status = statusMap[err.message] || 500;
  const code = status === 400 ? 'VALIDATION_ERROR'
    : status === 404 ? 'NOT_FOUND'
    : status === 409 ? 'CONFLICT'
    : 'INTERNAL_ERROR';

  res.status(status).json({
    success: false,
    error: {
      code,
      message: err.message || 'Internal server error',
    },
  });
}
