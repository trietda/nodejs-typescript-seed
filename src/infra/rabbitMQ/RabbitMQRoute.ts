export default class RabbitMQRoute {
  constructor(
    public readonly exchange: string,
    public readonly route: string,
    public readonly queue = '',
  ) {
  }
}
