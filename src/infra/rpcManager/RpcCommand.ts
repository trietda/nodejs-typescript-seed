import config from 'config';

export default class RpcCommand {
  constructor(
    public readonly resource: string,
    public readonly name: string,
    public readonly service: string = config.get('service.name'),
  ) {
  }
}
