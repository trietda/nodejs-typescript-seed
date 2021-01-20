import config from 'config';
import { ConsumeMessage } from 'amqplib';
import { RabbitMQ, RabbitMQRoute } from '../rabbitMQ';
import IntegrationEvent from '../IntegrationEvent';
import IIntegrationEventStrategy from './IIntegrationEventStrategy';
import IIntegrationEventHandler from './IIntegrationEventHandler';

export default class RabbitMQEventStrategy implements IIntegrationEventStrategy {
  private rabbitMQ: RabbitMQ;

  constructor(rabbitMQ: RabbitMQ = new RabbitMQ()) {
    this.rabbitMQ = rabbitMQ;
  }

  async publish(event: IntegrationEvent, payload: object): Promise<void> {
    const route = RabbitMQEventStrategy.getRabbitMqRoute(event);
    await this.rabbitMQ.publish(route, payload);
  }

  async subscribe(event: IntegrationEvent, handler: IIntegrationEventHandler): Promise<void> {
    const route = RabbitMQEventStrategy.getRabbitMqRoute(event);

    await this.rabbitMQ.channel.assertQueue(route.queue);

    const handleEventPayload = async (payload: object, message: ConsumeMessage) => {
      try {
        await handler.handle(payload);
        await this.rabbitMQ.channel.ack(message);
      } catch (err) {
        await this.rabbitMQ.channel.nack(message, false, false);
      }
    };
    await this.rabbitMQ.consume(route, handleEventPayload);
  }

  private static getRabbitMqRoute(event: IntegrationEvent): RabbitMQRoute {
    return new RabbitMQRoute(
      event.service,
      `event.${event.model}.${event.action}`,
      `${event.service}.event.${event.model}.${event.action}.${config.get('service.name')}`,
    );
  }
}
