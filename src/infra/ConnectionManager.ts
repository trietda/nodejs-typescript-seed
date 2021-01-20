import config from 'config';
import * as path from 'path';
import { createConnection, getConnection } from 'typeorm';
import { Singleton } from '../common';

@Singleton
export default class ConnectionManager {
  // eslint-disable-next-line class-methods-use-this
  async connect(): Promise<void> {
    await createConnection({
      type: 'mysql',
      host: config.get<string>('database.host'),
      port: config.get<number>('database.port'),
      username: config.get<string>('database.user'),
      password: config.get<string>('database.password'),
      database: config.get<string>('database.database'),
      entities: [
        path.resolve(__dirname, '**/*Entity{.ts,.js}'),
      ],
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async close(): Promise<void> {
    await getConnection().close();
  }
}
