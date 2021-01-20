import { delay } from 'bluebird';
import { Mqtt, PublishOptions } from '../mqtt';
import { IRpcHandler, MqttRpcStrategy, RpcCommand } from '../rpcManager';

jest.mock('../mqtt/Mqtt');

describe('MqttRpcStrategy', () => {
  describe('#init()', () => {
    it('subscribe to response queue', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();

      const strategy = new MqttRpcStrategy(mqtt);
      const promise = strategy.init();

      await expect(promise).resolves.toBeUndefined();
      expect(mqtt.subscribe).toHaveBeenCalledWith(
        'testService/response/testService1',
        expect.any(Function),
      );
    });
  });

  describe('#request()', () => {
    it('publish to correct topic and has reply to', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const generateCorrelationIdMock = jest
        .spyOn(MqttRpcStrategy, 'generateCorrelationId')
        .mockReturnValue('fakeCorrelationId');
      const strategy = new MqttRpcStrategy(mqtt);
      await strategy.init();

      const requestCommand = new RpcCommand('user', 'fetchUser', 'userService');
      const requestPayload = { data: 'request' };
      const promise = strategy.request(requestCommand, requestPayload);
      // Fake response
      await delay(100);
      const responseTopic = 'testService/response/testService1';
      const responsePayload = { data: 'response' };
      const publishOptions: PublishOptions = { correlationId: 'fakeCorrelationId' };
      await mqtt.publish(responseTopic, responsePayload, publishOptions);

      await expect(promise).resolves.toEqual(responsePayload);
      expect(mqtt.publish).toHaveBeenNthCalledWith(
        1,
        'userService/command/user/fetchUser',
        { data: requestPayload },
        {
          correlationId: 'fakeCorrelationId',
          responseTopic: 'testService/response/testService1',
        },
      );

      generateCorrelationIdMock.mockRestore();
    });

    it('throw when exceed time', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const strategy = new MqttRpcStrategy(mqtt);
      await strategy.init();

      const requestCommand = new RpcCommand('user', 'fetchUser', 'userService');
      const requestPayload = { data: 'request' };
      const promise = strategy.request(requestCommand, requestPayload);

      await expect(promise).rejects.toThrow('timeout');
    });
  });

  describe('#response()', () => {
    it('subscribe to correct topic', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();

      const strategy = new MqttRpcStrategy(mqtt);
      const command = new RpcCommand('test', 'fetchTest');
      const handler: IRpcHandler = { handle: jest.fn() };
      const promise = strategy.response(command, handler);

      await expect(promise).resolves.toBeUndefined();
      expect(mqtt.subscribe).toHaveBeenCalledWith(
        'testService/command/test/fetchTest',
        expect.any(Function),
      );
    });

    it('handle request', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();

      const strategy = new MqttRpcStrategy(mqtt);
      jest
        .spyOn(MqttRpcStrategy, 'generateCorrelationId')
        .mockReturnValue('fakeCorrelationId');
      const command = new RpcCommand('test', 'fetchTest');
      const handler: IRpcHandler = { handle: jest.fn() };
      const promise = strategy.response(command, handler);
      // Fake request
      await delay(100);
      const subscribedTopic = 'testService/command/test/fetchTest';
      const requestPayload = { data: 'request' };
      await mqtt.publish(subscribedTopic, requestPayload, {
        responseTopic: 'otherService/response/otherService1',
        correlationId: 'fakeCorrelationId',
      });

      await expect(promise).resolves.toBeUndefined();
      expect(handler.handle).toHaveBeenCalledWith(command, requestPayload);
    });

    it.only('throw error when there is error in handling', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();

      const strategy = new MqttRpcStrategy(mqtt);
      jest
        .spyOn(MqttRpcStrategy, 'generateCorrelationId')
        .mockReturnValue('fakeCorrelationId');
      const command = new RpcCommand('test', 'fetchTest');
      const handler: IRpcHandler = {
        handle: jest.fn().mockRejectedValue(new Error('test error')),
      };
      const promise = strategy.response(command, handler);

      await expect(promise).rejects.toThrow('test error');
    });
  });
});
