import * as Hapi from '@hapi/hapi';
import logger from '../logger';
import DocumentNumberService from '../services/documentNumber.service';
import { DOCUMENT_NUMBER_KEY } from '../session_store/constants';

import {
  getAllCatchCertsForUserByYearAndMonth,
  getDraftCatchCertHeadersForUser
} from '../persistence/services/catchCert';
import {
  getAllProcessingStatementsForUserByYearAndMonth,
  getDraftDocumentHeaders as getDraftProcessingStatementsForUser
} from '../persistence/services/processingStatement';
import { getAllStorageDocsForUserByYearAndMonth, getDraftDocumentHeaders as getDraftStorageDocumentsForUser } from '../persistence/services/storageDoc';
import * as CatchCertService from '../persistence/services/catchCert'
import * as ProcessingStatementService from '../persistence/services/processingStatement'
import * as StorageDocumentService from '../persistence/services/storageDoc'
import * as ReferenceDataService from '../services/reference-data.service'

import { catchCerts, storageNote, processingStatement } from '../services/documentNumber.service';
import { userCanCreateDraft } from "../validators/draftCreationValidator";
import { AllDocuments, DocumentsCompleted, DocumentsInProgress, HapiRequestApplicationStateExtended } from '../types';


export default class DocumentController {

  public static async createDraft(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const app = req.app as HapiRequestApplicationStateExtended;
    const userId : string = app.claims.sub;
    const contactId: string = app.claims.contactId;
    const email: string = app.claims.email;
    const roles: string[] = app.claims.roles;
    const fesApi: boolean = app.claims.fesApi;
    const requestByAdmin: boolean = isRequestByAdmin(roles);

    const documentType: string = req.params.documentType;
    logger.info(`[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][${requestByAdmin}]`);
    return await userCanCreateDraft(userId, documentType, contactId).then(async canCreateDraft => {
      if (canCreateDraft) {
        switch(documentType) {
          case "catchCertificate" :
            return createCatchCertificateDraft(userId, email, requestByAdmin, contactId, fesApi, req, h);
          case "storageDocument":
          case "storageNotes":
            return createStorageDocumentDraft(userId, email, requestByAdmin, contactId, fesApi, req, h);
          case "processingStatement":
            return createProcessingStatementDraft(userId, email, requestByAdmin, contactId, fesApi, req, h);
        }
      }

      return h.response('unauthorised').code(403);
    }).catch(error => {
      logger.error(`[ORCHESTRATOR][CREATING-DRAFT][ERROR][${error.stack || error}]`);
      return h.response('error').code(500)
    });
  }

  public static async getDocumentFromRedis(req: Hapi.Request): Promise<DocumentsInProgress> {
    const app = req.app as HapiRequestApplicationStateExtended;
    logger.info({ userPrincipal: app.claims.sub }, 'Received a request to get a document');
    const userPrincipal = app.claims.sub;
    const contactId = app.claims.contactId;
    const documentKey = req.query.service + '/' + DOCUMENT_NUMBER_KEY;

    return await DocumentNumberService.getDraftDocuments(userPrincipal, documentKey, contactId);
  }

  public static async getDocument(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const app = req.app as HapiRequestApplicationStateExtended;
    const userPrincipal = app.claims.sub;
    const contactId = app.claims.contactId;
    const { documentNumber } = req.params;
    const document = await DocumentNumberService.getDocument(documentNumber, userPrincipal, contactId);

    return document ? h.response(document) : h.response().code(404);
  }

  public static async getDocumentPdf(documentNumber: string, userPrincipal: string, contactId: string): Promise<{ documentNumber: string, uri: string, status: string }> {
    const document = await DocumentNumberService.getDocument(documentNumber, userPrincipal, contactId);
    return document ? {
      documentNumber: document.documentNumber,
      uri: document.documentUri,
      status: document.documentStatus
    } : null;
  }

  public static async getAllDocuments(req: Hapi.Request): Promise<AllDocuments> {
    try {
      const monthAndYear = `${req.params.month}-${req.params.year}`;
      let inProgress: DocumentsInProgress;
      let completed: DocumentsCompleted;
      const app = req.app as HapiRequestApplicationStateExtended;
      const userPrincipal = app.claims.sub;
      const contactId = app.claims.contactId;

      switch (req.query.type) {
        case catchCerts:
          inProgress = await getDraftCatchCertHeadersForUser(userPrincipal, contactId);
          completed = await getAllCatchCertsForUserByYearAndMonth(monthAndYear, userPrincipal, contactId);
          break;
        case processingStatement:
          inProgress = await getDraftProcessingStatementsForUser(userPrincipal, contactId);
          completed = await getAllProcessingStatementsForUserByYearAndMonth(monthAndYear, userPrincipal, contactId);
          break;
        case storageNote:
          inProgress = await getDraftStorageDocumentsForUser(userPrincipal, contactId);
          completed = await getAllStorageDocsForUserByYearAndMonth(monthAndYear, userPrincipal, contactId);
          break;
        default:
          inProgress = [];
          completed = [];
      }

      return {
        inProgress,
        completed
      };
    } catch (e) {
      // error should be handled gracefully!
      logger.error(e);
      // TODO: may be we just rethrow this as an error, in FE you can take them to a separate page to handle all the errors other than 400
      // return res().code(500);
      return {
        inProgress: [],
        completed: []
      };
    }
  }

  public static async getAllCompletedDocuments(
    req: Hapi.Request
  ): Promise<any> {
    const userPrincipal = <string>(req as any).app.claims.sub;
    const contactId = <string>(req as any).app.claims.contactId;
    const documentType = <string>req.params.documentType;
    const pageNumber = req.query.pageNumber ?? 1;
    const pageLimit = req.query.pageLimit ?? 50;

    const docCount = await DocumentNumberService.countDocuments(
      documentType,
      userPrincipal,
      contactId
    );
    const documents = await DocumentNumberService.getCompletedDocuments(
      documentType,
      userPrincipal,
      contactId,
      +pageNumber,
      +pageLimit
    );

    const data = documents.map((x) => {
      return {
        documentNumber: x.documentNumber,
        status: x.status,
        documentUri: x.documentUri,
        createdAt: x.createdAt,
        userReference: x.userReference,
      };
    });

    return {
      pageNumber: parseInt(pageNumber),
      pageLimit: parseInt(pageLimit),
      totalPages: Math.ceil(docCount / pageLimit),
      totalRecords: docCount,
      data,
    };
  }
}

const isRequestByAdmin = (roles) =>  roles ?
    roles.includes('MMO-ECC-Service-Management')
    || roles.includes('MMO-ECC-Support-User')
    || roles.includes('MMO-ECC-IUU-Single-Liaison-Officer')
    || roles.includes('MMO-ECC-Regulatory-User') : false;

const returnDraft = (fesApi: boolean, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, documentNumber: string, req: Hapi.Request) => {
  if (fesApi || (req.payload as any).mmov2) {
    return h.response(documentNumber);
  }

  return h.redirect((req.payload as any).nextUri.replace('{documentNumber}', documentNumber));
}

const createCatchCertificateDraft = async (
  userId: string,
  email: string,
  requestByAdmin: boolean,
  contactId: string,
  fesApi: boolean,
  req: Hapi.Request,
  h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
) => {
  return await CatchCertService.createDraft(userId, email, requestByAdmin, contactId)
    .then(async (documentNumber) => {
      await ReferenceDataService.reportDraftCreated(documentNumber)
        .catch(e => logger.error(`[REPORT-CC-DOCUMENT-DRAFT][${documentNumber}][ERROR][${e}]`));

      logger.info(`[ORCHESTRATOR][CREATING-CC-DRAFT][SUCCESS]`);
      if(fesApi || (req.payload as any).mmov2) {
        return h.response(documentNumber);
      }
      return h.redirect((req.payload as any).nextUri.replace('{documentNumber}', documentNumber));
    })
    .catch(error => {
      logger.error(`[ORCHESTRATOR][CREATING-CC-DRAFT][ERROR][${error.stack || error}]`);
      return h.response('error').code(500)
    });
}

const createProcessingStatementDraft = async (
  userId: string,
  email: string,
  requestByAdmin: boolean,
  contactId: string,
  fesApi: boolean,
  req: Hapi.Request,
  h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
) => {
  return await ProcessingStatementService.createDraft(userId, email, requestByAdmin, contactId)
    .then(async (documentNumber) => {
        await ReferenceDataService.reportDraftCreated(documentNumber)
          .catch(e => logger.error(`[REPORT-PS-DOCUMENT-DRAFT][${documentNumber}][ERROR][${e}]`));

      logger.info(`[ORCHESTRATOR][CREATING-PS-DRAFT][SUCCESS]`);
      if(fesApi || (req.payload as any).mmov2) {
        return h.response(documentNumber);
      }
      return h.redirect((req.payload as any).nextUri.replace('{documentNumber}', documentNumber));
    }).catch(error => {
      logger.error(`[ORCHESTRATOR][CREATING-PS-DRAFT][ERROR][${error.stack || error}]`);
      return h.response('error').code(500)
    });
}

const createStorageDocumentDraft = async (
  userId: string,
  email: string,
  requestByAdmin: boolean,
  contactId: string,
  fesApi: boolean,
  req: Hapi.Request,
  h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
) => {
  return await StorageDocumentService.createDraft(userId, email, requestByAdmin, contactId)
    .then(async documentNumber => {
        await ReferenceDataService.reportDraftCreated(documentNumber)
          .catch(e => logger.error(`[REPORT-SD-DOCUMENT-DRAFT][${documentNumber}][ERROR][${e}]`));

      logger.info(`[ORCHESTRATOR][CREATING-SD-DRAFT][SUCCESS]`);
      return returnDraft(fesApi, h, documentNumber, req);
    }).catch(error => {
      logger.error(`[ORCHESTRATOR][CREATING-SD-DRAFT][ERROR][${error.stack || error}]`);
      return h.response('error').code(500)
    });
}