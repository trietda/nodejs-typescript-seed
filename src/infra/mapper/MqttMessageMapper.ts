import { Message, V3Message } from '../mqtt';
import { MqttResponseError } from '../error';
import { ResponsePayload } from '../mqtt/type';

export default class MqttMessageMapper {
  static toMessage(json: any): Message | V3Message {
    return {
      responseTopic: json.responseTopic,
      correlationId: json.correlationId,
      payload: json.payload,
    };
  }

  static toError(json: any): MqttResponseError {
    return new MqttResponseError(json.message, json.details);
  }

  static toJson(message: Message | V3Message) {
    return {
      responseTopic: (message as V3Message).responseTopic,
      correlationId: (message as V3Message).correlationId,
      payload: {
        isSuccess: (message.payload as ResponsePayload).isSuccess,
        data: message.payload.data,
        error: (message.payload as ResponsePayload).error && {
          message: (message.payload as ResponsePayload).error?.message,
          info: (message.payload as ResponsePayload).error?.info,
        },
      },
    };
  }
}
