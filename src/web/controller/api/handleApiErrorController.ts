import { Request, Response, NextFunction } from 'express';

export default function handleApiError(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  global.logger?.error(err);
  res.status(500).json({ message: 'unexpected error' });
}
