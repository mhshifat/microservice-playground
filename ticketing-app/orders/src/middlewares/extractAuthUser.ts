import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";

export interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
      session?: {
        token?: string
      } | null;
    }
  }
}

export default function extractAuthUser(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).session?.token) return next();
  try {
    const payload = jwt.verify((req as any).session.token, process.env.JWT_SECRET!) as UserPayload;
    req.currentUser = payload;
  } catch (error) {
  }

  return next();
}