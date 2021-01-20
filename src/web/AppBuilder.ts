import express, { Express } from 'express';
import compression from 'compression';
import cors from 'cors';
import config from 'config';
import morgan from 'morgan';
import * as controller from './controller';
// import * as middleware from './middleware';

export default class AppBuilder {
  constructor(private app: Express = express()) {
  }

  setGlobalMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(compression());
    this.app.use(cors({
      origin: config.get<string>('cors.origin'),
      allowedHeaders: config.get<string>('cors.allowedHeaders'),
    }));

    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('common'));
    }
  }

  configRouters(): void {
    const v1Router = express.Router();

    const apiRouter = express.Router();
    apiRouter.use('/v1', v1Router);
    apiRouter.use(controller.Api.handleApiNotFound);
    apiRouter.use(controller.Api.handleValidationError);
    apiRouter.use(controller.Api.handleNotFoundError);
    apiRouter.use(controller.Api.handleApiError);

    this.app.use('/api', apiRouter);
    this.app.use(controller.handleNotFound);
    this.app.use(controller.handleError);
  }

  getApp(): Express {
    return this.app;
  }
}
