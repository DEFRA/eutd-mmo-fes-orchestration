import logger from '../logger';
import  * as CatchCertService from "../persistence/services/catchCert";
import { Conservation } from '../persistence/schema/frontEndModels/conservation';
import { withUserSessionDataStored, SessionData, getCurrentSessionData } from '../helpers/sessionManager';

export default class ConservationService {

  public static async addConservation(payload, documentNumber, contactId: string) {
    logger.debug('addConservation ', payload);
    const userPrincipal = payload.user_id;

    if( payload.caughtInOtherWaters !== 'Y') delete payload.otherWaters;
    if( !payload.caughtInUKWaters ) delete payload.caughtInUKWaters;
    if( !payload.caughtInEUWaters ) delete payload.caughtInEUWaters;
    if( !payload.caughtInOtherWaters ) delete payload.caughtInOtherWaters;

    payload.legislation = [];

    if( payload.caughtInUKWaters === 'Y') payload.legislation.push('UK Fisheries Policy');
    if( payload.caughtInEUWaters === 'Y') payload.legislation.push('Common Fisheries Policy');
    if( payload.caughtInOtherWaters === 'Y') payload.legislation.push(payload.otherWaters);

    payload.conservationReference = payload.legislation.join(', ');

    const sessionData : SessionData = {
      documentNumber: documentNumber,
      nextUri: payload.nextUri,
      currentUri: payload.currentUri
    };

    return await withUserSessionDataStored(payload.user_id, sessionData, contactId, async () => {
      await CatchCertService.upsertConservation(userPrincipal, payload as Conservation, documentNumber, contactId);
      return payload
    });
  }

  public static async getConservation(payload, documentNumber, contactId: string) {
    logger.debug('getConservation ', payload);
    const userPrincipal = payload.user_id;

    const conservation = await CatchCertService.getConservation(userPrincipal, documentNumber, contactId);
    if (conservation) {

      const sessionData = await getCurrentSessionData(userPrincipal, documentNumber, contactId);
      conservation.user_id = userPrincipal;
      if(sessionData){
        conservation.nextUri = sessionData.nextUri;
        conservation.currentUri = sessionData.currentUri;
      }
    }

    return conservation;
  }
}
