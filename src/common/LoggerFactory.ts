import stringify from 'fast-safe-stringify';
import winston, { Logger } from 'winston';
import { TransformableInfo } from 'logform';

export default class LoggerFactory {
  static createLogger(): Logger {
    const replacer = (key: string, value: any) => {
      if (value === '[Circular]') {
        return;
      }

      // eslint-disable-next-line consistent-return
      return value;
    };

    const printLog = (config: TransformableInfo) => {
      const {
        level, message, timestamp, stack, ...rest
      } = config;

      if (stack) {
        return `${timestamp}: ${level} ${message} ${stack}`;
      }

      const meta = Object.keys(rest).length > 0 ? stringify(rest, replacer, 2) : '';

      return `${timestamp}: ${level} ${message} ${meta}`;
    };

    const logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-dd HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      exitOnError: true,
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.add(new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(printLog),
        ),
        handleExceptions: true,
      }));
    } else {
      logger.add(new winston.transports.Console({
        level: 'error',
        handleExceptions: true,
      }));
    }

    return logger;
  }
}
