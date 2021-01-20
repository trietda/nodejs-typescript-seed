import { EntityManager } from 'typeorm';
import DomainEventManager from '../DomainEventManager';
import { DomainEvents } from '../../core';

export default class Repository {
  protected readonly entityManager: EntityManager;

  protected readonly domainEvents: DomainEventManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.domainEvents = new DomainEventManager();
  }

  async dispatchDomainEvents(domainEvents: DomainEvents): Promise<void> {
    const dispatchPromises = domainEvents.value.map(
      (domainEvent) => this.domainEvents.dispatch(domainEvent, this.entityManager),
    );
    await Promise.all(dispatchPromises);
  }
}
