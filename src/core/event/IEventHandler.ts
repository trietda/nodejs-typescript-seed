import { EntityManager } from 'typeorm';
import IDomainEvent from './IDomainEvent';

export default interface IEventHandler<T extends IDomainEvent> {
  handle(event: T, entityManager: EntityManager): void
}
