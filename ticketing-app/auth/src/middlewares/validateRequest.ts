import { AnySchema, ValidationError } from "joi";
import { NextFunction, Request, Response } from "express";
import RequestResponse from "../utils/response";

export default function validateRequest(bodySchema: AnySchema, paramSchema?: AnySchema, querySchema?: AnySchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all([
        bodySchema.validateAsync(req.body, { abortEarly: false }),
        paramSchema?.validateAsync(req.body, { abortEarly: false }),
        querySchema?.validateAsync(req.body, { abortEarly: false }),
      ])
      return next();
    } catch (err) {
      if (err instanceof ValidationError) {
        const formatedErrors = err.details.map(e => ({ path: e.path[0] + "", message: e.message })); 
        return RequestResponse.validationResponse(res, formatedErrors);
      }
      return next(err);
    }
  }
}