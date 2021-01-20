import { Singleton } from '../../common';
import IntegrationEvent from '../IntegrationEvent';
import IIntegrationEventHandler from './IIntegrationEventHandler';
import IIntegrationEventStrategy from './IIntegrationEventStrategy';

@Singleton
export default class IntegrationEventManager {
  private strategy: IIntegrationEventStrategy;

  setStrategy(strategy: IIntegrationEventStrategy): void {
    this.strategy = strategy;
  }

  constructor(strategy: IIntegrationEventStrategy) {
    this.strategy = strategy;
  }

  async publish(event: IntegrationEvent, payload: object): Promise<void> {
    await this.strategy.publish(event, payload);
  }

  async subscribe(event: IntegrationEvent, handler: IIntegrationEventHandler): Promise<void> {
    await this.strategy.subscribe(event, handler);
  }
}
