export type Message = {
  data: object,
};

export type PublishOptions = {
  responseTopic?: string;
  correlationId?: string;
};
