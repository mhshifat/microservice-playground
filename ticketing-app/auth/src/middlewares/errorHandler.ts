import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/error";
import RequestResponse from "../utils/response";

export default function errHandler(err: Error, _: Request, res: Response, __: NextFunction) {
  if (err instanceof HttpError) {
    return RequestResponse.error(res, err.message, err.status);
  } else {
    return RequestResponse.error(res, "Something went wrong", 500);
  }
}