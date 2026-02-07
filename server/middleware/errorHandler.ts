import { Request, Response, NextFunction } from 'express';

interface AppError {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
}

/**
 * Global error handler middleware.
 * Must be registered LAST with app.use(errorHandler).
 *
 * Standard error response:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Email is required",
 *     "details": [...]
 *   }
 * }
 */
export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  console.error(`[${code}] ${message}`, err.details || '');

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
