import mqtt, { AsyncMqttClient, IPublishPacket } from 'async-mqtt';
import config from 'config';
import { EventEmitter } from 'events';
import { Singleton } from '../../common';
import PublishStrategy from './PublishStrategy';
import PublishStrategyFactory from './PublishStrategyFactory';
import { Message, PublishOptions } from './type';
import { V3Message } from './V3PublishStrategy';

@Singleton
export default class Mqtt {
  private eventEmitter = new EventEmitter();

  private subscribedTopicMap: Record<string, boolean> = {};

  private client?: AsyncMqttClient;

  private publishStrategy?: PublishStrategy;

  async init() {
    const client = mqtt.connect(
      config.get('mqtt.url'),
      {
        clientId: config.get('mqtt.clientId'),
        clean: config.get<boolean>('mqtt.clean'),
      },
    );
    client.on('reconnect', () => {
      global.logger?.debug('MQTT is reconnecting');
    });
    client.on('close', () => {
      global.logger?.debug('MQTT is closed');
    });
    client.on('offline', () => {
      global.logger?.debug('MQTT is offline');
    });
    client.on('end', () => {
      global.logger?.debug('MQTT is ended');
    });
    client.on('error', (err) => {
      global.logger?.error('MQTT is offline', err);
    });
    client.on('message', (topic, messageBuffer, packet) => {
      try {
        const payload = JSON.parse(messageBuffer.toString());
        this.eventEmitter.emit(topic, payload, packet);
      } catch (err) {
        global.logger?.error(err);
      }
    });

    this.client = client;
    this.publishStrategy = PublishStrategyFactory.createStrategy(client);
  }

  async subscribe(
    topic: string,
    handler: (payload: Message | V3Message, packet: IPublishPacket) => Promise<void>,
  ) {
    if (!this.client) {
      throw new Error('client not initialized');
    }

    if (!this.subscribedTopicMap[topic]) {
      await this.client.subscribe(topic);
      this.subscribedTopicMap[topic] = true;
    }

    this.eventEmitter.on(topic, handler);
  }

  async publish(topic: string, payload: object, options?: PublishOptions) {
    if (!this.client) {
      throw new Error('client not initialized');
    }

    const message: Message = { data: payload };
    this.publishStrategy?.publish(topic, message, options);
  }
}
