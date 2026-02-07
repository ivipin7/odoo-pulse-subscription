import { Request, Response, NextFunction } from 'express';

// Map known error messages to HTTP status codes (for plain Error throws)
const STATUS_MAP: Record<string, number> = {
  'Invoice not found': 404,
  'Payment not found': 404,
  'Subscription not found': 404,
  'Invoice already paid — cannot retry': 409,
  'Only FAILED invoices can be retried': 400,
  'Maximum retry limit (3) reached': 400,
  'Only CONFIRMED invoices can be processed': 400,
  'Invalid invoice ID': 400,
};

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Error:', err.message || err);

  const status = err.statusCode || STATUS_MAP[err.message] || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR');

  res.status(status).json({
    success: false,
    error: {
      code,
      message: err.message || 'Something went wrong',
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
