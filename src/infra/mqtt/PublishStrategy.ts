import { AsyncMqttClient } from 'async-mqtt';
import { Message, PublishOptions } from './type';

export default abstract class PublishStrategy {
  protected readonly asyncMqttClient: AsyncMqttClient;

  constructor(asyncMqttClient: AsyncMqttClient) {
    this.asyncMqttClient = asyncMqttClient;
  }

  abstract publish(topic: string, message: Message, options?: PublishOptions): Promise<void>;
}
