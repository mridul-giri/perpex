export class EngineError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
    this.name = "EngineError";
  }
}
