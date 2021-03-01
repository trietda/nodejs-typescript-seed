import { Message, V3Message } from '../mqtt';
import { MqttResponseError } from '../error';

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
}
