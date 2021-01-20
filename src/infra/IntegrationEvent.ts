import config from 'config';

export default class IntegrationEvent {
  constructor(
    public readonly model: string,
    public readonly action: string,
    public readonly service: string = config.get('service.name'),
  ) {
  }
}
