import { EntityManager } from 'typeorm';
import { IDomainEvent, IEventHandler } from '../core';
import { Singleton } from '../common';

@Singleton
export default class DomainEventManager {
  private readonly handlersMap: Record<string, IEventHandler<IDomainEvent>[]>;

  constructor() {
    this.handlersMap = {};
  }

  register<T extends IDomainEvent>(event: { name: string }, handler: IEventHandler<T>): void {
    const eventName = event.name;

    if (!this.handlersMap[eventName]) {
      this.handlersMap[eventName] = [handler];
    } else {
      this.handlersMap[eventName].push(handler);
    }
  }

  async dispatch<T extends IDomainEvent>(event: T, entityManager: EntityManager): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlersMap[eventName] ?? [];
    const handlePromises = handlers.map((handler) => handler.handle(event, entityManager));
    await Promise.all(handlePromises);
  }
}
