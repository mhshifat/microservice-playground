import { Response } from "express";
import generateUniqueId from "./generateUniqueId";

type ErrorMessage = { path: string, message: string };
type SuccessResponse<T> = { result: T, success: true, message?: never, errors?: never, identifier?: never } 
type ErrorResponse = { success: false, message: string, errors?: never, identifier: string, result?: never } 
type ValidationErrorResponse = { success: false, message: string, errors: ErrorMessage[], identifier: string, result?: never } 

type RequestResponse<T = any> = (SuccessResponse<T> | ErrorResponse | ValidationErrorResponse)

class RequestResponseClass {
  constructor() {}

  success<T>(res: Response<RequestResponse<T>>, data: T, status: number) {
    return res.status(status).json({
      success: true,
      result: data
    });
  }

  error(res: Response<RequestResponse>, message: string, status: number) {
    const errIdentifier = generateUniqueId();
    return res.status(status || 500).json({
      success: false,
      identifier: errIdentifier,
      message: message || "Something went wrong"
    });
  }

  validationResponse(res: Response<RequestResponse>, errors: ErrorMessage[]) {
    const errIdentifier = generateUniqueId();
    return res.status(422).json({
      success: false,
      identifier: errIdentifier,
      message: "Invalid Fields",
      errors,
    });
  }
}

const RequestResponse = new RequestResponseClass();
export default RequestResponse;