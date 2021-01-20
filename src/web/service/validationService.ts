import Ajv, { Schema, DefinedError } from 'ajv';
import addError from 'ajv-errors';
import addFormat from 'ajv-formats';
import { Singleton, ValidationError } from '../../common';

@Singleton
export default class ValidationService {
  private readonly ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      validateSchema: true,
    });
    addError(this.ajv);
    addFormat(this.ajv);
  }

  validate(schema: Schema, data: any): void {
    const validate = this.ajv.compile(schema);
    const isValid = validate(data);

    if (!isValid) {
      throw new ValidationError('invalid data', {
        info: validate.errors as DefinedError[],
      });
    }
  }
}
