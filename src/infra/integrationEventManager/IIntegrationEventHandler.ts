export default interface IIntegrationEventHandler {
  handle(payload: object): Promise<void>;
}
