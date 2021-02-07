/**
 * The `HttpError` class extends generic `Error` class from V8 and
 * adds property code to the HTTP statuses.
 */
export class HttpError extends Error {
  /** A name of the error type. The initial value is `Error`. */
  public readonly name: string;

  /**
   * Constructs the `HttpError` instance.
   *
   * @param status The error status number.
   * @param message A human-readable description of the error.
   */
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }

  /**
   * Checks if the given error is an HTTP error.
   *
   * @param error The `Error` object that is checked.
   * @returns True is the given error is an HTTP error; false otherwise.
   */
  public static isHttpError(error: any): error is HttpError {
    return error.name === "HttpError";
  }
}
