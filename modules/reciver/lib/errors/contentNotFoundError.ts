import { CustomError } from "./customError.js";

export class ContentNotFoundError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 404;
    this.logging = true;
  }
}
