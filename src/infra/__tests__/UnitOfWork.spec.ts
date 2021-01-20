import { Connection, getConnection } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import UnitOfWork from '../UnitOfWork';
import Repository from '../repository/Repository';

jest.mock('typeorm');

const getConnectionMock = mocked(getConnection, true);
const connectMock = jest.fn();
const startTransactionMock = jest.fn();
const commitTransactionMock = jest.fn();
const rollbackTransactionMock = jest.fn();
const releaseMock = jest.fn();
const createQueryRunnerMock = jest.fn(() => ({
  connect: connectMock,
  startTransaction: startTransactionMock,
  commitTransaction: commitTransactionMock,
  rollbackTransaction: rollbackTransactionMock,
  release: releaseMock,
}));
getConnectionMock.mockImplementation(() => <unknown>{
  createQueryRunner: createQueryRunnerMock,
} as Connection);

class TestRepository extends Repository {
}

describe('UnitOfWork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('#init()', () => {
    it('init unit of work', async () => {
      const unitOfWork = new UnitOfWork();

      const promise = unitOfWork.init();

      await expect(promise).resolves;
      expect(getConnectionMock).toBeCalled();
    });
  });

  describe('#getRepository()', () => {
    it('throw when not initialized', async () => {
      const unitOfWork = new UnitOfWork();

      expect(() => {
        unitOfWork.getRepository(TestRepository);
      }).toThrow('unit of work is not initialized');
    });

    it('get repository', async () => {
      const unitOfWork = new UnitOfWork();
      await unitOfWork.init();

      const testRepository = unitOfWork.getRepository(TestRepository);

      expect(testRepository).toBeInstanceOf(TestRepository);
    });

    it('get 1 instance of repository', async () => {
      const unitOfWork = new UnitOfWork();
      await unitOfWork.init();

      const testRepositoryInstance1 = unitOfWork.getRepository(TestRepository);
      const testRepositoryInstance2 = unitOfWork.getRepository(TestRepository);

      expect(testRepositoryInstance1).toBe(testRepositoryInstance2);
    });
  });

  describe('#commit()', () => {
    it('throw when not initialized', async () => {
      const unitOfWork = new UnitOfWork();
      const changes = async () => {
      };

      const promise = unitOfWork.commit(changes);

      await expect(promise).rejects.toThrow('unit of work is not initialized');
    });

    it('commit any changes and release the connection', async () => {
      const unitOfWork = new UnitOfWork();
      await unitOfWork.init();
      const changes = async () => {
      };

      await unitOfWork.commit(changes);

      expect(commitTransactionMock).toBeCalled();
      expect(releaseMock).toBeCalled();
    });

    it('rollback when there is error and release connection', async () => {
      const unitOfWork = new UnitOfWork();
      await unitOfWork.init();
      const error = new Error('test error');
      const changes = async () => {
        throw error;
      };

      const promise = unitOfWork.commit(changes);

      await expect(promise).rejects.toThrow(error);
      expect(rollbackTransactionMock).toBeCalled();
      expect(releaseMock).toBeCalled();
    });
  });
});
