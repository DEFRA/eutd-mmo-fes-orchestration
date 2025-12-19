import logger from '../logger';
import * as CatchCertService from '../persistence/services/catchCert';
import { ExportLocation } from '../persistence/schema/frontEndModels/export-location';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as ProcessingStatementService from '../persistence/services/processingStatement'
import DocumentNumberService from "./documentNumber.service";
import ServiceNames from "../validators/interfaces/service.name.enum";

export default class ExportLocationService {

  public static async get(userId: string, documentNumber: string, contactId: string) : Promise<ExportLocation> {
    const journey = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);
    switch (journey) {
      case ServiceNames.SD : {
        return await StorageDocumentService.getExportLocation(userId, documentNumber, contactId);
      }
      case ServiceNames.PS : {
        return await ProcessingStatementService.getExportLocation(userId, documentNumber, contactId);
      }
      default: {
        return await CatchCertService.getExportLocation(userId, documentNumber, contactId);
      }
    }
  }

  public static async save(userId: string, load: ExportLocation, documentNumber: string, contactId: string) : Promise<void> {
    const journey = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);
    switch (journey) {
      case ServiceNames.SD : {
        await StorageDocumentService.upsertExportLocation(userId, load, documentNumber, contactId);
        break;
      }
      case ServiceNames.PS : {
        await ProcessingStatementService.upsertExportLocation(userId, load, documentNumber, contactId);
        break;
      }      default :{
        await CatchCertService.upsertExportLocation(userId, load, documentNumber, contactId);
      }
    }
  }

  public static async addExportLocation(userPrincipal: string, payload: any, documentNumber: string, contactId: string) {
    try {
      if (!['United Kingdom', 'Guernsey', 'Isle Of Man', 'Jersey'].includes(payload.exportedFrom) &&
        DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber) === ServiceNames.CC) {
        throw new Error(`[ERROR][${documentNumber}] Invalid departure country`);
      }

      const load: ExportLocation = await this.get(userPrincipal, documentNumber, contactId) as any || {};
      load.exportedFrom = payload.exportedFrom;
      load.exportedTo = payload.exportedTo;
      load.pointOfDestination = payload.pointOfDestination;
      await this.save(userPrincipal, load, documentNumber, contactId);
      return load;
    } catch(e) {
      logger.error(e);
      throw new Error('Cannot writeAllFor or readAllFor for export location');
    }
  }
}
