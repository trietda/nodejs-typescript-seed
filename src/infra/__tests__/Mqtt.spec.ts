import Mqtt from 'async-mqtt';
import { SINGLETON_KEY, SingletonClass } from '../../common';
import { MqttMessageMapper } from '../mapper';
import { Mqtt as CustomMqtt } from '../mqtt';
import PublishStrategyFactory from '../mqtt/PublishStrategyFactory';

jest.mock('async-mqtt');
jest.mock('../mapper/MqttMessageMapper');
jest.mock('../mqtt/PublishStrategyFactory');

const MockedMqtt = Mqtt as unknown as jest.Mocked<typeof Mqtt>;
const MockedMqttMessageMapper = MqttMessageMapper as jest.MockedClass<typeof MqttMessageMapper>;
// eslint-disable-next-line max-len
const MockedPublishStrategyFactory = PublishStrategyFactory as jest.MockedClass<typeof PublishStrategyFactory>;

describe('Mqtt', () => {
  beforeEach(() => {
    // eslint-disable-next-line max-len
    delete (CustomMqtt as SingletonClass<typeof CustomMqtt>)[SINGLETON_KEY];
  });

  describe('#init()', () => {
    it('handle "message" event', async () => {
      const mqtt = new CustomMqtt();

      await mqtt.init();
      const mqttClient = MockedMqtt.connect.mock.results[0].value;

      expect(mqttClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('parse raw message', async () => {
      const mqtt = new CustomMqtt();

      await mqtt.init();
      const mqttClient = MockedMqtt.connect.mock.results[0].value;
      const topicName = 'topicName';
      const message = { foo: 'bar' };
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const packet = {};
      mqttClient.__emitEvent('message', topicName, messageBuffer, packet);

      expect(MockedMqttMessageMapper.toMessage).toHaveBeenCalledWith(message);
    });

    it('init publish strategy', async () => {
      const mqtt = new CustomMqtt();

      await mqtt.init();

      const mqttClient = MockedMqtt.connect.mock.results[0].value;
      expect(MockedPublishStrategyFactory.createStrategy).toHaveBeenCalledWith(mqttClient);
    });
  });

  describe('#subscribe()', () => {
    it('throw when mqtt has not been init', async () => {
      const mqtt = new CustomMqtt();

      const promise = mqtt.subscribe('topicName', async () => {
      });

      await expect(promise).rejects.toThrow('init');
    });

    it('subscribe to mqtt topic when has NOT been subscribe before', async () => {
      const mqtt = new CustomMqtt();
      await mqtt.init();

      const topicName = 'topicName';
      const promise = mqtt.subscribe(topicName, async () => {
      });

      await expect(promise).resolves.toBeUndefined();
      const mqttClient = MockedMqtt.connect.mock.results[0].value;
      expect(mqttClient.subscribe).toHaveBeenCalledWith(topicName);
    });

    it('NOT subscribe to mqtt topic when has been subscribe before', async () => {
      const mqtt = new CustomMqtt();
      await mqtt.init();

      const topicName = 'topicName';
      await mqtt.subscribe(topicName, async () => {
      });
      const promise = mqtt.subscribe(topicName, async () => {
      });

      await expect(promise).resolves.toBeUndefined();
      const mqttClient = MockedMqtt.connect.mock.results[0].value;
      expect(mqttClient.subscribe).toHaveBeenCalledTimes(1);
    });

    it('handle multiple handlers on 1 topic', async () => {
      const mqtt = new CustomMqtt();
      await mqtt.init();
      const mqttClient = MockedMqtt.connect.mock.results[0].value;

      const topicName = 'topicName';
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      await mqtt.subscribe(topicName, handler1);
      await mqtt.subscribe(topicName, handler2);
      const message = { foo: 'bar' };
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const packet = { data: 'fakePacket' };
      mqttClient.__emitEvent('message', topicName, messageBuffer, packet);

      const parsedMessage = (MockedMqttMessageMapper.toMessage as jest.Mock).mock.results[0].value;
      expect(handler1).toHaveBeenCalledWith(parsedMessage, packet);
      expect(handler2).toHaveBeenCalledWith(parsedMessage, packet);
    });
  });

  describe('#publish()', () => {
    it('throw when mqtt has not been init', async () => {
      const mqtt = new CustomMqtt();

      const promise = mqtt.publish('topicName', { data: {} });

      await expect(promise).rejects.toThrow('init');
    });

    it('delegate to mqtt publish strategy', async () => {
      const mqtt = new CustomMqtt();
      await mqtt.init();

      const topicName = 'topicName';
      const messagePayload = { data: {} };
      const publishOptions = { responseTopic: 'responseTopic' };
      const promise = mqtt.publish(topicName, messagePayload, publishOptions);

      await expect(promise).resolves.toBeUndefined();
      // eslint-disable-next-line max-len
      const publishStrategy = (MockedPublishStrategyFactory.createStrategy as jest.Mock).mock.results[0].value;
      const message = { payload: messagePayload };
      expect(publishStrategy.publish).toHaveBeenCalledWith(topicName, message, publishOptions);
    });
  });
});
