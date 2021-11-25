export class ConfigurationError extends Error {
  private readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ConfigurationError';
    this.cause = cause;
  }
}

export class WellKnownURIError extends Error {
  private readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'WellKnownURIError';
    this.cause = cause;
  }
}

export class AccessTokenError extends Error {
  private readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AccessTokenError';
    this.cause = cause;
  }
}
