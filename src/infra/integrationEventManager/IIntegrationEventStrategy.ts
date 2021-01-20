import IIntegrationEventHandler from './IIntegrationEventHandler';
import IntegrationEvent from '../IntegrationEvent';

export default interface IIntegrationEventStrategy {
  publish(event: IntegrationEvent, payload: object): Promise<void>;

  subscribe(event: IntegrationEvent, handler: IIntegrationEventHandler): Promise<void>;
}
