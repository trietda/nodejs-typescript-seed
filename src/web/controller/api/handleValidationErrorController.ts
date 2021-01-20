import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../../common';

export default function handleValidationError(
  err: Error | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!(err instanceof ValidationError)) {
    next(err);
    return;
  }

  res.status(400).json({
    message: 'invalid request',
    detail: (err as ValidationError).info,
  });
}
