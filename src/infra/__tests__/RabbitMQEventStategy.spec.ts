import { delay } from 'bluebird';
import { IIntegrationEventHandler, RabbitMQEventStrategy } from '../integrationEventManager';
import { RabbitMQ, RabbitMQRoute } from '../rabbitMQ';
import IntegrationEvent from '../IntegrationEvent';

jest.mock('../rabbitMQ/RabbitMQ');

describe('RabbitMQEventStrategy', () => {
  describe('#publish()', () => {
    it('publish to correct exchange and routing key', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();

      const strategy = new RabbitMQEventStrategy(rabbitMQ);
      const event = new IntegrationEvent('test', 'testCreated');
      const payload = { data: 'test' };
      const promise = strategy.publish(event, payload);

      await expect(promise).resolves.toBeUndefined();
      expect(rabbitMQ.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          exchange: 'testService',
          route: 'event.test.testCreated',
        }),
        payload,
      );
    });
  });

  describe('#subscribe()', () => {
    it('assert and consume from the correct route', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();

      const strategy = new RabbitMQEventStrategy(rabbitMQ);
      const event = new IntegrationEvent('user', 'userCreated', 'userService');
      const handler: IIntegrationEventHandler = { handle: jest.fn() };
      const promise = strategy.subscribe(event, handler);

      await expect(promise).resolves.toBeUndefined();
      expect(rabbitMQ.channel.assertQueue).toHaveBeenCalledWith('userService.event.user.userCreated.testService');
      expect(rabbitMQ.consume).toHaveBeenCalledWith(
        expect.objectContaining({
          exchange: 'userService',
          route: 'event.user.userCreated',
          queue: 'userService.event.user.userCreated.testService',
        }),
        expect.any(Function),
      );
    });

    it('call handler', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();

      const strategy = new RabbitMQEventStrategy(rabbitMQ);
      const event = new IntegrationEvent('user', 'userCreated', 'userService');
      const handler: IIntegrationEventHandler = { handle: jest.fn() };
      const promise = strategy.subscribe(event, handler);
      // Fake publish
      await delay(100);
      const eventPayload = { data: 'data' };
      await rabbitMQ.publish(
        new RabbitMQRoute(
          'userService',
          'event.user.userCreated',
          'userService.event.user.userCreated.testService',
        ),
        eventPayload,
      );

      await expect(promise).resolves.toBeUndefined();
      expect(handler.handle).toHaveBeenCalledWith(eventPayload);
    });
  });
});
