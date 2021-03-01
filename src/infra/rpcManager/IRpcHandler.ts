import RpcCommand from './RpcCommand';

export default interface IRpcHandler {
  handle(command: RpcCommand, payloadData: object): Promise<object>;
}
