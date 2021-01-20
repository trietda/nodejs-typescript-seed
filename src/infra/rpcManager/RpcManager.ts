import IRpcStrategy from './IRpcStrategy';
import { Singleton } from '../../common';
import RpcCommand from './RpcCommand';
import IRpcHandler from './IRpcHandler';

@Singleton
export default class RpcManager {
  private _strategy: IRpcStrategy;

  setStrategy(strategy: IRpcStrategy): void {
    this._strategy = strategy;
  }

  constructor(strategy: IRpcStrategy) {
    this._strategy = strategy;
  }

  request(command: RpcCommand, payload: object): Promise<object | undefined> {
    return this._strategy.request(command, payload);
  }

  response(command: RpcCommand, handle: IRpcHandler): Promise<void> {
    return this._strategy.response(command, handle);
  }
}
