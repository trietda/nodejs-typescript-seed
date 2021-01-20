import RpcCommand from './RpcCommand';

export default interface IRpcHandler {
  handle(command: RpcCommand, payload: object): Promise<object>;
}
