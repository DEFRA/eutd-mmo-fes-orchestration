import { IStorage } from './storeable';
import { IStoreable } from './storeable';
import { RedisStorage } from './redis';
import { MemoryStorage } from './memory';
import logger from '../logger';

export class SessionStoreFactory {
  private static sessionStore: IStorage<IStoreable>;

  private constructor() {}

  public static async getSessionStore(options: object)
    : Promise<IStorage<IStoreable>> {

    if (!SessionStoreFactory.sessionStore) {
      if (process.env.NODE_ENV==='test') {
        // NB: This is used only for test
        SessionStoreFactory.sessionStore = new MemoryStorage();
        SessionStoreFactory.sessionStore.initialize();

      } else {
        SessionStoreFactory.sessionStore = new RedisStorage();
        await SessionStoreFactory.sessionStore.initialize(options);
      }
    }

    logger.info('Session store initialized');
    return SessionStoreFactory.sessionStore;
  }

}