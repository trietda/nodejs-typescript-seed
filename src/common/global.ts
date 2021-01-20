import { Logger } from 'winston';

declare global {
  namespace NodeJS {
    interface Global {
      logger?: Logger
    }
  }
}
