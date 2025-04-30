import logger from '../logger';

import { SessionStoreFactory } from '../session_store/factory';
import { getRedisOptions } from '../session_store/redis';
import { SAVE_DRAFT_KEY } from '../session_store/constants';

export default class SaveAsDraftService {

  public static async getDraftLink(userPrincipal: string, journey: string, contactId: string) {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const key = journey + '/' + SAVE_DRAFT_KEY;
    const data: any = await sessionStore.readAllFor(userPrincipal, contactId, key);

    logger.debug(`[GET][${key}][SAVE AS DRAFT]`);

    return data ?? {};
  }

  public static async deleteDraftLink(userPrincipal: string, documentNumber: string, journey: string, contactId: string) {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const key = journey + '/' + SAVE_DRAFT_KEY;
    const data: any = await SaveAsDraftService.getDraftLink(userPrincipal, journey, contactId);

    logger.debug(`[DELETE][${key}][SAVE AS DRAFT][DOCUMENT NUMBER][${documentNumber}]`);

    if (data?.currentUri) {
      delete data.currentUri[documentNumber];
      await sessionStore.writeAllFor(userPrincipal, contactId, key, data);
    }
  }
}