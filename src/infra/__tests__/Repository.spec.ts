import { EntityManager } from 'typeorm';
import { IDomainEvent, DomainEvents } from '../../core';
import DomainEventManager from '../DomainEventManager';
import Repository from '../repository/Repository';

class TestModelEvent implements IDomainEvent {
  constructor(public payload = {}) {
  }
}

describe('Repository', () => {
  describe('#dispatchDomainEvents()', () => {
    it('dispatch domain events', async () => {
      // Setup model
      const events = new DomainEvents();
      const domainEvent = new TestModelEvent();
      events.raiseEvent(domainEvent);
      // Mock domain events
      const domainEvents = new DomainEventManager();
      const dispatchSpy = jest.spyOn(domainEvents, 'dispatch');
      dispatchSpy.mockResolvedValue(undefined);
      // Setup repository
      const entityManager = {} as EntityManager;
      const repository = new Repository(entityManager);

      await repository.dispatchDomainEvents(events);

      expect(dispatchSpy).toBeCalledTimes(1);
      expect(dispatchSpy).toBeCalledWith(domainEvent, entityManager);
    });
  });
});
