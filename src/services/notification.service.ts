import { SessionStoreFactory } from "../session_store/factory";
import { getRedisOptions } from "../session_store/redis";
import { IStoreable } from "../session_store/storeable";


export default interface Notification extends IStoreable {
  title: string,
  message: string,
  isPublished: boolean
}

export default class NotificationService {

  public static async get(): Promise<Notification> {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

    return await sessionStore.read<Notification>('notification');
  }

}