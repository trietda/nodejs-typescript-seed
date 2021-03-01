import { EventEmitter } from 'events';

const asyncMqtt = jest.requireActual('async-mqtt');

asyncMqtt.connect = jest.fn().mockImplementation(() => {
  const eventEmitter = new EventEmitter();

  return {
    on: jest.fn().mockImplementation((eventName: string, handler: () => void) => {
      eventEmitter.on(eventName, handler);
    }),
    subscribe: jest.fn(),
    __emitEvent(eventName: string, ...params: any[]) {
      eventEmitter.emit(eventName, ...params);
    },
  };
});

export default asyncMqtt;
