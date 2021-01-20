import BaseError from '../error/BaseError';

describe('BaseError', () => {
  it('create error', () => {
    const error = new BaseError('error message');

    expect(error.message).toBe('error message');
  });

  it('create error with code', () => {
    const error = new BaseError('error message', { code: 'error code' });

    expect(error.code).toBe('error code');
  });

  it('create error with cause', () => {
    const errorCause = new Error();
    const error = new BaseError('error message', { cause: errorCause });

    expect(error.cause).toBe(errorCause);
  });

  it('create error with info', () => {
    const errorInfo = {};
    const error = new BaseError('error message', { info: errorInfo });

    expect(error.info).toBe(errorInfo);
  });
});
