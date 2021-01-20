import { Server, RequestListener } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { ConnectionManager } from '../infra';

export default class CustomServer {
  private readonly server: Server;

  constructor(listener: RequestListener) {
    this.server = new Server(listener);
    createTerminus(this.server, {
      healthChecks: {
        '/healthCheck': this.healthCheck,
      },

      timeout: 1000,
      signals: ['SIGTERM', 'SIGINT'],
      onSignal: this.onSignal,
      onShutdown: this.onShutdown,

      logger: global.logger?.error,
    });
  }

  listen(port: number): void {
    this.server.listen(port, () => {
      global.logger?.debug(`Server is listening at ${port}`);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async onSignal(): Promise<void> {
    global.logger?.debug('Database is shutting down');
    const connectionManager = new ConnectionManager();
    await connectionManager.close();
    global.logger?.debug('Database shut down');
  }

  // eslint-disable-next-line class-methods-use-this
  private async onShutdown(): Promise<void> {
    global.logger?.debug('Server is shutting down');
  }

  // eslint-disable-next-line class-methods-use-this
  private async healthCheck(): Promise<void> {
    // Noop
  }
}
