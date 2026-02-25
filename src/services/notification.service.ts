import { SessionStoreFactory } from "../session_store/factory";
import { getRedisOptions } from "../session_store/redis";
import { IStorage, IStoreable } from "../session_store/storeable";


export interface Notification extends IStoreable {
  title: string,
  message: string,
  isPublished: boolean
}

export default class NotificationService {
  private static _sessionStore: IStorage<Notification> | null = null;

  public static clearSessionStoreCacheForTests(): void {
    NotificationService._sessionStore = null;
  }

  private static async getSessionStore(): Promise<IStorage<Notification>> {
    let sessionStore = NotificationService._sessionStore;

    if (!sessionStore) {
      sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions()) as IStorage<Notification>;
      NotificationService._sessionStore = sessionStore;
    }

    return sessionStore;
  }

  public static async get(): Promise<Notification | null> {
    const sessionStore = await NotificationService.getSessionStore();

    return sessionStore.read<Notification>('notification');
  }

}