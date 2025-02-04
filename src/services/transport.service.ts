import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageNotesService from '../persistence/services/storageDoc';
import { withUserSessionDataStored, SessionData, getCurrentSessionData } from '../helpers/sessionManager';
import { Transport, checkTransportDataFrontEnd } from '../persistence/schema/frontEndModels/transport';

export default class TransportService {

  public static async addTransport(payload: any, documentNumber : string, contactId: string) {
    const userPrincipal = payload.user_id;

    let transport = await TransportService.getTransportData(userPrincipal, payload.journey,documentNumber, contactId);

    transport = {...transport, ...payload};

    switch(payload.journey) {
      case "catchCertificate" : {
        const sessionData : SessionData = {
          documentNumber : documentNumber,
          currentUri: payload.currentUri,
          nextUri: payload.nextUri
        };
        await withUserSessionDataStored(payload.user_id, sessionData, contactId, async () => {
          await CatchCertService.upsertTransportDetails(userPrincipal, transport, documentNumber, contactId);
        });
        break;
      }
      case "storageNotes" : {
        const sessionData : SessionData = {
          documentNumber : documentNumber,
          currentUri: payload.currentUri,
          nextUri: payload.nextUri
        };
        await withUserSessionDataStored(payload.user_id, sessionData, contactId, async () => {
          await StorageNotesService.upsertTransportDetails(userPrincipal, transport, documentNumber, contactId);
        });
        break;
      }
    }

    return  await this.getTransportDetails(userPrincipal,payload.journey,documentNumber, contactId);
  }

  public static async removeTransport(userPrincipal: string, documentNumber: string, contactId: string): Promise<void> {
    await CatchCertService.deleteTransportDetails(userPrincipal, documentNumber, contactId);
  }

  public static async getTransportDetails(userPrincipal: string, journey: string, documentNumber: string, contactId: string): Promise<Transport> {

    let data = await TransportService.getTransportData(userPrincipal, journey,documentNumber, contactId);

    if (data?.vehicle) {
      data = checkTransportDataFrontEnd(data);
    }

    if (data) {
      const sessionData = await getCurrentSessionData(userPrincipal, documentNumber, contactId);

      if (sessionData) {
        data.currentUri = sessionData.currentUri;
        data.nextUri = sessionData.nextUri;
      }

      data.user_id = userPrincipal;
      data.journey = journey;

      return data;
    } else {
      return { vehicle: undefined };
    }
  }

  public static async getTransportData(userPrincipal: string, journey: string, documentNumber: string, contactId: string): Promise<Transport> {
    switch(journey) {
      case "catchCertificate" : return await CatchCertService.getTransportDetails(userPrincipal,documentNumber, contactId);
      case "storageNotes" : return await StorageNotesService.getTransportDetails(userPrincipal,documentNumber, contactId);
      default: throw new Error("Invalid arguments");
    }
  }
}
