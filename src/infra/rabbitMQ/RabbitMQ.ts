import amqp, {
  Connection, Channel, ConsumeMessage, Options,
} from 'amqplib';
import config from 'config';
import stringify from 'fast-safe-stringify';
import { Singleton } from '../../common';
import RabbitMqRoute from './RabbitMQRoute';

const defaultConsumeOptions: Options.Consume = { noAck: true };

@Singleton
export default class RabbitMQ {
  private connection!: Connection;

  private _channel!: Channel;

  private readonly exchangeMap: Record<string, boolean> = {};

  get channel(): Channel {
    return this._channel;
  }

  async connect() {
    const connection = await amqp.connect(config.get<string>('rabbitMQ.url'));
    const channel = await connection.createChannel();

    this.connection = connection;
    this._channel = channel;
  }

  async publish(
    route: RabbitMqRoute,
    payload: object,
    options?: Options.Publish,
  ): Promise<void> {
    await this.assertExchange(route.exchange);
    const payloadBuffer = Buffer.from(stringify(payload));
    await this.channel.publish(route.exchange, route.route, payloadBuffer, options);
  }

  async consume(
    route: RabbitMqRoute,
    handler: (payload: object, message: ConsumeMessage) => Promise<void>,
    options: Options.Consume = defaultConsumeOptions,
  ): Promise<void> {
    await this.assertExchange(route.exchange);
    await this.channel.bindQueue(route.queue, route.exchange, route.route);
    await this.channel.consume(
      route.queue,
      async (message) => {
        if (!message) {
          // Message canceled by RabbitMQ
          return;
        }

        try {
          const payload = JSON.parse(message.content.toString());
          await handler(payload, message);
        } catch (err) {
          global.logger?.error(err);
        }
      },
      options,
    );
  }

  private async assertExchange(exchange: string): Promise<void> {
    if (!this.isExchangeExists(exchange)) {
      await this.channel.assertExchange(exchange, 'topic');
      this.markExchangeExists(exchange);
    }
  }

  private isExchangeExists(exchange: string): boolean {
    return this.exchangeMap[exchange];
  }

  private markExchangeExists(exchange: string): void {
    this.exchangeMap[exchange] = true;
  }
}
