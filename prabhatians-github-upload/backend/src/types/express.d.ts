import type { Role } from "../models";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string };
    }
  }
}

export {};
