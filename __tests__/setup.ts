import { Express } from 'express';
import * as Common from '../src/common';
import * as Infra from '../src/infra';
import * as Web from '../src/web';

declare global {
  namespace NodeJS {
    interface Global {
      connectionManager: Infra.ConnectionManager,
      app: Express
    }
  }
}

beforeAll(async () => {
  const logger = Common.LoggerFactory.createLogger();

  const connectionManager = new Infra.ConnectionManager();
  await connectionManager.connect();

  const appBuilder = new Web.AppBuilder();
  appBuilder.setGlobalMiddlewares();
  appBuilder.configRouters();
  const app = appBuilder.getApp();

  Web.DomainEventRegister.registerDomainEvents();

  global.logger = logger;
  global.connectionManager = connectionManager;
  global.app = app;
});

afterAll(async () => {
  global.connectionManager.close();
});
