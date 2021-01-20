import { Request, Response, NextFunction } from 'express';
import { Schema } from 'ajv';
import { ValidationErrorMapper, ValidationService } from '../service';
import { ValidationError } from '../../common';

export type ValidatePlace = 'header' | 'body';

export default function validateMiddlewareFactory(schema: Schema, place: ValidatePlace = 'body') {
  return function validateMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const validationService = new ValidationService();
      const validatingData = req[place];
      validationService.validate(schema, validatingData);
      next();
    } catch (err) {
      throw ValidationErrorMapper.toValidationError(err as ValidationError);
    }
  };
}
