// Force rebuild
import * as Hapi from "@hapi/hapi";
import axios from "axios";
import acceptsHtml from "../helpers/acceptsHtml";
import acceptsSortSite from "../helpers/acceptsSortSite";
import { pathToRegexp } from 'path-to-regexp';
import * as pdfService from 'mmo-ecc-pdf-svc';
import {
  BLOB_STORAGE_CONTAINER_NAME,
  JOURNEY,
  PROTECTIVE_MONITORING_PRIORITY_NORMAL,
  PROTECTIVE_MONITORING_COMPLETED_TRANSACTION,
} from "./constants";
import { SessionStoreFactory } from "../session_store/factory";
import { getRedisOptions } from "../session_store/redis";
import { isArray } from "util";
import * as moment from "moment";
import ApplicationConfig from "../applicationConfig";
import SaveAsDraftService from "../services/saveAsDraft.service";
import DocumentNumberService from "../services/documentNumber.service";
import { postEventData } from "../services/protective-monitoring.service";
import { getBlockingStatus } from "../persistence/services/systemBlock";
import { ValidationRules } from "../persistence/schema/systemBlock";
import logger from "../logger";
import { IForeignCatchCert } from "../persistence/schema/foreignCatchCert";
import * as ProcessingStatementService from "../persistence/services/processingStatement";
import * as StorageDocumentService from "../persistence/services/storageDoc";
import {
  toFrontEndProcessingStatementExportData,
  addTotalWeightLandedProcessingStatement
} from "../persistence/schema/processingStatement";
import { toFrontEndPsAndSdExporterDetails } from "../persistence/schema/frontEndModels/exporterDetails";
import {
  ProcessingStatement,
  toBackEndProcessingStatementExportData
} from "../persistence/schema/frontEndModels/processingStatement";
import { clearSessionDataForCurrentJourney } from "../helpers/sessionManager";
import {
  sdDataToSave,
  StorageDocument,
} from "../persistence/schema/frontEndModels/storageDocument";
import { toFrontEndStorageDocumentExportData } from "../persistence/schema/storageDoc";
import { reportDocumentSubmitted } from "../services/reference-data.service";
import { invalidateDraftCache } from '../persistence/services/catchCert'
import { validateCompletedDocument, validateSpecies } from "../validators/documentValidator";

export const catchCerts: string = "catchCertificate";
export const storageNote: string = "storageNotes";
export const processingStatement: string = "processingStatement";
import { SSL_OP_LEGACY_SERVER_CONNECT } from "constants";

const { unflatten } = require("flat");
const flatten = require("flat");
const _ = require("lodash");
const https = require('https');

export default class OrchestrationService {
  public static async get(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const redisKey = req.params.redisKey;

    const response = await OrchestrationService.getFromMongo(
      userPrincipal,
      documentNumber,
      redisKey,
      contactId
    );

    return response;
  }

  public static async getFromMongo(
    userPrincipal: string,
    documentNumber: string,
    redisKey: string,
    contactId: string
  ) {
    let data: any = {};

    if (redisKey === processingStatement) {
      const currentSessionData = await ProcessingStatementService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );

      if (Array.isArray(currentSessionData?.exportData?.catches) && currentSessionData.exportData.catches.length > 0) {
        const updatedCatches = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, currentSessionData.exportData.catches);
        data = toFrontEndProcessingStatementExportData({
          ...currentSessionData.exportData,
          catches: updatedCatches
        });
      } else {
        data = currentSessionData
          ? toFrontEndProcessingStatementExportData(currentSessionData.exportData)
          : currentSessionData;
      }
    } else if (redisKey === storageNote) {
      const currentSessionData = await StorageDocumentService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );

      data = currentSessionData
        ? toFrontEndStorageDocumentExportData(currentSessionData.exportData)
        : currentSessionData;
    }

    if (data === null) {
      data = initialState[redisKey] || {};
    }

    return data;
  }

  public static async back(req, h) {
    const nextUrl = req.query.c || req.query.n;
    const contactId = req.app.claims.contactId;
    const userPrincipal = req.app.claims.sub;
    const redisKey = req.params.redisKey;
    const sessionStore = await SessionStoreFactory.getSessionStore(
      getRedisOptions()
    );
    const data = (await sessionStore.readAllFor(
      userPrincipal,
      contactId,
      redisKey
    )) as any;
    delete data.errors;
    await sessionStore.writeAllFor(userPrincipal, contactId, redisKey, data);
    if (acceptsHtml(req.headers)) {
      return h.redirect(nextUrl);
    }
    return data;
  }

  public static async saveAndValidate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = req.payload;
    const nextUrl = req.query.n;
    const saveAsDraftUrl = req.query.saveAsDraftUrl;
    const currentUrl = req.query.c;
    let saveToRedisIfErrors = false;

    if (req.query.saveToRedisIfErrors) {
      saveToRedisIfErrors = OrchestrationService.checkSaveToRedis(req);
    }

    const setOnValidationSuccess = req.query.setOnValidationSuccess;
    const redisKey = req.params.redisKey;
    const sessionStore = await SessionStoreFactory.getSessionStore(
      getRedisOptions()
    );
    const sessionData: any = await OrchestrationService.getSessionData(redisKey, userPrincipal, documentNumber, contactId, sessionStore);

    const originalSessionData = _.cloneDeep(sessionData);

    let data = payload as any;
    if (acceptsHtml(req.headers)) {
      // for nojs parse input params
      data = unflatten({ ...flatten(sessionData), ...data });
    }

    delete data.errors;
    delete data.errorsUrl;

    if (redisKey === processingStatement && Array.isArray(data.catches)) {
      data.catches = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, data.catches);
    }

    const handler = findHandler(currentUrl);
    const result = await handler?.exec({
      data,
      nextUrl,
      currentUrl,
      params: handler.params,
      errors: {},
      documentNumber,
      userPrincipal,
      contactId
    }) || { errors: {} };

    let { next = null } = result;
    const { errors } = result;
    const urlsObj = {
      currentUrl,
      nextUrl
    }
    next = OrchestrationService.handleErrors(errors, data, documentNumber, originalSessionData, next, urlsObj, setOnValidationSuccess);

    const dataToSave: any = OrchestrationService.getDataToSave(
      saveToRedisIfErrors,
      data,
      req,
      redisKey,
      sessionData,
      documentNumber,
      originalSessionData
    );

    await OrchestrationService.updateDraftData(redisKey, userPrincipal, documentNumber, dataToSave, contactId, sessionStore);

    if (acceptsHtml(req.headers) || acceptsSortSite(req.headers)) {
      if (saveAsDraftUrl && _.isEmpty(errors)) {
        return h.redirect(saveAsDraftUrl);
      }
      return h.redirect(next);
    }

    if ((saveToRedisIfErrors && data.errors) || !data.errors) {
      return data;
    } else {
      return originalSessionData;
    }
  }

  static readonly checkSaveToRedis = (req: Hapi.Request) => (req.query.saveToRedisIfErrors &&
    req.query.saveToRedisIfErrors === "true") || false;

  static readonly getSessionData = async (redisKey: string, userPrincipal: string, documentNumber: string, contactId: string, sessionStore) => {
    let sessionData: any = {};
    if (redisKey === processingStatement) {
      sessionData = await ProcessingStatementService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );
    } else if (redisKey === storageNote) {
      sessionData = await StorageDocumentService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );
    } else {
      sessionData = await sessionStore.readAllFor(userPrincipal, contactId, redisKey);
    }
    if (!sessionData) sessionData = initialState[redisKey] || {};
    return sessionData;
  }

  static readonly handleErrors = (errors, data, documentNumber: string, originalSessionData, next, urlsObj, setOnValidationSuccess) => {
    if (!_.isEmpty(errors)) {
      data.errors = errors;
      data.errorsUrl = urlsObj.currentUrl.replace(":documentNumber", documentNumber);

      originalSessionData.errors = errors;
      originalSessionData.errorsUrl = urlsObj.currentUrl.replace(
        ":documentNumber",
        documentNumber
      );

      // default to set next url to be current url if errors
      if (!next) next = urlsObj.currentUrl;
    } else {
      if (!next) next = urlsObj.nextUrl;

      if (setOnValidationSuccess) {
        data[setOnValidationSuccess] = true;
      }
      delete data.errors;
      delete data.errorsUrl;
    }
    return next;
  }

  static readonly getDataToSave = (
    saveToRedisIfErrors: boolean,
    data,
    req: Hapi.Request,
    redisKey: string,
    sessionData,
    documentNumber: string,
    originalSessionData
  ) => {
    let dataToSave: any = {};
    if (
      (saveToRedisIfErrors && data.errors) ||
      !data.errors ||
      acceptsHtml(req.headers)
    ) {
      if (redisKey === processingStatement) {
        dataToSave = toBackEndProcessingStatementExportData(
          data as ProcessingStatement,
          toFrontEndPsAndSdExporterDetails(
            sessionData?.exportData?.exporterDetails,
            true
          ),
          documentNumber
        );
      } else if (redisKey === storageNote) {
        dataToSave = sdDataToSave(
          data as StorageDocument,
          sessionData.exportData
        );
      } else {
        dataToSave = data;
      }
    } else {
      dataToSave = originalSessionData.exportData;
    }
    return dataToSave;
  }

  static readonly updateDraftData = async (redisKey: string, userPrincipal: string, documentNumber: string, dataToSave, contactId: string, sessionStore) => {
    if (redisKey === processingStatement) {
      await ProcessingStatementService.upsertDraftData(
        userPrincipal,
        documentNumber,
        {
          $set: {
            exportData: dataToSave,
          },
        },
        contactId
      );
    } else if (redisKey === storageNote) {
      await StorageDocumentService.upsertDraftData(
        userPrincipal,
        documentNumber,
        {
          $set: {
            exportData: dataToSave,
          },
        },
        contactId
      );
    } else {
      await sessionStore.writeAllFor(userPrincipal, contactId, redisKey, dataToSave);
    }
  }

  public static async generatePdf(req, h, userPrincipal, documentNumber) {
    const nextUrl = req.query.n;
    const contactId = req.app.claims.contactId;
    const redisKey = req.params.redisKey;
    const clientip = req.payload.data;
    const reportData = await loadRequiredData(
      userPrincipal,
      documentNumber,
      redisKey,
      contactId
    );
    let blockingStatus: boolean = false;
    const { data, exporter }: any = reportData;
    let exporterModel = {};
    if (exporter?.model) {
      exporterModel = exporter.model;
    }
    data.exporter = exporterModel;
    data.documentNumber = documentNumber;
    const user = {
      email: req.app.claims.email,
      principal: req.app.claims.sub,
    };
    data.user = user;

    await invalidateDraftCache(userPrincipal, documentNumber, contactId);

    switch (redisKey) {
      case processingStatement:
        await OrchestrationService.checkValidationProcessingStatement(data, userPrincipal, contactId, documentNumber);
        break;
      case storageNote:
        await OrchestrationService.checkValidationStorageNotes(data, userPrincipal, contactId, documentNumber);
        break;
    }

    logger.info(`[DOCUMENT-NUMBER: ${documentNumber}][PS-SD-CHECKING-ERRORS]${JSON.stringify(data.validationErrors)}`);

    if (checkValidationErrors(data.validationErrors)) {
      if (acceptsHtml(req.headers)) {
        return h.redirect(`create-processing-statement/${documentNumber}/check-your-information`);
      }
      return h.response(data).code(400);
    }

    try {
      blockingStatus = await getBlockingStatus(ValidationRules.FOUR_B);
    } catch (e) {
      logger.error(`[GETTING-BLOCKING-STATUS-PSSD][ERROR][${e.stack || e}]`);
    }

    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    const base = `${baseUrl}/v1/sdps/validation/online`;
    const validationStatus: any = await OrchestrationService.checkCertificate(
      data,
      base,
      h
    );
    const reportUrl = "/v1/sdps/data-hub/submit";

    if (validationStatus.isValid === false && blockingStatus) {
      data.documentUri = 'N/A';
      void reportDocumentSubmitted(reportUrl, validationStatus.rawData).catch(
        (e) =>
          logger.error(
            `[REPORT-SD-PS-DOCUMENT-SUBMIT][${documentNumber}][ERROR][${e}]`
          )
      );

      if (acceptsHtml(req.headers)) {
        return h.redirect(`${req.query.c}`);
      }
      return h.response(validationStatus.details).code(400);
    } else {
      const pdfType = {
        storageNotes: 'Storage Note',
        processingStatement: 'Processing Statement',
      };

      const pdfId = pdfType[redisKey];
      if (!pdfId) {
        return { error: `unsupported ${redisKey}` };
      }

      const pdf = await OrchestrationService.createPdfAndProcess(pdfId, data, documentNumber, {
        redisKey,
        userPrincipal,
        user,
        contactId,
        clientip,
        req,
        h,
        validationStatus,
        reportUrl
      });

      const uri = encodeURIComponent(pdf.uri);
      return getRedirectionData(req, h.redirect(`${nextUrl}?uri=${uri}&documentNumber=${documentNumber}`), { uri: pdf.uri, documentNumber });
    }
  }

  private static async createPdfAndProcess(pdfId: string, data: any, documentNumber: string, options: {
    redisKey: string,
    userPrincipal: string,
    user: any,
    contactId: string,
    clientip: any,
    req: any,
    h: any,
    validationStatus: any,
    reportUrl: string
  }) {
    const { redisKey, userPrincipal, user, contactId, clientip, req, validationStatus, reportUrl } = options;

    const pdf = await pdfService.generatePdfAndUpload(
      BLOB_STORAGE_CONTAINER_NAME,
      pdfId,
      data,
      !ApplicationConfig._enablePdfGen,
      { getStream: pdfService.getAzureBlobStream },
      documentNumber
    );

    await OrchestrationService.clearDataFromJourney(redisKey, userPrincipal, documentNumber, pdf, user, contactId);

    void invalidateDraftCache(userPrincipal, documentNumber, contactId);
    await SaveAsDraftService.deleteDraftLink(userPrincipal, documentNumber, redisKey, contactId);

    data.documentUri = pdf.uri;

    const message = `User successfully created a ${JOURNEY[redisKey]}`;
    const monitoringInfo = `completed/${JOURNEY[redisKey]}/dn:${documentNumber}`;
    const priority = PROTECTIVE_MONITORING_PRIORITY_NORMAL;
    const sessionId = `${req.app.claims.auth_time}:${req.app.claims.contactId}`;
    const transaction = `${PROTECTIVE_MONITORING_COMPLETED_TRANSACTION}-${DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)}`;

    await postEventData(userPrincipal, message, monitoringInfo, clientip, priority, sessionId, transaction).catch((error) => `post monitoring event data error: ${error}`);

    // axios put to BC service.
    OrchestrationService.sendBusinessContinuityEvent(documentNumber);

    void reportDocumentSubmitted(reportUrl, validationStatus.rawData).catch((e) => logger.error(`[REPORT-SD-PS-DOCUMENT-SUBMIT][${documentNumber}][ERROR][${e}]`));

    return pdf;
  }

  private static sendBusinessContinuityEvent(documentNumber: string) {
    const payload = {
      certNumber: documentNumber,
      timestamp: new Date().toISOString().toString(),
      status: 'COMPLETE',
    };

    const agent = new https.Agent({ secureOptions: SSL_OP_LEGACY_SERVER_CONNECT });
    const config = { headers: { 'X-API-KEY': ApplicationConfig._businessContinuityKey, accept: 'application/json' }, httpsAgent: agent };

    axios.put(`${ApplicationConfig._businessContinuityUrl}/api/certificates/${documentNumber}`, payload, config)
      .then(() => logger.info(`Submit Data for ${documentNumber} sent to BC server`))
      .catch((err) => logger.error(`Submit Error - Data for ${documentNumber} not sent to BC server: ${err}`));
  }

  static readonly checkValidationStorageNotes = async (data, userPrincipal: string, contactId: string, documentNumber: string) => {
    for (const ctch in data.catches) {
      const documentCertificateNumber = data.catches[ctch].certificateNumber;
      const species = data.catches[ctch].product;
      const speciesCode = null;
      if (data.catches[ctch].certificateType === 'uk' && (!await validateCompletedDocument(documentCertificateNumber, userPrincipal, contactId, documentNumber))) {
        data.validationErrors.push({
          message: 'sdAddCatchDetailsErrorUKDocumentInvalid',
          key: `catches-${ctch}-certificateNumber`,
          certificateNumber: documentCertificateNumber,
          product: species
        });
      } else if (data.catches[ctch].certificateType === 'uk' && !await validateSpecies(documentCertificateNumber, species, speciesCode, userPrincipal, contactId, documentNumber)) {
        data.validationErrors.push({
          message: 'sdAddUKEntryDocumentSpeciesDoesNotExistError',
          key: `catches-${ctch}-certificateNumber`,
          certificateNumber: documentCertificateNumber,
          product: species
        });
      }
    }
  }

  static readonly checkValidationProcessingStatement = async (data, userPrincipal: string, contactId: string, documentNumber: string) => {
    for (const ctch in data.catches) {
      const documentCertificateNumber = data.catches[ctch].catchCertificateNumber;
      const species = data.catches[ctch].species;
      const speciesCode = data.catches[ctch].speciesCode;
      if (data.catches[ctch].catchCertificateType === 'uk' && (!await validateCompletedDocument(documentCertificateNumber, userPrincipal, contactId, documentNumber) || !await validateSpecies(documentCertificateNumber, species, speciesCode, userPrincipal, contactId, documentNumber))) {
        data.validationErrors.push({
          message: 'psAddCatchDetailsErrorUKCCInValid',
          key: `catches-${ctch}-catchCertificateNumber`
        })
      }
    }
  }

  static readonly clearDataFromJourney = async (redisKey: string, userPrincipal: string, documentNumber: string, pdf, user, contactId: string) => {
    switch (redisKey) {
      case processingStatement: {
        await clearSessionDataForCurrentJourney(
          userPrincipal,
          documentNumber,
          contactId
        );
        await ProcessingStatementService.completeDraft(
          documentNumber,
          pdf.uri,
          user.email
        );
        break;
      }
      case storageNote:
        await clearSessionDataForCurrentJourney(
          userPrincipal,
          documentNumber,
          contactId
        );
        await StorageDocumentService.completeDraft(
          documentNumber,
          pdf.uri,
          user.email
        );
        break;
    }
  }


  public static async checkCertificate(
    payloadToValidate,
    url,
    _h
  ): Promise<IForeignCatchCert> {
    try {
      const payload = {
        dataToValidate: payloadToValidate,
      };
      const res: any = await axios.post(url, payload);
      const onlineValidationReport: IForeignCatchCert = res.data;
      logger.info(`[ORCHESTRATOR-SERVICE][CHECK-PSSD][SUCCESS]${JSON.stringify(onlineValidationReport)}`);
      return onlineValidationReport;
    } catch (e) {
      logger.error(`[ORCHESTRATOR-SERVICE][CHECK-PSSD][ERROR][${e.stack || e}]`);
      throw new Error(e);
    }
  }

  public static async removeKey(req, h) {
    const nextUrl = req.query.c || req.query.n;
    const contactId = req.app.claims.contactId;
    const userPrincipal = req.app.claims.sub;
    const redisKey = req.params.redisKey;
    const key = req.query.key;
    const payload = req.payload;

    const sessionStore = await SessionStoreFactory.getSessionStore(
      getRedisOptions()
    );
    let data = (await sessionStore.readAllFor(userPrincipal, contactId, redisKey)) as any;
    if (!data) data = initialState[redisKey];
    data = { ...data, ...unflatten(payload) };

    const newData: any = {};
    const flattendData = flatten(data);
    Object.keys(flattendData).forEach((k) => {
      if (!k.startsWith(key)) {
        newData[k] = flattendData[k];
      }
    });
    data = unflatten(newData);

    // remove any empty elements from arrays
    Object.keys(data).forEach((k) => {
      if (isArray(data[k])) data[k] = data[k].filter((d) => d);
    });

    delete data.errors;
    delete data.errorsUrl;
    await sessionStore.writeAllFor(userPrincipal, contactId, redisKey, data);

    if (acceptsHtml(req.headers)) {
      return h.redirect(`${nextUrl}`);
    }

    return data;
  }
}

export const checkValidationErrors: (validationErrors: any[]) => boolean = (validationErrors: any[]) =>
  Array.isArray(validationErrors) && validationErrors.some((validationError: any) => !_.isEmpty(validationError));

export const getRedirectionData = (req, case1, case2) => acceptsHtml(req.headers) ? case1 : case2;

export const initialState = {
  ...require("./handlers/processing-statement").initialState,
  ...require("./handlers/storage-notes").initialState,
};

// create lookup of handlers
const handlers = {
  ...require("./handlers/processing-statement").default,
  ...require("./handlers/storage-notes").default,
  ...require("./handlers/home").default,
};

const handlersLookup = Object.keys(handlers).map((k) => {
  const keys = [];
  const regexPath = pathToRegexp(k, keys);
  return { regexPath, keys, handler: handlers[k] };
});

export const loadRequiredData = async (
  userPrincipal: string,
  documentNumber: string,
  redisKey: string,
  contactId: string
) => {
  switch (redisKey) {
    case processingStatement: {
      const draftData = await ProcessingStatementService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );

      const sessionData = toFrontEndProcessingStatementExportData(
        draftData.exportData
      );
      const exporterDetails = toFrontEndPsAndSdExporterDetails(
        draftData.exportData.exporterDetails
      );
      exporterDetails.model.journey = redisKey;
      return {
        data: sessionData,
        exporter: exporterDetails
      };
    }
    case storageNote: {
      const draftData = await StorageDocumentService.getDraft(
        userPrincipal,
        documentNumber,
        contactId
      );
      const sessionData = toFrontEndStorageDocumentExportData(
        draftData.exportData
      );
      const exporterDetails = toFrontEndPsAndSdExporterDetails(
        draftData.exportData.exporterDetails
      );
      exporterDetails.model.journey = redisKey;

      return {
        data: sessionData,
        exporter: exporterDetails,
      };
    }
  }
};

function findHandler(path) {
  for (const element of handlersLookup) {
    const { regexPath, keys, handler } = element;
    const res = regexPath.exec(path);
    if (!res) continue;

    const params = {};
    keys.forEach((k, index) => (params[k.name] = res[index + 1]));
    return { exec: handler, params };
  }

  return null;
}

export function today() {
  return moment().format("DD/MM/YYYY");
}

export function parseDate(date) {
  return moment(
    date,
    ["DD/MM/YYYY", "DD/M/YYYY", "D/MM/YYYY", "D/M/YYYY"],
    true
  );
}

export function cleanDate(toClean) {
  return parseDate(toClean).format("DD/MM/YYYY");
}

export function validateDate(date) {
  return moment(
    date,
    ["DD/MM/YYYY", "DD/M/YYYY", "D/MM/YYYY", "D/M/YYYY"],
    true
  ).isValid();
}

export function validateTodayOrInThePast(date) {
  return parseDate(date).isBefore(moment(new Date()));
}

export function validateDateBefore(date, beforeDate) {
  return parseDate(date).isBefore(parseDate(beforeDate));
}

export function validateMaximumFutureDate(date) {
  const maxSubmissionDate = moment(Date.now()).add(8, 'days');    // Todays date + 7 days advance as FI0-4667
  return parseDate(date).isBefore(maxSubmissionDate, 'day');
}

export function validateNumber(num) {
  return !isNaN(+num) && num.indexOf("e") === -1;
}

export function validatePositiveNumber(num) {
  return !isNaN(+num) && num.indexOf("e") === -1 && +num >= 0;
}

export function isPositiveNumberWithTwoDecimals(num) {
  const regex = /^(\d+(\.\d{0,2})?|\.?\d{1,2})$/;
  return !isNaN(+num) && +num >= 0 && regex.test(num);
}

export function isNotExceed12Digit(num) {
  return !isNaN(+num) && +num >= 0 && +num < 100000000000;
}

export function isPositiveWholeNumber(num) {
  return +num % 1 === 0 && +num >= 1;
}

export function numberAsString(toRound) {
  return `${toRound}`;
}

export function validateWhitespace(str) {
  const regex = /^\s*$/;
  return regex.test(str);
}

export function validateExportHealthCertificateFormat(str) {
  const regex = /^\d{2}\/\d\/\d{6}$/;
  return regex.test(str);
}

export const isInvalidLength = (
  str: string,
  minLength: number,
  maxLength: number
) => {
  const length = str.length;

  if (length < minLength || length > maxLength) {
    return true;
  }

  return false;
};

export const isNumbersOnly = (str: string) => {
  const regex = /^\d+$/;
  return regex.test(str);
};

export function validateCCNumberFormat(str: string) {
  const regex = /^[ A-Za-z0-9./\\-]*$/;
  return regex.test(str);
}

export function validateUKCCNumberFormat(str: string) {
  const regex = /^GBR-\d{4}-CC-[A-Z0-9]{9}$/;
  return regex.test(str);
}

export function validateUKDocumentNumberFormat(str: string) {
  const regex = /^GBR-\d{4}-(CC|PS|SD)-[A-Z0-9]{9}$/;
  return regex.test(str);
}

export function validateNonUKCCNumberCharLimit(str: string) {
  return str && str.length <= 52;
}

export const isPsPlantNameValid = (str: string) => {
  const regex = /^[ A-Za-z0-9-'’.,/\\&]*$/;
  return regex.test(str);
};

export const isApprovalNumberValid = (str: string) => {
  const regex = /^[ A-Za-z0-9-./]*$/;
  return regex.test(str);
}

export function validatePersonResponsibleForConsignmentFormat(str: string) {
  const regex = /^[ A-Za-z-'’]*$/;
  return regex.test(str);
}

export const isPlantApprovalNumberFormatValid = (str: string) => {
  const regex = /^[ A-Za-z0-9-,/\\:]*$/;
  return regex.test(str);
};

export const isPlaceProductEntersUkValid = (str: string) => {
  const regex = /^[ A-Za-z-,'()/\\;&]*$/;
  return regex.test(str);
}

export const validateProductDescriptions = (products: any[], consignmentDescription: string) => {
  if (consignmentDescription && !validateWhitespace(consignmentDescription) && !Array.isArray(products)) {
    return true;
  }

  return Array.isArray(products) && products.some(p => !validateWhitespace(p.description) || !validateWhitespace(p.commodityCode));
}

export function validateDateIsSameOrBefore(arrivalDate: string, transportDepartureDate: string): boolean {
  return parseDate(arrivalDate).isSameOrBefore(parseDate(transportDepartureDate), 'days');
}