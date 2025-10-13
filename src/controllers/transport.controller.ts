import * as Hapi from '@hapi/hapi';
import * as moment from 'moment';
import logger from '../logger';
import Services from "../services/transport.service";
import acceptsHtml from "../helpers/acceptsHtml";
import OrchestrationService, { cleanDate, storageNote } from "../services/orchestration.service";
import { HapiRequestApplicationStateExtended } from '../types';

export default class TransportController {

  static nextVehicleUri(payload) {
    const { truckCmrUri, planeDetailsUri, trainDetailsUri, containerVesselDetailsUri, summaryUri, vehicle } = payload;

    let nextUri = '';
    switch (vehicle) {
      case 'truck':
        nextUri = truckCmrUri;
        break;
      case 'plane':
        nextUri = planeDetailsUri;
        break;
      case 'train':
        nextUri = trainDetailsUri;
        break;
      case 'containerVessel':
        nextUri = containerVesselDetailsUri;
        break;
      case 'directLanding':
        nextUri = summaryUri;
        break;
    }

    return nextUri;
  }

  static nextTruckUri(payload) {
    const { summaryUri, truckDetailsUri } = payload;

    return payload.cmr === 'true' ? summaryUri : truckDetailsUri;
  }

  public static async addTransport(req: Hapi.Request, h, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub }, 'Received a request to add a transport');
    const payload: any = { ...(req.payload as any) };
    payload.user_id = userPrincipal;

    const data = await Services.addTransport(payload, documentNumber, contactId) as any;

    if (acceptsHtml(req.headers)) {
      if (savingAsDraft) {
        return h.redirect(payload.dashboardUri);
      }
      const uri = TransportController.nextVehicleUri(payload);
      return h.redirect(uri);
    }
    return data;
  }

  public static async addTransportDetails(req: Hapi.Request, h, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: userPrincipal }, 'Received a request to add a transport details');
    const payload: any = { ...(req.payload as any) };
    payload.user_id = userPrincipal;
    if (payload.exportDate) {
      payload.exportDate = cleanDate(payload.exportDate);

      const storageDocument = await OrchestrationService.getFromMongo(userPrincipal, documentNumber, storageNote, contactId);
      if (storageDocument && Array.isArray(storageDocument.storageFacilities)) {
        // when we update NMD to having just one storageFacility obtain facilityArrivalDate from storageDocument.facilityArrivalDate
        // as opposed to storageDocument.storageFacilities.facilityArrivalDate;
        const hasFacilityArrivalDateError = storageDocument.storageFacilities.some(
          (storageFacility) => storageFacility.facilityArrivalDate && moment(payload.exportDate, ["DD/MM/YYYY", "DD/M/YYYY", "D/MM/YYYY", "D/M/YYYY"]).isBefore(moment(storageFacility.facilityArrivalDate, ["DD/MM/YYYY", "DD/M/YYYY", "D/MM/YYYY", "D/M/YYYY"]))
        );

        if (hasFacilityArrivalDateError) {
          const errorObject = { exportDate: `error.${payload.vehicle}.exportDate.any.min` };
          return h.response(errorObject).code(400).takeover();
        }
      }
    }

    if (payload.departureDate) payload.departureDate = cleanDate(payload.departureDate);

    const data = await Services.addTransport(payload, documentNumber, contactId) as any;

    if (acceptsHtml(req.headers)) {
      if (savingAsDraft) {
        return h.redirect(payload.dashboardUri);
      }
      return h.redirect(payload.nextUri);
    }

    return data;
  }

  public static async addTruckCMR(req: Hapi.Request, h, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub }, 'addTruckCMR()');
    const payload: any = { ...(req.payload as any) };
    payload.user_id = userPrincipal;

    const data = await Services.addTransport(payload, documentNumber, contactId) as any;

    if (acceptsHtml(req.headers)) {
      if (savingAsDraft) {
        return h.redirect(payload.dashboardUri);
      }
      const uri = TransportController.nextTruckUri(payload);
      return h.redirect(uri);
    }
    return data;
  }

  public static async getTransportDetails(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload: any = { ...(req.payload as any) };
    payload.user_id = userPrincipal;
    const arrival = req.query?.arrival ? req.query.arrival === 'true' : false;
    const data = await Services.getTransportDetails(userPrincipal, req.params.journey, documentNumber, contactId, arrival) as any;

    return data;
  }

  public static async addTransportSaveAsDraft(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: userPrincipal }, 'Received a request to add transport and save as draft');
    return TransportController.addTransport(req, h, true, userPrincipal, documentNumber, contactId);
  }

  public static async addTruckCMRSaveAsDraft(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: userPrincipal }, 'Received a request to add transport CMR and save as draft');
    return TransportController.addTruckCMR(req, h, true, userPrincipal, documentNumber, contactId);
  }

  public static async addTransportDetailsSaveAsDraft(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({ userPrincipal: userPrincipal }, 'Received a request to add transport details and save as draft');
    return TransportController.addTransportDetails(req, h, true, userPrincipal, documentNumber, contactId);
  }
}
