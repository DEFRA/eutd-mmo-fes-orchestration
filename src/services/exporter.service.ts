import { SessionStoreFactory } from '../session_store/factory';
import { getRedisOptions } from '../session_store/redis';
import { processingStatement, catchCerts,  storageNote } from './documentNumber.service';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import { withUserSessionDataStored, SessionData, getCurrentSessionData } from '../helpers/sessionManager';

export default class ExporterService {

  static async executeSave(userPrincipal: string, documentNumber: string, key: string, payload: any, service: any, contactId: string) {
    const sessionData = await service.getDraftData(userPrincipal, key, contactId);

    const data = {...sessionData, ...payload };

    const currentSessionData : SessionData = {
      documentNumber: documentNumber,
      nextUri: data.nextUri,
      currentUri: data.currentUri
    };

    await withUserSessionDataStored(userPrincipal, currentSessionData, contactId, async () => {
      await service.upsertExporterDetails(userPrincipal,documentNumber, data, contactId);
    });

    const userSessionData = await getCurrentSessionData(userPrincipal,documentNumber, contactId);
    data.user_id = userPrincipal;
    if (userSessionData) {
      data.nextUri = userSessionData.nextUri || undefined;
      data.currentUri = userSessionData.currentUri || undefined;
    }

    return data;
  }


  public static async get(userPrincipal: string, key, contactId: string) : Promise<any> {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const payload = await sessionStore.readAllFor(userPrincipal, contactId, key) || {};
    return payload;
  }

  public static async save(payload, userPrincipal, documentNumber, key, contactId: string) : Promise<any> {
    let data;

    if (key.startsWith(catchCerts)) {
      data = await ExporterService.executeSave(userPrincipal, documentNumber, key, payload, CatchCertService, contactId);
    } else if (key.startsWith(processingStatement)) {
      data = await ExporterService.executeSave(userPrincipal, documentNumber, key, payload, ProcessingStatementService, contactId);
    } else if (key.startsWith(storageNote)) {
      data = await ExporterService.executeSave(userPrincipal,documentNumber, key, payload, StorageDocumentService, contactId);
    }

    return data;
  }

}
