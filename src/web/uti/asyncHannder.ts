import { Request, Response, NextFunction } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => any;

export default function asyncHandler(handler: Handler) {
  return async function wrappedHandler(req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
