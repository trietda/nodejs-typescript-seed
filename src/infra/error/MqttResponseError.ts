import BaseError from '../../common/error/BaseError';

export default class MqttResponseError extends BaseError {
  constructor(message: string, info?: object) {
    super(message, { info });
  }
}
