import stringify from 'fast-safe-stringify';
import PublishStrategy from './PublishStrategy';
import { PublishOptions, Message } from './type';

export type V3Message = Message & {
  responseTopic?: string;
  correlationId?: string;
};

export default class V3PublishStrategy extends PublishStrategy {
  async publish(topic: string, message: Message, options?: PublishOptions): Promise<void> {
    const v3Message: V3Message = {
      ...message,
      responseTopic: options?.responseTopic,
      correlationId: options?.correlationId,
    };
    await this.asyncMqttClient.publish(topic, stringify(v3Message));
  }
}
