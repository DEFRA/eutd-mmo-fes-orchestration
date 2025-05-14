import axios from 'axios';
import logger from '../logger';
import VesselLandingsRefresher from './vesselLandingsRefresher.service';
import {
  BLOB_STORAGE_CONTAINER_NAME,
  STATUS_COMPLETE,
  SYSTEM_ERROR
} from './constants';
import ApplicationConfig from "../applicationConfig";
import * as CatchCertService from "../persistence/services/catchCert";
import CatchCertificateTransport from "./catch-certificate-transport.service";
import ValidationFilterService from './onlineValidationReportFilter';
import SummaryErrorsService from '../services/summaryErrors.service';
import { getBlockingStatus } from '../persistence/services/systemBlock';
import { ValidationRules } from '../persistence/schema/systemBlock';
import { IExportCertificateResults } from '../persistence/schema/exportCertificateResults'
import { IOnlineValidationReportItem } from '../persistence/schema/onlineValidationReport'
import {
  withUserSessionDataStored,
  SessionData,
  SessionLanding,
  getCurrentSessionData,
  SessionStore,
  clearSessionDataForCurrentJourney
} from '../helpers/sessionManager';
import { addIsLegallyDue, reportDocumentSubmitted } from './reference-data.service';
import { LandingStatus, ProductLanded, ProductsLanded, getNumberOfUniqueLandings, DirectLanding, toFrontEndValidationFailure, SystemFailure } from '../persistence/schema/frontEndModels/payload';
import { DocumentStatuses } from '../persistence/schema/catchCert';
import { LandingsRefreshData } from './interfaces';
import { CcExportedDetailModel } from '../persistence/schema/frontEndModels/exporterDetails';
import { SSL_OP_LEGACY_SERVER_CONNECT } from "constants";
import { updateConsolidateLandings } from "./landings-consolidate.service";
import * as pdfService from 'mmo-ecc-pdf-svc';

const crypto = require('crypto');
const https = require('https');

export default class ExportPayloadService {

  public static async get(userId: string, documentNumber: string, contactId: string): Promise<ProductsLanded> {
    logger.info(`[GET-EXPORT-PAYLOAD][RETRIEVING-SESSION-DATA][DOCUMENT-NUMBER][${documentNumber}]`);
    const sessionData: SessionStore = await getCurrentSessionData(userId, documentNumber, contactId);
    const exportPayload: ProductsLanded = await CatchCertService.getExportPayload(userId, documentNumber, contactId);

    if (sessionData?.landings && exportPayload?.items) {
      exportPayload.items.forEach(item => {
        if (Array.isArray(item.landings)) {
          item.landings.forEach(landing => ExportPayloadService.applySessionDataToLanding(sessionData, landing))
        }
      })
    }

    return exportPayload;
  }

  static readonly applySessionDataToLanding = (sessionData: SessionStore, landing: LandingStatus) => {
    const sessionLanding = sessionData.landings.find(_ => _.landingId === landing.model.id);

    if (sessionLanding) {
      logger.info(`[GET-EXPORT-PAYLOAD][APPLYING-SESSION-DATA][${sessionLanding.landingId}`);
      landing.addMode = sessionLanding.addMode;
      landing.editMode = sessionLanding.editMode;
      landing.error = sessionLanding.error;
      landing.errors = sessionLanding.errors;
      landing.modelCopy = sessionLanding.modelCopy;
      landing.model = !sessionLanding.error ? landing.model : sessionLanding.model
    }
  }

  public static async save(
    exportPayload: ProductsLanded,
    userId: string,
    documentNumber: string,
    contactId: string
  ): Promise<ProductsLanded> {

    for (const item of exportPayload.items) {
      if (Array.isArray(item.landings)) {
        for (const landing of item.landings) {
          const sessionLanding: SessionLanding = {
            landingId: landing.model.id,
            addMode: landing.addMode,
            editMode: landing.editMode,
            error: landing.error,
            errors: landing.errors,
            modelCopy: landing.modelCopy,
            model: landing.model
          };

          const sessionData: SessionData = {
            documentNumber: documentNumber,
            landing: sessionLanding
          };

          await withUserSessionDataStored(userId, sessionData, contactId);
        }
      }
    }

    await CatchCertService.upsertExportPayload(userId, exportPayload, documentNumber, contactId);

    return exportPayload;
  }

  public static async getDirectLanding(userPrincipal: string, documentNumber: string, contactId: string): Promise<DirectLanding> {
    const sessionData: SessionStore = await getCurrentSessionData(userPrincipal, documentNumber, contactId);
    const directLanding: DirectLanding = await CatchCertService.getDirectExportPayload(userPrincipal, documentNumber, contactId);

    if (sessionData?.landings && directLanding) {
      const sessionLanding = sessionData.landings.find((landing: SessionLanding) => landing.landingId === directLanding.id);

      if (sessionLanding) {
        directLanding.error = sessionLanding.error;
        directLanding.errors = sessionLanding.errors;
      }
    }

    return directLanding;
  }

  public static async upsertLanding(productId: string, landing, userId: string, documentNumber: string, contactId: string): Promise<any> {
    const sessionData: SessionStore = await getCurrentSessionData(userId, documentNumber, contactId);
    const exportPayload: ProductsLanded = await CatchCertService.getExportPayload(userId, documentNumber, contactId);
    if (exportPayload?.items) {
      exportPayload.items.forEach(item => ExportPayloadService.upsertLandingAddSessionData(item, sessionData));
    }

    if (!exportPayload.items) {
      exportPayload.items = [];
    }

    const matchedItem = exportPayload.items.find((item) =>
      item.product.id === productId
    );

    if (matchedItem) {
      // must be a match or we cant add a landing
      if (!matchedItem.landings) {
        matchedItem.landings = [];
      }

      let matchedLanding = matchedItem.landings.find((lnd) =>
        lnd.model.id === landing.model.id
      );

      if (!matchedLanding) {
        // Replace an 'empty' landing if one exists
        matchedLanding = matchedItem.landings.find((lnd) =>
          lnd.model?.id === undefined
        );
      }

      const landingOverriddenByAdmin = (landing: LandingStatus): boolean =>
        landing?.model?.vessel?.vesselOverriddenByAdmin;

      if (landingOverriddenByAdmin(matchedLanding) || landingOverriddenByAdmin(landing)) {
        throw new Error('cannot update an overridden landing');
      }

      if (!matchedLanding) {
        matchedItem.landings.push(landing);
      } else {
        // preserve the number of submissions
        const numberOfSubmissions = matchedLanding.model.numberOfSubmissions;

        matchedLanding.addMode = false;
        matchedLanding.model = {
          ...landing.model,
          numberOfSubmissions
        };
        matchedLanding.error = landing.error;
        matchedLanding.errors = landing.errors;
        matchedLanding.editMode = !!matchedLanding.error;
      }

      exportPayload.errors = undefined;

      const sessionLanding: SessionLanding = ExportPayloadService.upsertLandingGetSessionLanding(landing, matchedLanding)

      const _sessionData: SessionData = {
        documentNumber: documentNumber,
        landing: sessionLanding
      }

      await withUserSessionDataStored(userId, _sessionData, contactId, async () => {
        await CatchCertService.upsertExportPayload(userId, exportPayload, documentNumber, contactId);
      });
    }

    return exportPayload;
  }

  static readonly upsertLandingAddSessionData = (item: ProductLanded, sessionData: SessionStore) => {
    if (Array.isArray(item.landings)) {
      item.landings.forEach(_landing => {
        if (sessionData?.landings) {
          const sessionLanding = sessionData.landings.find(_ => _.landingId === _landing.model.id);
          if (sessionLanding) {
            _landing.addMode = sessionLanding.addMode;
            _landing.editMode = sessionLanding.editMode;
            _landing.error = sessionLanding.error;
            _landing.errors = sessionLanding.errors;
            _landing.modelCopy = sessionLanding.modelCopy;
          }
        }
      });
    }
  }

  static readonly upsertLandingGetSessionLanding = (landing: LandingStatus, matchedLanding: LandingStatus): SessionLanding => ({
    landingId: landing.model.id,
    addMode: !matchedLanding ? landing.addMode : false,
    editMode: !matchedLanding ? landing.editMode : !!matchedLanding.error,
    error: landing.error,
    errors: landing.errors,
    modelCopy: !matchedLanding ? landing.modelCopy : matchedLanding.modelCopy,
    model: !matchedLanding ? landing.model : matchedLanding.model
  })

  public static async checkCertificate(payloadToValidate, url): Promise<any> {
    try {
      const payload = {
        dataToValidate: payloadToValidate
      };
      const res: any = await axios.post(url, payload);
      logger.info(`[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE] Report: ${JSON.stringify(res.data.report)}`);
      logger.info(`[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE] Raw Data: ${JSON.stringify(res.data.rawData)}`);
      return res.data;
    } catch (e) {
      logger.error(`[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE][ERROR][${e.stack || e}]`);
      throw new Error(e);
    }
  }

  public static readonly updateCertificateStatus = async (userPrincipal: string, documentNumber: string, contactId: string, status: DocumentStatuses): Promise<void> =>
    CatchCertService.updateCertificateStatus(userPrincipal, documentNumber, contactId, status);

  public static readonly getCertificateStatus = async (userPrincipal: string, documentNumber: string, contactId: string): Promise<string> =>
    CatchCertService.getCertificateStatus(userPrincipal, documentNumber, contactId);

  public static readonly isSubmissionFailure = (results: IExportCertificateResults | void) =>
    (results && results.report.length > 0 && results.isBlockingEnabled);

  public static async createExportCertificate(userPrincipal: string, documentNumber: string, email: string, contactId: string): Promise<IExportCertificateResults> {
    try {
      if (!email) logger.error(`[EXPORT-PAYLOAD-SERVICE][CREATE-EXPORT-CERTIFICATE][ERROR]Missing email for user[${userPrincipal}]`);

      logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][START]`);

      const exporter = await ExportPayloadService.awaitValueOrEmpty(CatchCertService.getExporterDetails(userPrincipal, documentNumber, contactId));
      const exportedFrom = await ExportPayloadService.awaitValueOrEmpty(CatchCertService.getExportLocation(userPrincipal, documentNumber, contactId));
      const exporterModel: CcExportedDetailModel = exporter?.model ? exporter.model : {} as CcExportedDetailModel;
      const transport: any = await ExportPayloadService.awaitValueOrEmpty(CatchCertificateTransport.getTransportationDetails(userPrincipal, documentNumber, contactId));

      const catchCertificate = {
        transport: { ...transport, ...exportedFrom }
      }

      await addIsLegallyDue(documentNumber);
      await CatchCertService.invalidateDraftCache(userPrincipal, documentNumber, contactId);

      const exportPayload: ProductsLanded = await ExportPayloadService.awaitValueOrEmpty(CatchCertService.getExportPayload(userPrincipal, documentNumber, contactId));

      const numberOfLandings = getNumberOfUniqueLandings(exportPayload);
      const offlineValidation = ApplicationConfig.isOfflineValidation(numberOfLandings);
      if (offlineValidation) {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][REFRESHING-LANDINGS-SERIAL]`);
        await this.performSerialRefresh(documentNumber, exportPayload.items);
      } else {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][REFRESHING-LANDINGS-PARALLEL]`);
        await this.performParallelRefresh(documentNumber, exportPayload.items);
      }

      const conservationData = await ExportPayloadService.awaitValueOrEmpty(CatchCertService.getConservation(userPrincipal, documentNumber, contactId));
      const transportData = await ExportPayloadService.awaitValueOrEmpty(CatchCertificateTransport.getTransportationDetails(userPrincipal, documentNumber, contactId));
      const validationPayload = {
        exportPayload: exportPayload,
        documentNumber: documentNumber,
        conservation: conservationData,
        exporter: exporterModel,
        transport: transportData
      };

      const baseUrl = ApplicationConfig.getReferenceServiceUrl();
      const base = `${baseUrl}/v1/catchcertificates/validation/online`;
      const certificateData = await ExportPayloadService.checkCertificate(validationPayload, base);
      const onlineValidationReport: IOnlineValidationReportItem[] = certificateData.report;

      let isBlocking3CEnabled: boolean = false;
      let isBlocking3DEnabled: boolean = false;
      let isBlocking4AEnabled: boolean = false;
      const isBlockingNoDataSubmittedEnabled: boolean = true;
      const isBlockingNoLicenceHolderEnabled: boolean = true;

      try {
        isBlocking3CEnabled = await getBlockingStatus(ValidationRules.THREE_C);
        isBlocking3DEnabled = await getBlockingStatus(ValidationRules.THREE_D);
        isBlocking4AEnabled = await getBlockingStatus(ValidationRules.FOUR_A);
      } catch (e) {
        logger.error(`[GETTING-BLOCKING-STATUS-CC][ERROR][${e.stack || e}]`);
        throw new Error(e?.message);
      }

      const isCatchCertBlockOn = isBlocking3CEnabled || isBlocking3DEnabled || isBlocking4AEnabled || isBlockingNoDataSubmittedEnabled || isBlockingNoLicenceHolderEnabled;
      const validationFilteringSvc = new ValidationFilterService();

      const result: IExportCertificateResults = {
        report: validationFilteringSvc.filterOnlineValidationReport(isBlocking3CEnabled, isBlocking3DEnabled, isBlocking4AEnabled, isBlockingNoDataSubmittedEnabled, isBlockingNoLicenceHolderEnabled, onlineValidationReport),
        isBlockingEnabled: isCatchCertBlockOn,
        documentNumber: documentNumber,
        uri: ""
      };
      logger.info(`[ONLINE-VALIDATION-REPORT][${documentNumber}][${JSON.stringify(result.report)}]`);
      if ((result.report.length == 0 && isCatchCertBlockOn) || !isCatchCertBlockOn) {
        const storageInfo = await pdfService.generatePdfAndUpload(
          BLOB_STORAGE_CONTAINER_NAME,
          pdfService.pdfType.EXPORT_CERT,
          {
            exporter: exporterModel,
            exportPayload: exportPayload,
            transport: catchCertificate.transport,
            documentNumber: documentNumber,
            status: STATUS_COMPLETE,
            conservation: conservationData
          },
          !ApplicationConfig._enablePdfGen,
          {
            getStream: pdfService.getAzureBlobStream
          },
          documentNumber
        );

        await CatchCertService.completeDraft(userPrincipal, documentNumber, storageInfo.uri, email, contactId);
        await clearSessionDataForCurrentJourney(userPrincipal, documentNumber, contactId)
          .catch(e => { logger.error(`[CLEAR-SESSION-DATA][ERROR][${e}]`) });
        const data = {
          "certNumber": documentNumber,
          "timestamp": new Date().toISOString().toString(),
          "status": "COMPLETE"
        };

        const agent = new https.Agent({
          secureOptions: SSL_OP_LEGACY_SERVER_CONNECT
        });

        const config = {
          headers: {
            'X-API-KEY': ApplicationConfig._businessContinuityKey,
            'accept': 'application/json'
          },
          httpsAgent: agent
        };

        axios.put(`${ApplicationConfig._businessContinuityUrl}/api/certificates/${documentNumber}`, data, config)
          .then(() => logger.info(`Submit Data for ${documentNumber} sent to BC server`))
          .catch(err => logger.error(`Submit Error - Data for ${documentNumber} not sent to BC server: ${err}`));
        updateConsolidateLandings(documentNumber)
          .catch(e => logger.error(`[LANDING-CONSOLIDATION][${documentNumber}][ERROR][${e}]`));
        result.documentNumber = documentNumber;
        result.uri = storageInfo.uri;

        logger.info(`[EXPORT-PAYLOAD-SERVICE][CREATE-EXPORT-CERTIFICATE] Returning ${JSON.stringify(result)}`);
      } else if (offlineValidation) {
        await ExportPayloadService.updateCertificateStatus(userPrincipal, documentNumber, contactId, DocumentStatuses.Draft)
          .then(() => {
            logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][UPDATED-STATUS][${DocumentStatuses.Draft}]`);
            SummaryErrorsService.saveErrors(documentNumber, toFrontEndValidationFailure(result))
              .catch((e) => { logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SAVE-ERRORS], ${e}`) });
          })
          .catch((e) => { logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][UPDATE-STATUS][${DocumentStatuses.Draft}][ERROR], ${e}`) });
      }

      const reportUrl = '/v1/catchcertificates/data-hub/submit';
      await reportDocumentSubmitted(reportUrl, certificateData.rawData)
        .catch(e => logger.error(`[REPORT-CC-DOCUMENT-SUBMIT][${documentNumber}][ERROR][${e}]`));

      return result;
    } catch (e) {
      logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][ERROR][${e.stack || e}]`);
      await ExportPayloadService.saveSystemError(userPrincipal, documentNumber, contactId);
      throw new Error(e.message);
    }
  }

  static readonly awaitValueOrEmpty = async (functionCall: any) => {
    return await functionCall || {}
  }

  public static async getItemByProductId(userPrincipal: string, productId: string, documentNumber: string, contactId: string): Promise<any> {
    const exportPayload: any = await CatchCertService.getExportPayload(userPrincipal, documentNumber, contactId) as any || {};

    if (exportPayload?.items) {
      const item = exportPayload.items
        .map(_item => _item.product)
        .find(_item => _item.id === productId);

      if (item) {
        return item;
      }
    }

    throw new Error(`[PRODUCT-NOT-FOUND][PRODUCT-ID:${productId}]`);
  }

  public static async getCertificateHash(userPrincipal: string, documentNumber: string, contactId: string): Promise<string> {
    return crypto.createHash('sha1')
      .update(JSON.stringify(await ExportPayloadService.get(userPrincipal, documentNumber, contactId)))
      .digest('base64');
  }

  public static getLandingsToRefresh(items: ProductLanded[]): LandingsRefreshData[] {
    const result = new Map();
    const isLegallyDueDictionary: LandingsRefreshData[] = [];

    items
      .filter((item: ProductLanded) => item.landings)
      .forEach((item: ProductLanded) =>
        VesselLandingsRefresher.getLandingsRefreshData(item.landings)
          .forEach(refreshData => {
            result.set(`${refreshData.pln}-${refreshData.dateLanded}`, refreshData);
            isLegallyDueDictionary.push(refreshData);
          })
      );

    return [...result.values()]
      .map((refreshLanding: LandingsRefreshData) => ({
        dateLanded: refreshLanding.dateLanded,
        pln: refreshLanding.pln,
        isLegallyDue: isLegallyDueDictionary
          .filter((isLegallyDueEntry: LandingsRefreshData) => refreshLanding.dateLanded === isLegallyDueEntry.dateLanded && refreshLanding.pln === isLegallyDueEntry.pln)
          .some((isLegallyDueEntry: LandingsRefreshData) => isLegallyDueEntry.isLegallyDue)
      }))
  }

  public static async performSerialRefresh(documentNumber: string, items: ProductLanded[]): Promise<void> {
    const landingsToRefresh: LandingsRefreshData[] = this.getLandingsToRefresh(items);

    for (const landing of landingsToRefresh) {
      logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][REFRESHING-LANDING-SERIAL][PLN: ${landing.pln}, DATE: ${landing.dateLanded}, IS-LEGALLY-DUE: ${landing.isLegallyDue}]`);
      await VesselLandingsRefresher.refresh(landing);
    }
  }

  public static async performParallelRefresh(documentNumber: string, items: ProductLanded[]): Promise<void> {
    const landingsToRefresh: LandingsRefreshData[] = this.getLandingsToRefresh(items);

    await Promise.all(
      landingsToRefresh.map((landing: LandingsRefreshData) => {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: ${landing.pln}, DATE: ${landing.dateLanded}, IS-LEGALLY-DUE: ${landing.isLegallyDue}]`);
        return VesselLandingsRefresher.refresh(landing);
      })
    );
  }

  public static async saveSystemError(userPrincipal: string, documentNumber: string, contactId: string): Promise<void> {
    const systemFailure: SystemFailure = {
      error: SYSTEM_ERROR
    };

    await CatchCertService.updateCertificateStatus(userPrincipal, documentNumber, contactId, DocumentStatuses.Draft)
      .then(() => { logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][UPDATED-STATUS][${DocumentStatuses.Draft}]`) })
      .catch(e => { logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][UPDATE-STATUS][${DocumentStatuses.Draft}][ERROR], ${e}`) });

    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemFailure, contactId)
      .catch(e => { logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SAVE-ERRORS], ${e}`) });
  }
}
