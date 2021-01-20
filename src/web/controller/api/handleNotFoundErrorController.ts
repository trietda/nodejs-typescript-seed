import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../../../common';

export default function handleValidationError(
  err: Error | NotFoundError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!(err instanceof NotFoundError)) {
    next(err);
    return;
  }

  res.status(404).json({ message: 'not found' });
}
