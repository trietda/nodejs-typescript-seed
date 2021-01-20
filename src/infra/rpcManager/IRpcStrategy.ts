import RpcCommand from './RpcCommand';
import IRpcHandler from './IRpcHandler';

export default interface IRpcStrategy {
  request(command: RpcCommand, payload: object): Promise<object | undefined>;

  response(command: RpcCommand, handle: IRpcHandler): Promise<void>;
}
