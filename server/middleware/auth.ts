import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT verification middleware.
 * Extracts token from Authorization header, verifies, and attaches user to req.
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next({ status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    next({ status: 401, code: 'UNAUTHORIZED', message: 'Token expired or invalid' });
  }
}

/**
 * Role-based access control middleware.
 * Usage: authorize('ADMIN', 'SUPER_ADMIN')
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next({ status: 401, code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return next({ status: 403, code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}
