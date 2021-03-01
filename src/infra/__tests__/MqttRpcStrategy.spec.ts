import { delay } from 'bluebird';
import { Mqtt, PublishOptions } from '../mqtt';
import { IRpcHandler, MqttRpcStrategy, RpcCommand } from '../rpcManager';
import { NormalPayload, ResponsePayload } from '../mqtt/type';
import { MqttResponseError } from '../error';

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
    it('publish to correct topic along with reply to topic and correctly parse response', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const strategy = new MqttRpcStrategy(mqtt);
      await strategy.init();
      const correlationId = 'fakeCorrelationId';
      const generateCorrelationIdMock = jest.spyOn(MqttRpcStrategy, 'generateCorrelationId');
      const responsePayloadData = { responseFoo: 'responseBar' };
      const setupFakeCorrelationId = () => {
        generateCorrelationIdMock.mockReturnValue(correlationId);
      };
      const fakeResponse = async () => {
        await delay(100);
        const responseTopic = 'testService/response/testService1';
        const responsePayload: ResponsePayload = {
          isSuccess: true,
          data: responsePayloadData,
        };
        const publishOptions: PublishOptions = { correlationId };
        await mqtt.publish(responseTopic, responsePayload, publishOptions);
      };

      setupFakeCorrelationId();
      const requestCommand = new RpcCommand('user', 'fetchUser', 'userService');
      const requestPayloadData = { foo: 'bar' };
      const promise = strategy.request(requestCommand, requestPayloadData);
      await fakeResponse();

      await expect(promise).resolves.toEqual(responsePayloadData);
      expect(mqtt.publish).toHaveBeenNthCalledWith(
        1,
        'userService/command/user/fetchUser',
        { data: requestPayloadData },
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
      const requestPayload = { foo: 'bar' };
      const promise = strategy.request(requestCommand, requestPayload);

      await expect(promise).rejects.toThrow('timeout');
    });

    it.only('throw with error from response', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const strategy = new MqttRpcStrategy(mqtt);
      await strategy.init();
      const correlationId = 'fakeCorrelationId';
      const generateCorrelationIdMock = jest.spyOn(MqttRpcStrategy, 'generateCorrelationId');
      const responsePayloadError = new MqttResponseError('response error', { foo: 'bar' });
      const setupFakeCorrelationId = () => {
        generateCorrelationIdMock.mockReturnValue(correlationId);
      };
      const fakeResponse = async () => {
        await delay(100);
        const responseTopic = 'testService/response/testService1';
        const responsePayload: ResponsePayload = {
          isSuccess: false,
          error: responsePayloadError,
        };
        const publishOptions: PublishOptions = { correlationId };
        await mqtt.publish(responseTopic, responsePayload, publishOptions);
      };

      setupFakeCorrelationId();
      const requestCommand = new RpcCommand('user', 'fetchUser', 'userService');
      const requestPayloadData = { foo: 'bar' };
      const promise = strategy.request(requestCommand, requestPayloadData);
      await fakeResponse();

      await expect(promise).rejects.toEqual(responsePayloadError);

      generateCorrelationIdMock.mockRestore();
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

    it('handle request and publish to response topic', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const strategy = new MqttRpcStrategy(mqtt);
      const responseTopic = 'otherService/response/otherService1';
      const correlationId = 'fakeCorrelationId';
      const requestPayloadData = { foo: 'bar' };
      const generateCorrelationIdMock = jest.spyOn(MqttRpcStrategy, 'generateCorrelationId');
      const setupFakeCorrelationId = () => {
        generateCorrelationIdMock.mockReturnValue(correlationId);
      };
      const fakeRequest = async () => {
        await delay(100);
        const requestPayload: NormalPayload = {
          data: requestPayloadData,
        };
        const subscribedTopic = 'testService/command/test/fetchTest';
        await mqtt.publish(subscribedTopic, requestPayload, {
          responseTopic,
          correlationId,
        });
      };

      setupFakeCorrelationId();
      const command = new RpcCommand('test', 'fetchTest');
      const responseData = { responseFoo: 'responseBar' };
      const handler: IRpcHandler = {
        handle: jest.fn().mockResolvedValue(responseData),
      };
      const promise = strategy.response(command, handler);
      await fakeRequest();

      await expect(promise).resolves.toBeUndefined();
      expect(handler.handle).toHaveBeenCalledWith(command, requestPayloadData);
      expect(mqtt.publish).toHaveBeenNthCalledWith(
        2,
        responseTopic,
        {
          isSuccess: true,
          data: responseData,
        },
      );

      generateCorrelationIdMock.mockRestore();
    });

    it('publish error response when there is handling error', async () => {
      const mqtt = new Mqtt();
      await mqtt.init();
      const strategy = new MqttRpcStrategy(mqtt);
      const responseTopic = 'otherService/response/otherService1';
      const correlationId = 'fakeCorrelationId';
      const requestPayloadData = { foo: 'bar' };
      const generateCorrelationIdMock = jest.spyOn(MqttRpcStrategy, 'generateCorrelationId');
      const setupFakeCorrelationId = () => {
        generateCorrelationIdMock.mockReturnValue(correlationId);
      };
      const fakeRequest = async () => {
        await delay(100);
        const requestPayload: NormalPayload = {
          data: requestPayloadData,
        };
        const subscribedTopic = 'testService/command/test/fetchTest';
        await mqtt.publish(subscribedTopic, requestPayload, {
          responseTopic,
          correlationId,
        });
      };

      setupFakeCorrelationId();
      const command = new RpcCommand('test', 'fetchTest');
      const responseError = new Error('fake error');
      const handler: IRpcHandler = {
        handle: jest.fn().mockRejectedValue(responseError),
      };
      const promise = strategy.response(command, handler);
      await fakeRequest();

      await expect(promise).resolves.toBeUndefined();
      expect(mqtt.publish).toHaveBeenNthCalledWith(
        2,
        responseTopic,
        {
          isSuccess: false,
          error: responseError,
        },
      );

      generateCorrelationIdMock.mockRestore();
    });
  });
});
