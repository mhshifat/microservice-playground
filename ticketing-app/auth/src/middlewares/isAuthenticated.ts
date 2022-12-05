import { NextFunction, Request, Response } from 'express';
import RequestResponse from './../utils/response';

export default function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) return RequestResponse.error(res, "Forbidden", 403);
  return next();
}