import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Error:', err.message || err);

  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

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
