import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, type Role } from "../models";
import { HttpError } from "../utils/http";
type Payload = { sub: string; role: Role; email: string };
export function signToken(payload: Payload): string { return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d", issuer: "prabhatians-api", audience: "prabhatians-client" }); }
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) { next(new HttpError(401, "A valid bearer token is required.")); return; }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { issuer: "prabhatians-api", audience: "prabhatians-client" }) as Payload;
    void User.findById(payload.sub).then((user) => {
      if (!user || !user.isActive) { next(new HttpError(401, "This account is unavailable.")); return; }
      req.user = { id: String(user._id), role: user.role, email: user.email };
      next();
    }).catch(next);
  } catch { next(new HttpError(401, "The access token is invalid or expired.")); }
}
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header) { next(); return; }
  if (!header.startsWith("Bearer ")) { next(); return; }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { issuer: "prabhatians-api", audience: "prabhatians-client" }) as Payload;
    void User.findById(payload.sub).then((user) => {
      if (user?.isActive) req.user = { id: String(user._id), role: user.role, email: user.email };
      next();
    }).catch(next);
  } catch { next(); }
}
export function allowRoles(...roles: Role[]) { return (req: Request, _res: Response, next: NextFunction): void => { if (!req.user) return next(new HttpError(401, "Authentication is required.")); if (!roles.includes(req.user.role)) return next(new HttpError(403, "You do not have permission to perform this action.")); next(); }; }

