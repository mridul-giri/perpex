export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.status = status || 500;
    this.name = "ApiError";
  }
}
