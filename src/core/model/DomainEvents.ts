import { IDomainEvent } from '../event';

export default class DomainEvents {
  private readonly _value: IDomainEvent[];

  get value() {
    return [...this._value];
  }

  constructor() {
    this._value = [];
  }

  raiseEvent(event: IDomainEvent): void {
    this._value.push(event);
  }

  toJSON() {
    return this.value;
  }
}
