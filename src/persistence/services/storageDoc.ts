import { TransientData, mapToPersistableSchema } from '../adapters/storageDoc';
import { StorageDocumentModel, StorageDocument, cloneStorageDocument as cloneSD } from '../schema/storageDoc';
import { STATUS_COMPLETE } from '../../services/constants';
import { Condition, StrictUpdateFilter } from 'mongodb';
import logger from '../../logger';
import DocumentNumberService from '../../services/documentNumber.service';
import ManageCertsService from '../../services/manage-certs.service';
import ServiceNames from '../../validators/interfaces/service.name.enum';
import moment = require('moment');
import {
  Exporter,
  toBackEndPsAndSdExporterDetails,
  toFrontEndPsAndSdExporterDetails
} from "../schema/frontEndModels/exporterDetails";
import { Transport, toBackEndTransport, toFrontEndTransport } from '../schema/frontEndModels/transport';
import { StorageDocumentDraft } from '../../persistence/schema/frontEndModels/storageDocument';
import {ExportLocation} from "../schema/frontEndModels/export-location";
import { DocumentStatuses } from '../schema/catchCert';
import { constructOwnerQuery } from './catchCert';
import { validateDocumentOwner } from '../../validators/documentOwnershipValidator';

export const getDocument = async (
  documentNumber: string,
  userPrincipal: string,
  contactId: string
): Promise<StorageDocument> => {
  const document: StorageDocument = await StorageDocumentModel.findOne({
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
): Promise<StorageDocument[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  let skip = 0;
  if (page !== 1) {
    skip = (page - 1) * limit;
  }

  const documents = await StorageDocumentModel.find({
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

  const documents = await StorageDocumentModel.countDocuments({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
  });

  return documents;
};

export const saveStorageDoc = async (dataToPersist: TransientData): Promise<void> => {
  try {
    dataToPersist.status = STATUS_COMPLETE ;
    const data = mapToPersistableSchema(dataToPersist);
    const model = new StorageDocumentModel(data);
    await model.save();

  } catch(e) {
    logger.error(e);
    // NB: The business decision is to not bubble this error up as persisting data into cosmos is only required for verification
    //     As a side effect you can have a document in blob storage but not made it to database
    logger.error('Failed to save storage document into database');
  }
}

export const getAllStorageDocsForUserByYearAndMonth = async (monthAndYear: string, userPrincipal: string, contactId: string): Promise<StorageDocumentModel[]> => {
  const [month, year] = monthAndYear.split('-');
  const currentDate = new Date();
  const yearInt = year ? parseInt(year) : currentDate.getUTCFullYear();
  const monthInt = month ? parseInt(month) : currentDate.getUTCMonth();
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const data = await StorageDocumentModel.find({
    $or: ownerQuery,
    status: {$nin: ['VOID', 'DRAFT']},
    createdAt: {
      // month is 0-indexed but allows -1, -2... -n. It takes back n months from given year.
      // For example
      // > new Date(2019, -2, 1)
      // 2018-11-01T00:00:00.000Z
      "$gte": new Date(yearInt, monthInt - 1, 1),
      "$lt": new Date(yearInt, monthInt, 1)
    } as Condition<any>
  }).sort({createdAt: 'desc'}).select(['documentNumber', 'createdAt', 'documentUri', 'status', 'userReference']);
  return data;
}

export const getAllStorageDocsForUser = async(userPrincipal: string, contactId: string): Promise<StorageDocumentModel[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const data = await StorageDocumentModel.find({
    $or: ownerQuery,
    'status': {$ne: 'VOID'}
  }).select(['documentNumber', 'createdAt', 'documentUri', 'status']);
  return data;
}

export const getDraftData = async (userPrincipal: string, path: string, contactId: string, defaultValue: any = {}) => {
  logger.debug(`[SD][getDraftData] getting ${path} data for ${userPrincipal}`);

  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {$or: ownerQuery, status: 'DRAFT'};
  const results = await StorageDocumentModel.findOne(query, 'draftData', {lean: true});
  const dataExists = (results && results.draftData && Object.prototype.hasOwnProperty.call(results.draftData, path));

  logger.debug(`[SD][getDraftData] data found? ${dataExists}`);

  return (dataExists)
    ? results.draftData[path]
    : defaultValue;
}

export const upsertDraftDataForStorageDocuments = async (userPrincipal: string, contactId: string, path?: string, payload?: any): Promise<void> => {
  logger.debug(`[SD][upsertDraftDataForStorageDocuments] upserting ${path} data for ${userPrincipal}`);

  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {$or: ownerQuery, status: 'DRAFT'};
  let draft = await StorageDocumentModel.findOne(query);

  if (!path && payload) {
    throw new Error("[SD][upsertDraftDataForStorageDocuments][INVALID-ARGUMENTS]");
  }

  if (!draft) {
    logger.debug(`[SD][upsertDraftDataForStorageDocuments creating new draft`);

    draft = new StorageDocumentModel({
      createdBy: userPrincipal,
      status: 'DRAFT',
      documentNumber: DocumentNumberService.getDocumentNumber(ServiceNames.SD)
    });
  }

  if (path) {
    const data = {...draft.draftData};
    data[path] = payload;

    draft.draftData = data;
  }

  await StorageDocumentModel.findOneAndUpdate(query, draft, {upsert: true, omitUndefined: true});
};

export const getDraftDocumentHeaders = async (userPrincipal: string, contactId: string): Promise<StorageDocumentDraft[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {$or: ownerQuery, status: 'DRAFT'};
  const props = ['documentNumber', 'status', 'createdAt', 'userReference'];
  const result = await StorageDocumentModel.find(query, props).sort({createdAt: 'desc'});

  return result.map(doc => ({
    documentNumber: doc.documentNumber,
    status: doc.status,
    userReference: doc.userReference,
    startedAt: moment.utc(doc.createdAt).format('DD MMM YYYY')
  }));
};

export const getExporterDetails = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

    return (draft && draft.exportData && draft.exportData.exporterDetails)
      ? toFrontEndPsAndSdExporterDetails(draft.exportData.exporterDetails)
      : null;
};

export const completeDraft = async (documentNumber: string, documentUri: string, createdByEmail: string) => {
  const update : StrictUpdateFilter<StorageDocument> = {
    $set: {
      'createdByEmail': createdByEmail,
      'status': 'COMPLETE',
      'documentUri': documentUri,
      'createdAt': new Date(Date.now()).toString()
    }
  };

  await StorageDocumentModel.findOneAndUpdate(
    {documentNumber: documentNumber, status: 'DRAFT'},
    update
  );
};

export const deleteDraft = async (userPrincipal:string, documentNumber: string, contactId: string): Promise<void> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  await StorageDocumentModel.findOneAndDelete({
    $or: ownerQuery,
    documentNumber: documentNumber,
    status: 'DRAFT'
  });
}

export const getDraft = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query: any = {$or: ownerQuery, status: 'DRAFT',documentNumber: documentNumber};

  return StorageDocumentModel.findOne(query, ['userReference','exportData', 'requestByAdmin'], {lean: true});
};

export const getDraftCertificateNumber = async (userPrincipal: string, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = { $or: ownerQuery, status: 'DRAFT' };
  const draft = await StorageDocumentModel.findOne(query);
  const dataExists = (draft && draft.documentNumber);

  return dataExists
    ? draft.documentNumber
    : undefined;
};

export const upsertDraftData = async (userPrincipal: string, documentNumber: string, update: object, contactId: string) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const draft  = await getDraft(userPrincipal, documentNumber, contactId);
  const conditions : any = { $or: ownerQuery, status: 'DRAFT', documentNumber: documentNumber };
  const options = { upsert: true, omitUndefined: true };

  if (draft) await StorageDocumentModel.findOneAndUpdate(conditions, update, options);
};

export const createDraft = async (userPrincipal: string, email: string, requestedByAdmin: boolean, contactId: string) => {
  const documentNumberGenerated = await DocumentNumberService.getUniqueDocumentNumber(ServiceNames.SD, StorageDocumentModel);

  await new StorageDocumentModel({
    createdBy: userPrincipal,
    contactId: contactId,
    createdByEmail: email,
    createdAt: moment.utc().toISOString(),
    status: 'DRAFT',
    documentNumber: documentNumberGenerated,
    requestByAdmin: requestedByAdmin
  }).save();

  return documentNumberGenerated;
};

export const upsertExporterDetails = async (
  userPrincipal: string,
  documentNumber: string,
  payload: Exporter,
  contactId: string
) => {
  await upsertDraftData(
    userPrincipal,
    documentNumber,
    {
      $set: {
        'exportData.exporterDetails': toBackEndPsAndSdExporterDetails(payload),
      },
    },
    contactId
  );
};

export const upsertTransportDetails = async (userPrincipal: string, payload: Transport, documentNumber: string, contactId: string) => {

  const exportLocation: ExportLocation = await getExportLocation(userPrincipal, documentNumber, contactId);
  const transport = toBackEndTransport(payload, exportLocation);
  await upsertDraftData(userPrincipal,documentNumber, {'$set': {'exportData.transportation': transport}}, contactId);
};

export const getTransportDetails = async (userPrincipal: string, documentNumber: string, contactId: string): Promise<Transport> => {
    const draft = await getDraft(userPrincipal, documentNumber, contactId);

    return (draft && draft.exportData && draft.exportData.transportation)
      ? toFrontEndTransport(draft.exportData.transportation)
      : null;
};

export const upsertExportLocation = async (userPrincipal: string, payload: ExportLocation, documentNumber:string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, {'$set': {'exportData.exportedTo': payload.exportedTo}}, contactId);
};

export const getExportLocation = async (userPrincipal: string, documentNumber: string, contactId: string): Promise<ExportLocation> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);
  return (draft && draft.exportData && draft.exportData.exportedTo) ? {exportedTo : draft.exportData.exportedTo} : null;
};

export const upsertUserReference = async (userPrincipal: string, documentNumber: string, userReference: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, {'$set': {'userReference': userReference}}, contactId);
};

export const cloneStorageDocument = async (documentNumber: string, userPrincipal: string, contactId: string, requestByAdmin: boolean, voidOriginal?: boolean): Promise<string> => {
  const original: StorageDocument = await getDocument(documentNumber, userPrincipal, contactId);

  if (!original) {
    throw new Error(`Document ${documentNumber} not found for user ${userPrincipal}`);
  }

  const newDocumentNumber = await DocumentNumberService.getUniqueDocumentNumber(ServiceNames.SD, StorageDocumentModel);
  const copy = cloneSD(original, newDocumentNumber, requestByAdmin, voidOriginal);
  await new StorageDocumentModel(copy).save();

  return newDocumentNumber;
};

export const voidStorageDocument = async (documentNumber: string, userPrincipal: string, contactId: string): Promise<boolean> => {

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
  return await StorageDocumentModel.exists({
    documentNumber: documentNumber,
    $or: ownerQuery,
  });
};