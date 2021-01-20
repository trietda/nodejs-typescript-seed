import { AsyncMqttClient } from 'async-mqtt';
import config from 'config';
import V5PublishStrategy from './V5PublishStrategy';
import V3PublishStrategy from './V3PublishStrategy';
import PublishStrategy from './PublishStrategy';

export default class PublishStrategyFactory {
  static createStrategy(asyncMqttClient: AsyncMqttClient): PublishStrategy {
    switch (config.get('mqtt.protocolVersion')) {
      case 5: {
        return new V5PublishStrategy(asyncMqttClient);
      }
      default: {
        return new V3PublishStrategy(asyncMqttClient);
      }
    }
  }
}
