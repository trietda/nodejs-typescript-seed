import { EventEmitter } from 'events';
import { ConsumeMessage, MessageProperties, Options } from 'amqplib';
import RabbitMQRoute from '../RabbitMQRoute';

export default jest.fn().mockImplementation(() => {
  const eventEmitter = new EventEmitter();

  return {
    channel: {
      assertQueue: jest.fn(),
      ack: jest.fn(),
    },
    connect: jest.fn().mockImplementation(undefined),
    publish: jest.fn().mockImplementation(
      async (
        route: RabbitMQRoute,
        payload: object,
        options?: Options.Publish,
      ) => {
        const consumeMessage: ConsumeMessage = {
          content: Buffer.from(JSON.stringify(payload)),
          properties: {
            replyTo: options?.replyTo,
            correlationId: options?.correlationId,
          } as MessageProperties,
        } as ConsumeMessage;

        if (route.queue) {
          eventEmitter.emit(route.queue, payload, consumeMessage);
        } else {
          eventEmitter.emit(route.route, payload, consumeMessage);
        }
      },
    ),
    consume: jest.fn().mockImplementation(async (
      route: RabbitMQRoute,
      handler: (payload: object, message: ConsumeMessage) => Promise<void>,
    ) => {
      if (route.queue) {
        eventEmitter.on(route.queue, handler);
      } else {
        eventEmitter.on(route.route, handler);
      }
    }),
  };
});
