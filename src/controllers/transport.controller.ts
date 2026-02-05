import * as Hapi from '@hapi/hapi';
import logger from '../logger';
import Services from "../services/transport.service";
import acceptsHtml from "../helpers/acceptsHtml";
import OrchestrationService, { cleanDate, parseDate, storageNote } from "../services/orchestration.service";
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

  private static async validateExportDate(payload: any, userPrincipal: string, documentNumber: string, contactId: string, h: Hapi.ResponseToolkit) {
    if (!payload.exportDate) {
      return null;
    }

    payload.exportDate = cleanDate(payload.exportDate);

    const storageDocument = await OrchestrationService.getFromMongo(userPrincipal, documentNumber, storageNote, contactId);
    if (!storageDocument?.facilityArrivalDate) {
      return null;
    }

    const exportDate = parseDate(payload.exportDate);
    const facilityArrivalDate = parseDate(storageDocument.facilityArrivalDate);

    if (exportDate.isBefore(facilityArrivalDate)) {
      return h.response({ exportDate: `error.${payload.vehicle}.exportDate.any.min` }).code(400).takeover();
    }

    return null;
  }

  private static async validateArrivalDepartureDate(payload: any, userPrincipal: string, documentNumber: string, contactId: string, h: Hapi.ResponseToolkit) {
    if (!payload.departureDate) {
      return null;
    }

    payload.departureDate = cleanDate(payload.departureDate);

    // FI0-10797: Validate arrival departure date is on or before storage facility arrival date
    const isArrivalForStorageNote = payload.arrival === true && payload.journey === 'storageNotes';
    if (!isArrivalForStorageNote) {
      return null;
    }

    const storageDocument = await OrchestrationService.getFromMongo(userPrincipal, documentNumber, storageNote, contactId);
    if (!storageDocument?.facilityArrivalDate) {
      return null;
    }

    const arrivalDepartureDate = parseDate(payload.departureDate);
    const storageFacilityArrivalDate = parseDate(storageDocument.facilityArrivalDate);

    if (arrivalDepartureDate.isAfter(storageFacilityArrivalDate, 'day')) {
      const vehicleCapitalized = payload.vehicle.charAt(0).toUpperCase() + payload.vehicle.slice(1);
      const errorKey = `error${vehicleCapitalized}DepartureDateAnyMax`;
      return h.response({ departureDate: errorKey }).code(400).takeover();
    }

    return null;
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

    const exportDateError = await this.validateExportDate(payload, userPrincipal, documentNumber, contactId, h);
    if (exportDateError) {
      return exportDateError;
    }

    const departureDateError = await this.validateArrivalDepartureDate(payload, userPrincipal, documentNumber, contactId, h);
    if (departureDateError) {
      return departureDateError;
    }

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
