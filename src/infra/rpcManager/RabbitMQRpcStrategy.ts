import { ConsumeMessage, Options } from 'amqplib';
import { v4 as UuidV4 } from 'uuid';
import config from 'config';
import { EventEmitter } from 'events';
import IRpcStrategy from './IRpcStrategy';
import RpcCommand from './RpcCommand';
import { RabbitMQ, RabbitMQRoute } from '../rabbitMQ';
import IRpcHandler from './IRpcHandler';

export type RabbitMQRpcConfig = {
  timeout: number
};

export default class RabbitMQRpcStrategy implements IRpcStrategy {
  private hasInit = false;

  private readonly eventEmitter;

  private readonly config: RabbitMQRpcConfig;

  static readonly responseRabbitMQRoute = new RabbitMQRoute(
    config.get('service.name'),
    `response.${config.get('service.id')}`,
    `${config.get('service.name')}.response.${config.get('service.id')}`,
  );

  private readonly rabbitMQ: RabbitMQ;

  constructor(rabbitMQ = new RabbitMQ()) {
    this.eventEmitter = new EventEmitter();
    this.config = {
      timeout: config.get<number>('rabbitMQ.rpcTimeout'),
    };
    this.rabbitMQ = rabbitMQ;
  }

  async init() {
    await this.rabbitMQ.channel.assertQueue(
      RabbitMQRpcStrategy.responseRabbitMQRoute.queue,
      { exclusive: true },
    );

    const emitInternalEvent = async (payload: object, message: ConsumeMessage) => {
      this.eventEmitter.emit(message.properties.correlationId, payload);
    };
    await this.rabbitMQ.consume(RabbitMQRpcStrategy.responseRabbitMQRoute, emitInternalEvent);

    this.hasInit = true;
  }

  async request(command: RpcCommand, payload: object): Promise<object | undefined> {
    if (!this.hasInit) {
      throw new Error('has not been init');
    }

    const correlationId = UuidV4();

    const promise = new Promise<object | undefined>((resolve, reject) => {
      const rejectTimeout = setTimeout(
        () => {
          reject(new Error('request timeout'));
        },
        config.get<number>('rabbitMQ.rpcTimeout'),
      );

      this.eventEmitter.on(correlationId, (response: object) => {
        clearTimeout(rejectTimeout);
        resolve(response);
      });
    });

    const publishRoute = RabbitMQRpcStrategy.getRabbitMQRoute(command);
    const options: Options.Publish = {
      correlationId,
      replyTo: RabbitMQRpcStrategy.responseRabbitMQRoute.queue,
    };
    await this.rabbitMQ.publish(publishRoute, payload, options);

    return promise;
  }

  async response(command: RpcCommand, handler: IRpcHandler): Promise<void> {
    const route = RabbitMQRpcStrategy.getRabbitMQRoute(command);

    await this.rabbitMQ.channel.assertQueue(route.queue, {
      durable: false,
      autoDelete: true,
    });

    const handleRequest = async (payload: object, message: ConsumeMessage) => {
      const response = await handler.handle(command, payload);
      const responseRoute = new RabbitMQRoute(config.get('service.name'), message.properties.replyTo);
      await this.rabbitMQ.publish(responseRoute, response);
      await this.rabbitMQ.channel.ack(message);
    };
    await this.rabbitMQ.consume(route, handleRequest, { noAck: false });
  }

  private static getRabbitMQRoute(command: RpcCommand): RabbitMQRoute {
    return new RabbitMQRoute(
      command.service,
      `command.${command.resource}.${command.name}`,
      `${command.service}.command.${command.resource}.${command.name}`,
    );
  }
}
