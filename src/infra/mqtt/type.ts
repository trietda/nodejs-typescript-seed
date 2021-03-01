import BaseError from '../../common/error/BaseError';

export type Message = {
  payload: Payload,
};

export type Payload = NormalPayload | ResponsePayload;

export type NormalPayload = {
  data: object
};

export type ResponsePayload = {
  isSuccess: boolean,
  data?: object,
  error?: BaseError,
};

export type PublishOptions = {
  responseTopic?: string;
  correlationId?: string;
};
