import IIntegrationEventStrategy from './IIntegrationEventStrategy';
import IntegrationEvent from '../IntegrationEvent';
import Mqtt from '../mqtt';
import IIntegrationEventHandler from './IIntegrationEventHandler';

export default class MqttEventStrategy implements IIntegrationEventStrategy {
  private mqtt: Mqtt;

  constructor(mqtt: Mqtt = new Mqtt()) {
    this.mqtt = mqtt;
  }

  async publish(event: IntegrationEvent, payload: object): Promise<void> {
    const topicName = MqttEventStrategy.getTopicName(event);
    await this.mqtt.publish(topicName, payload);
  }

  async subscribe(event: IntegrationEvent, handler: IIntegrationEventHandler): Promise<void> {
    const topicName = MqttEventStrategy.getTopicName(event);
    await this.mqtt.subscribe(topicName, async (payload) => {
      await handler.handle(payload);
    });
  }

  private static getTopicName(event: IntegrationEvent): string {
    return `${event.service}/event/${event.model}/${event.action}`;
  }
}
