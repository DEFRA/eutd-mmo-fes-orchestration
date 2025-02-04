import * as Hapi from '@hapi/hapi';
import Services from '../services/exporter.service';
import acceptsHtml from '../helpers/acceptsHtml';
import { EXPORTER_KEY, DOCUMENT_NUMBER_KEY } from '../session_store/constants';
import DocumentNumberService, { catchCerts, storageNote, processingStatement } from '../services/documentNumber.service';
import { CatchCertificateDraft } from '../persistence/schema/frontEndModels/catchCertificate';
import { ProcessingStatementDraft } from '../persistence/schema/frontEndModels/processingStatement';
import { StorageDocumentDraft } from '../persistence/schema/frontEndModels/storageDocument';
import ServiceNames from '../validators/interfaces/service.name.enum';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import errorExtractor from '../helpers/errorExtractor';
import ExporterService from "../services/exporter.service";
import logger from '../logger';

export default class ExporterController {

  public static async getExporterDetails(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const journey = req.params.journey;
    let result;

    switch (journey) {
      case processingStatement:
        result = await ProcessingStatementService.getExporterDetails(userPrincipal, documentNumber, contactId);
        break;
      case catchCerts:
        result = await CatchCertService.getExporterDetails(userPrincipal, documentNumber, contactId);
        break;
      case storageNote:
        result = await StorageDocumentService.getExporterDetails(userPrincipal, documentNumber, contactId);
        break;
      default:
        result = await ExporterController.getExporterDetailsFromRedis(userPrincipal, journey, contactId);
        break;
    }

    return result || {};
  }

  public static async processSaveExporterDetailsErrors(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error :any, userPrincipal: string ,documentNumber: string, contactId: string) {
    const newExporter = { model: undefined, error: undefined, errors: undefined };
    newExporter.error = 'invalid';
    newExporter.errors = errorExtractor(error);

    if (req.payload) {
      newExporter.model = req.payload;
      await ExporterService.save(newExporter, userPrincipal,documentNumber, req.params.journey + '/' + EXPORTER_KEY, contactId);
    }
    if (acceptsHtml(req.headers)) {
      const payload = req.payload as any;
      let uri = payload.currentUri;
      if (payload.nextUri) {
        uri = uri + '?nextUri=' + payload.nextUri;
      }
      return h.redirect(uri).takeover();
    } else {
      return h.response(newExporter).code(400).takeover();
    }
  }

  public static async getExporterDetailsFromRedis(userPrincipal: string, journey: string, contactId: string) {
    const documentKey = journey + '/' + DOCUMENT_NUMBER_KEY;
    const document: CatchCertificateDraft[] | ProcessingStatementDraft[] | StorageDocumentDraft[] =
      await DocumentNumberService.getDraftDocuments(userPrincipal, documentKey, contactId);
    if (Object.keys(document).length === 0) {
      let serviceName = '';
      switch (journey) {
        case catchCerts : {
          serviceName = ServiceNames.CC;
          break;
        }
        case storageNote : {
          serviceName = ServiceNames.SD;
          break;
        }
        case processingStatement : {
          serviceName = ServiceNames.PS;
          break;
        }
        default : {
          serviceName = ServiceNames.UNKNOWN;
          break;
        }
      }
      await DocumentNumberService.createDocumentNumber(userPrincipal, serviceName, documentKey, journey, contactId);
    }

    return await Services.get(userPrincipal, journey + '/' + EXPORTER_KEY, contactId);
  }

  public static async addExporterDetails(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
      const payload = { ...(req.payload as any) };
      payload.user_id = userPrincipal;

      const newExporter = {
        model: {...payload},
        error: undefined,
        errors: undefined
      };

      logger.info(`[ADD-EXPORTER-DETAILS][${JSON.stringify(newExporter.model)}]`);

      const result = await Services.save(newExporter, userPrincipal, documentNumber,payload.journey + '/' + EXPORTER_KEY, contactId);

      if (acceptsHtml(req.headers)) {
        if (savingAsDraft) {
          return h.redirect(payload.dashboardUri);
        } else {
          return h.redirect(payload.nextUri);
        }
      } else {
        return result;
      }
  }

  public static async addExporterDetailsAndDraftLink(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    return await ExporterController.addExporterDetails(req, h, true, userPrincipal,documentNumber, contactId);
  }
}
