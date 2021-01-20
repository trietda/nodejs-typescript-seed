import { EventEmitter } from 'events';
import config from 'config';
import { IPublishPacket } from 'async-mqtt';
import { v4 as UuidV4 } from 'uuid';
import IRpcStrategy from './IRpcStrategy';
import { Message, Mqtt } from '../mqtt';
import RpcCommand from './RpcCommand';
import IRpcHandler from './IRpcHandler';
import { V3Message } from '../mqtt/V3PublishStrategy';

export type MqttRequestResolver = (payload: object) => void;

export default class MqttRpcStrategy implements IRpcStrategy {
  private readonly responseTopicName: string;

  private readonly eventEmitter: EventEmitter;

  private readonly mqtt: Mqtt;

  constructor(mqtt: Mqtt = new Mqtt()) {
    this.mqtt = mqtt;
    this.responseTopicName = `${config.get('service.name')}/response/${config.get('service.id')}`;
    this.eventEmitter = new EventEmitter();
  }

  async init() {
    const handleResponse = async (payload: Message | V3Message, packet: IPublishPacket) => {
      const correlationId = MqttRpcStrategy.getCorrelationId(payload, packet);

      if (!correlationId) {
        global.logger?.warn('No correlation ID', payload);
        return;
      }

      this.eventEmitter.emit(correlationId, payload.data, packet);
    };
    await this.mqtt.subscribe(this.responseTopicName, handleResponse);
  }

  async request(command: RpcCommand, payload: object): Promise<object | undefined> {
    const correlationId = MqttRpcStrategy.generateCorrelationId();

    const promise = new Promise((resolve: MqttRequestResolver, reject) => {
      const rejectTimeout = setTimeout(
        () => {
          reject(new Error('request timeout'));
        },
        config.get<number>('mqtt.rpcTimeout'),
      );

      this.eventEmitter.once(correlationId, (responsePayload: object) => {
        clearTimeout(rejectTimeout);
        resolve(responsePayload);
      });
    });

    const publishTopic = MqttRpcStrategy.getPublishTopic(command);
    const message: Message = { data: payload };
    await this.mqtt.publish(publishTopic, message, {
      correlationId,
      responseTopic: this.responseTopicName,
    });

    return promise;
  }

  async response(command: RpcCommand, handle: IRpcHandler): Promise<void> {
    const subscribeTopic = MqttRpcStrategy.getSubscribeTopic(command);
    await this.mqtt.subscribe(subscribeTopic, async (message, packet) => {
      try {
        const responseTopic = MqttRpcStrategy.getResponseTopic(message, packet);

        if (!responseTopic) {
          global.logger?.warn('No response topic', message);
          return;
        }

        const correlationId = MqttRpcStrategy.getCorrelationId(message, packet);

        if (!correlationId) {
          global.logger?.warn('No correlation ID', message);
          return;
        }
        const responseMessagePayload = await handle.handle(command, message.data);
        const responseMessage: Message = { data: responseMessagePayload };
        await this.mqtt.publish(responseTopic, responseMessage);
      } catch (err) {
        global.logger?.error(err);
      }
    });
  }

  static generateCorrelationId(): string {
    return UuidV4();
  }

  private static getPublishTopic(command: RpcCommand): string {
    return `${command.service}/command/${command.resource}/${command.name}`;
  }

  private static getSubscribeTopic(command: RpcCommand): string {
    return `${config.get('service.name')}/command/${command.resource}/${command.name}`;
  }

  private static getResponseTopic(
    payload: Message | V3Message,
    packet: IPublishPacket,
  ): string | undefined {
    return packet.properties?.responseTopic || (payload as V3Message).responseTopic;
  }

  private static getCorrelationId(
    payload: Message | V3Message,
    packet: IPublishPacket,
  ): string | undefined {
    return packet.properties?.correlationData?.toString() || (payload as V3Message).correlationId;
  }
}
