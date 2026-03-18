export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class GatewayUnavailableError extends AppError {
  constructor(message = 'Unable to connect to OpenClaw Gateway', detail?: string) {
    super('GATEWAY_UNAVAILABLE', 503, message, detail);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'OpenClaw Gateway request timed out', detail?: string) {
    super('GATEWAY_TIMEOUT', 504, message, detail);
  }
}
