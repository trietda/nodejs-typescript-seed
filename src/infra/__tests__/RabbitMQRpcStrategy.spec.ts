import { Options } from 'amqplib';
import { delay } from 'bluebird';
import { RabbitMQ, RabbitMQRoute } from '../rabbitMQ';
import { IRpcHandler, RabbitMQRpcStrategy, RpcCommand } from '../rpcManager';

jest.mock('../rabbitMQ/RabbitMQ');

describe('RabbitMQRpcStrategy', () => {
  describe('#init()', () => {
    it('consume exclusively response queue', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();
      const strategy = new RabbitMQRpcStrategy(rabbitMQ);

      await strategy.init();

      expect(rabbitMQ.channel.assertQueue).toHaveBeenCalledWith(
        'testService.response.testService1',
        { exclusive: true },
      );
      expect(rabbitMQ.consume).toHaveBeenCalledWith(
        new RabbitMQRoute(
          'testService',
          'response.testService1',
          'testService.response.testService1',
        ),
        expect.any(Function),
      );
    });
  });

  describe('#request()', () => {
    it('publish with reply to queue', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();
      const strategy = new RabbitMQRpcStrategy(rabbitMQ);
      const command = new RpcCommand('user', 'fetchUser', 'userService');
      const payload = { data: 'request' };

      await strategy.init();
      const requestPromise = strategy.request(command, payload);
      // Fake response
      await delay(100);
      const responseRoute = new RabbitMQRoute(
        'testService',
        'response.testService1',
        'testService.response.testService1',
      );
      const responsePayload = { data: 'response' };
      const publishOptions: Options.Publish = (rabbitMQ.publish as jest.Mock).mock.calls[0][2];
      await rabbitMQ.publish(responseRoute, responsePayload, publishOptions);

      await expect(requestPromise).resolves.toEqual(responsePayload);
      const publishMock = rabbitMQ.publish as jest.Mock;
      expect(publishMock).toHaveBeenNthCalledWith(
        1,
        new RabbitMQRoute(
          'userService',
          'command.user.fetchUser',
          'userService.command.user.fetchUser',
        ),
        payload,
        expect.objectContaining({
          correlationId: expect.any(String),
          replyTo: 'testService.response.testService1',
        }),
      );
    });

    it('throw timeout error', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();
      const strategy = new RabbitMQRpcStrategy(rabbitMQ);
      const command = new RpcCommand('user', 'fetchUser', 'userService');
      const payload = {};

      await strategy.init();
      const requestPromise = strategy.request(command, payload);

      await expect(requestPromise).rejects.toThrow('request timeout');
    });

    it('throw when not init', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();
      const strategy = new RabbitMQRpcStrategy(rabbitMQ);
      const command = new RpcCommand('user', 'fetchUser', 'userService');
      const payload = {};

      const requestPromise = strategy.request(command, payload);

      await expect(requestPromise).rejects.toThrow('init');
    });
  });

  describe('#response()', () => {
    it('subscribe to response queue', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();

      const strategy = new RabbitMQRpcStrategy(rabbitMQ);
      const command = new RpcCommand('test', 'fetchTest');
      const handler: IRpcHandler = {
        handle: jest.fn(),
      };
      const promise = strategy.response(command, handler);

      await expect(promise).resolves.toBeUndefined();
      expect(rabbitMQ.channel.assertQueue).toHaveBeenCalledWith(
        'testService.command.test.fetchTest',
        {
          durable: false,
          autoDelete: true,
        },
      );
      expect(rabbitMQ.consume).toHaveBeenNthCalledWith(
        1,
        new RabbitMQRoute(
          'testService',
          'command.test.fetchTest',
          'testService.command.test.fetchTest',
        ),
        expect.any(Function),
        { noAck: false },
      );
    });

    it('call handler when receive message', async () => {
      const rabbitMQ = new RabbitMQ();
      await rabbitMQ.connect();

      const strategy = new RabbitMQRpcStrategy(rabbitMQ);
      const command = new RpcCommand('test', 'fetchTest');
      const responseData = { data: 'response' };
      const handler: IRpcHandler = {
        handle: jest.fn().mockResolvedValue(responseData),
      };
      const promise = strategy.response(command, handler);
      // Fake request
      await delay(100);
      const requestRoute = new RabbitMQRoute(
        'testService',
        'command.test.fetchTest',
        'testService.command.test.fetchTest',
      );
      const requestPayload = { data: 'request' };
      await rabbitMQ.publish(requestRoute, requestPayload);

      await expect(promise).resolves.toBeUndefined();
      expect(handler.handle).toBeCalledWith(command, requestPayload);
    });
  });
});
