import { SINGLETON_KEY, SingletonClass } from '../../common';
import { IntegrationEventManager } from '../index';
import IntegrationEvent from '../IntegrationEvent';

describe('IntegrationEventManager', () => {
  beforeEach(() => {
    // eslint-disable-next-line max-len
    delete (IntegrationEventManager as SingletonClass<typeof IntegrationEventManager>)[SINGLETON_KEY];
    jest.clearAllMocks();
  });

  describe('#publish()', () => {
    it('delegate to event strategy', async () => {
      const fakeStrategy = {
        publish: jest.fn(),
        subscribe: jest.fn(),
      };
      const eventManager = new IntegrationEventManager(fakeStrategy);
      const event = new IntegrationEvent('user', 'user', 'created');
      const payload = {};

      await eventManager.publish(event, payload);

      expect(fakeStrategy.publish).toHaveBeenCalledWith(event, payload);
    });
  });

  describe('#subscribe()', () => {
    it('delete to event strategy', async () => {
      const fakeStrategy = {
        publish: jest.fn(),
        subscribe: jest.fn(),
      };
      const eventManager = new IntegrationEventManager(fakeStrategy);
      const event = new IntegrationEvent('user', 'user', 'created');
      const handler = { handle: jest.fn() };

      await eventManager.subscribe(event, handler);

      expect(fakeStrategy.subscribe).toHaveBeenCalledWith(event, handler);
    });
  });
});
