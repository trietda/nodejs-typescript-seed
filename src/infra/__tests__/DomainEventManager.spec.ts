import { EntityManager } from 'typeorm';
import { IDomainEvent, IEventHandler } from '../../core';
import DomainEventManager from '../DomainEventManager';

class TestDomainEvent implements IDomainEvent {
  constructor(public payload = {}) {
  }
}

class TestEventHandler implements IEventHandler<TestDomainEvent> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  handle(event: TestDomainEvent, entityManager: EntityManager): void {
  }
}

describe('DomainEventManager', () => {
  describe('#register()', () => {
    it('register an event handle with an event', () => {
      const domainEventManager = new DomainEventManager();
      const handler = new TestEventHandler();

      domainEventManager.register(TestDomainEvent, handler);
    });
  });

  describe('#dispatch()', () => {
    it('dispatch event', async () => {
      const domainEventManager = new DomainEventManager();
      const event = new TestDomainEvent();
      const entityManager = {} as EntityManager;

      await domainEventManager.dispatch(event, entityManager);
    });
  });

  it('dispatch event to registered event handlers', async () => {
    const domainEventManager = new DomainEventManager();
    const event = new TestDomainEvent();
    const entityManager = {} as EntityManager;
    // Setup handler
    const handler = new TestEventHandler();
    const handleSpy = jest.spyOn(handler, 'handle');

    domainEventManager.register(TestDomainEvent, handler);
    await domainEventManager.dispatch(event, entityManager);

    expect(handleSpy).toBeCalledTimes(1);
    expect(handleSpy).toBeCalledWith(event, entityManager);
  });
});
