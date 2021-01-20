export type BaseErrorOptions = {
  code?: string;
  cause?: Error;
  info?: any;
};

export default class BaseError extends Error {
  readonly code?: string;

  readonly cause?: Error;

  readonly info?: any;

  constructor(message: string, options: BaseErrorOptions = {}) {
    const trueProto = new.target.prototype;
    super(message);
    Object.setPrototypeOf(this, trueProto);

    this.code = options.code;
    this.cause = options.cause;
    this.info = options.info;
  }
}
