import { IProcessingStatementModel, ProcessingStatementModel, ProcessingStatement, cloneProcessingStatement as clonePS } from '../schema/processingStatement';
import { Condition, StrictUpdateFilter } from 'mongodb';
import DocumentNumberService from "../../services/documentNumber.service";
import ManageCertsService from '../../services/manage-certs.service';
import ServiceNames from "../../validators/interfaces/service.name.enum";
import moment = require('moment');
import {
  Exporter,
  toBackEndPsAndSdExporterDetails,
  toFrontEndPsAndSdExporterDetails
} from "../schema/frontEndModels/exporterDetails";
import { ProcessingStatementDraft } from '../schema/frontEndModels/processingStatement';
import { ExportLocation } from "../schema/frontEndModels/export-location";
import { validateDocumentOwner } from '../../validators/documentOwnershipValidator';
import { constructOwnerQuery } from './catchCert';
import { DocumentStatuses } from '../schema/catchCert';

export const getDocument = async (
  documentNumber: string,
  userPrincipal: string,
  contactId: string
): Promise<ProcessingStatement> => {
  const document = await ProcessingStatementModel.findOne({
    documentNumber: documentNumber,
  }).lean();

  if (!document) {
    return null;
  }

  const ownerValidation = validateDocumentOwner(
    document,
    userPrincipal,
    contactId
  );
  if (!ownerValidation) {
    return null;
  }

  return document;
};

export const getCompletedDocuments = async (
  userPrincipal: string,
  contactId: string,
  limit: number,
  page: number
): Promise<ProcessingStatement[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  let skip = 0;
  if (page !== 1) {
    skip = (page - 1) * limit;
  }

  const documents = await ProcessingStatementModel.find({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
  })
    .select([
      'documentNumber',
      'status',
      'documentUri',
      'createdAt',
      'userReference',
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return documents;
};

export const countCompletedDocuments = async (
  userPrincipal: string,
  contactId: string
): Promise<number> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);

  const documents = await ProcessingStatementModel.countDocuments({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
  });

  return documents;
};

export const getDraftData = async (userPrincipal: string, path: string, contactId: string, defaultValue: any = {}): Promise<any> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {
    $or: ownerQuery,
    status: 'DRAFT',
  };
  const draft = await ProcessingStatementModel.findOne(query);

  return (draft && draft.draftData[path])
    ? draft.draftData[path]
    : defaultValue;
};

export const getAllProcessingStatementsForUserByYearAndMonth = async (monthAndYear: string, userPrincipal: string, contactId: string): Promise<IProcessingStatementModel[]> => {
  const [month, year] = monthAndYear.split('-');
  const currentDate = new Date();
  const yearInt = year ? parseInt(year) : currentDate.getUTCFullYear();
  const monthInt = month ? parseInt(month) : currentDate.getUTCMonth();
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const data = await ProcessingStatementModel.find({
    $or: ownerQuery,
    status: { $nin: ['VOID', 'DRAFT'] },
    createdAt: {
      // month is 0-indexed but allows -1, -2... -n. It takes back n months from given year.
      // For example
      // > new Date(2019, -2, 1)
      // 2018-11-01T00:00:00.000Z
      "$gte": new Date(yearInt, monthInt - 1, 1),
      "$lt": new Date(yearInt, monthInt, 1)
    } as Condition<any>
  }).sort({ createdAt: 'desc' }).select(['documentNumber', 'createdAt', 'documentUri', 'status', 'userReference', 'catchSubmission']);
  return data;
};

export const getDraftDocumentHeaders = async (userPrincipal: string, contactId: string): Promise<ProcessingStatementDraft[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = { $or: ownerQuery, status: 'DRAFT' };
  const props = ['documentNumber', 'status', 'createdAt', 'userReference'];
  const result = await ProcessingStatementModel.find(query, props).sort({ createdAt: 'desc' });

  return result.map(doc => ({
    documentNumber: doc.documentNumber,
    status: doc.status,
    startedAt: moment.utc(doc.createdAt).format('DD MMM YYYY'),
    userReference: doc.userReference
  }));
};

export const getDraft = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query: any = { $or: ownerQuery, status: 'DRAFT' };

  if (documentNumber) query.documentNumber = documentNumber;

  return ProcessingStatementModel.findOne(query, ['userReference', 'exportData', 'requestByAdmin'], { lean: true });
};

export const getDraftCertificateNumber = async (userPrincipal: string, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = { $or: ownerQuery, status: 'DRAFT' };
  const draft = await ProcessingStatementModel.findOne(query);
  const dataExists = (draft && draft.documentNumber);

  return dataExists
    ? draft.documentNumber
    : undefined;
};

export const upsertDraftData = async (userPrincipal: string, documentNumber: string, update: object, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const conditions: any = { $or: ownerQuery, status: 'DRAFT', documentNumber: documentNumber };
  const options = { upsert: true, omitUndefined: true };

  if (draft) await ProcessingStatementModel.findOneAndUpdate(conditions, update, options);
};

export const completeDraft = async (documentNumber: string, documentUri: string, createdByEmail: string) => {
  const update: StrictUpdateFilter<ProcessingStatement> = {
    $set: {
      'createdByEmail': createdByEmail,
      'status': 'COMPLETE',
      'documentUri': documentUri,
      'createdAt': new Date(Date.now()).toString()
    }
  };

  await ProcessingStatementModel.findOneAndUpdate(
    { documentNumber: documentNumber, status: 'DRAFT' },
    update
  );
};

export const upsertExporterDetails = async (userPrincipal: string, documentNumber: string, payload: Exporter, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, {
    $set: {
      'exportData.exporterDetails': toBackEndPsAndSdExporterDetails(payload),
    },
  }, contactId);
};

export const createDraft = async (userPrincipal: string, email: string, requestedByAdmin: boolean, contactId: string) => {
  const documentNumberGenerated = await DocumentNumberService.getUniqueDocumentNumber(ServiceNames.PS, ProcessingStatementModel);

  await new ProcessingStatementModel({
    createdBy: userPrincipal,
    createdByEmail: email,
    createdAt: moment.utc().toISOString(),
    status: 'DRAFT',
    documentNumber: documentNumberGenerated,
    requestByAdmin: requestedByAdmin,
    contactId: contactId,
  }).save();

  return documentNumberGenerated;
};

export const upsertDraftDataForProcessingStatement = async (userPrincipal: string, contactId: string, path?: string, payload?: any) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {
    $or: ownerQuery,
    'status': 'DRAFT'
  };

  let draft = await ProcessingStatementModel.findOne(query);

  if (!path && payload) {
    throw new Error("[upsertDraftDataForProcessingStatement][INVALID-ARGUMENTS]");
  }

  if (!draft) {
    draft = new ProcessingStatementModel({
      createdBy: userPrincipal,
      contactId: contactId,
      status: 'DRAFT',
      documentNumber: DocumentNumberService.getDocumentNumber(ServiceNames.PS)
    });
  }

  if (path) {
    const data = { ...draft.draftData };
    data[path] = payload || {};

    draft.draftData = data;
  }

  await ProcessingStatementModel.findOneAndUpdate(query, draft, {
    upsert: true,
    omitUndefined: true,
  });
  return draft;
};

export const deleteDraftStatement = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  return await ProcessingStatementModel.findOneAndDelete({
    $or: ownerQuery,
    documentNumber: documentNumber,
    'status': 'DRAFT'
  });
};

export const getExporterDetails = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return (draft && draft.exportData && draft.exportData.exporterDetails)
    ? toFrontEndPsAndSdExporterDetails(draft.exportData.exporterDetails)
    : null;
};

export const upsertUserReference = async (userPrincipal: string, documentNumber: string, userReference: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'userReference': userReference } }, contactId);
};

export const getExportLocation = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);
  return (draft && draft.exportData) ? { exportedTo: draft.exportData.exportedTo, pointOfDestination: draft.exportData.pointOfDestination } : null
};

export const upsertExportLocation = async (userPrincipal: string, payload: ExportLocation, documentNumber: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.exportedTo': payload.exportedTo, 'exportData.pointOfDestination': payload.pointOfDestination } }, contactId);
};

export const cloneProcessingStatement = async (documentNumber: string, userPrincipal: string, contactId: string, requestByAdmin: boolean, voidOriginal:boolean): Promise<string> => {
  const original: ProcessingStatement = await getDocument(documentNumber, userPrincipal, contactId);

  if (!original) {
    throw new Error(`Document ${documentNumber} not found for user with userPrincipal: '${userPrincipal}' or contactId: '${contactId}'`);
  }

  const newDocumentNumber = await DocumentNumberService.getUniqueDocumentNumber(ServiceNames.PS, ProcessingStatementModel);
  const copy = clonePS(original, newDocumentNumber, requestByAdmin, voidOriginal);

  await new ProcessingStatementModel(copy).save();

  return newDocumentNumber;
};

export const voidProcessingStatement = async (documentNumber: string, userPrincipal: string, contactId: string): Promise<boolean> => {

  const voided = await ManageCertsService.voidCertificate(documentNumber, userPrincipal, contactId);

  if (!voided) {
    throw new Error(`Document ${documentNumber} not be voided by user ${userPrincipal}`);
  }

  return voided;
}

export const checkDocument = async (
  documentNumber: string,
  userPrincipal: string,
  contactId: string
): Promise<{ _id: any } | null> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  return await ProcessingStatementModel.exists({
    documentNumber: documentNumber,
    $or: ownerQuery,
  });
};
