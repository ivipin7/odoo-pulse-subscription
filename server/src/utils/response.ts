import { Response } from "express";

export function sendSuccess(res: Response, data: unknown, message?: string, status = 200) {
  res.status(status).json({ success: true, data, ...(message && { message }) });
}

export function sendList(res: Response, data: unknown[], total: number, page: number, limit: number) {
  res.json({ success: true, data, total, page, limit });
}

export function sendError(res: Response, status: number, code: string, message: string, details?: unknown) {
  res.status(status).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
}
