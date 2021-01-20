import { DefinedError } from 'ajv';
import { ValidationError } from '../../../common';

export default class ValidationErrorMapper {
  static toValidationError(error: ValidationError): ValidationError {
    const ajvErrors = error.info as DefinedError[];
    const errorDetail = ajvErrors.reduce((prev, ajvError) => {
      const dataPath = ajvError.keyword === 'required'
        ? ajvError.params.missingProperty
        : ajvError.dataPath;

      const message = ajvError.keyword === 'required'
        ? 'missing required property'
        : ajvError.message;

      return ({
        ...prev,
        [dataPath]: message,
      });
    }, {});
    return new ValidationError('invalid request', {
      info: errorDetail,
      cause: error,
    });
  }
}
