export class HttpError extends Error {
  constructor(public status: number, public message: string) {
    super();

    Object.setPrototypeOf(this, HttpError.prototype);
  }
}