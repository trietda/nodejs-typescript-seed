import EventEmitter from 'events';
import { IPublishPacket } from 'async-mqtt';
import { Message, Payload, PublishOptions } from '../type';

export default jest.fn().mockImplementation(() => {
  const eventEmitter = new EventEmitter();

  return {
    init: jest.fn(),
    publish: jest.fn().mockImplementation(
      (topic: string, payload: Payload, options?: PublishOptions) => {
        const packet: Partial<IPublishPacket> = {
          properties: {
            responseTopic: options?.responseTopic,
            correlationData: options?.correlationId
              ? Buffer.from(options.correlationId)
              : undefined,
          },
        };
        const message: Message = { payload };
        eventEmitter.emit(topic, message, packet);
      },
    ),
    subscribe: jest.fn().mockImplementation((topic, handler) => {
      eventEmitter.on(topic, handler);
    }),
  };
});
