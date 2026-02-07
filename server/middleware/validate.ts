import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(createProductSchema), controller.create)
 *
 * Validates req.body against the provided Zod schema.
 * On failure, passes a structured error to the error handler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: err.errors[0]?.message || 'Invalid request body',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
