export default {
  createStrategy: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
  })),
};
