import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); this.name = "HttpError"; } }
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
export function sendData(res: Response, data: unknown, message = "Request completed", status = 200): void { res.status(status).json({ success: true, data, message }); }
export function validateBody(schema: ZodSchema) { return (req: Request, _res: Response, next: NextFunction) => { const parsed = schema.safeParse(req.body); if (!parsed.success) return next(new HttpError(400, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "))); req.body = parsed.data; next(); }; }
export function objectId(value: string | string[], label = "id"): string { if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) throw new HttpError(400, `Invalid ${label}.`); return value; }

