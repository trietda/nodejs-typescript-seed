import { EntityManager, getConnection, QueryRunner } from 'typeorm';
import Repository from './repository/Repository';

export default class UnitOfWork {
  private readonly repositoryMap: Record<string, Repository>;

  private readonly queryRunner: QueryRunner;

  private hasInitialized: boolean;

  constructor() {
    this.queryRunner = getConnection().createQueryRunner();
    this.repositoryMap = {};
    this.hasInitialized = false;
  }

  async init() {
    this.hasInitialized = true;
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  getRepository<T extends Repository>(
    RepositoryClass: { new(entityManager: EntityManager): T },
  ): T {
    if (!this.hasInitialized) {
      throw new Error('unit of work is not initialized');
    }

    const repositoryName = RepositoryClass.name;

    if (!this.repositoryMap[repositoryName]) {
      this.repositoryMap[repositoryName] = new RepositoryClass(this.queryRunner.manager);
    }

    return this.repositoryMap[repositoryName] as T;
  }

  async commit(changes: (() => void) | (() => Promise<any>)) {
    if (!this.hasInitialized) {
      throw new Error('unit of work is not initialized');
    }

    try {
      await changes();
      await this.queryRunner.commitTransaction();
    } catch (err) {
      await this.queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await this.queryRunner.release();
    }
  }
}
