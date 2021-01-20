import DomainEvents from '../model/DomainEvents';

describe('DomainEvents', () => {
  describe('#domainEvents', () => {
    it('cannot be modified directly', () => {
      const model = new DomainEvents();
      const fakeEvent = { payload: {} };
      model.raiseEvent(fakeEvent);

      const modifiedDomainEvents = model.value;
      const anotherEvent = { payload: {} };
      modifiedDomainEvents.push(anotherEvent);
      const { value } = model;

      expect(value).toHaveLength(1);
      expect(value).toEqual(expect.arrayContaining([fakeEvent]));
    });
  });

  describe('#raiseEvent()', () => {
    it('store domain event', () => {
      const model = new DomainEvents();
      const fakeEvent = { payload: {} };
      model.raiseEvent(fakeEvent);

      expect(model.value).toEqual(expect.arrayContaining([fakeEvent]));
    });
  });

  describe('#toJSON()', () => {
    it('be correctly stringified', () => {
      const model = new DomainEvents();

      const stringifyModel = JSON.stringify(model);

      expect(stringifyModel).toEqual(expect.not.stringContaining('_domainEvents'));
    });
  });
});
