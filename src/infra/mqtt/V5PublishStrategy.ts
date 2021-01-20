import { IClientPublishOptions } from 'async-mqtt';
import stringify from 'fast-safe-stringify';
import PublishStrategy from './PublishStrategy';
import { Message, PublishOptions } from './type';

export default class V5PublishStrategy extends PublishStrategy {
  async publish(topic: string, message: Message, options?: PublishOptions): Promise<void> {
    const clientPublishOptions: IClientPublishOptions = {
      properties: {},
    };

    if (options?.responseTopic) {
      clientPublishOptions.properties = {
        ...clientPublishOptions.properties,
        responseTopic: options?.responseTopic,
      };
    }

    if (options?.correlationId) {
      clientPublishOptions.properties = {
        ...clientPublishOptions.properties,
        correlationData: Buffer.from(options.correlationId),
      };
    }

    await this.asyncMqttClient.publish(topic, stringify(message), clientPublishOptions);
  }
}
