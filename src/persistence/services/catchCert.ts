import * as moment from 'moment';
import { isEmpty } from 'lodash';

import { Condition, StrictUpdateFilter } from 'mongodb';
import { CatchCertificate, CatchCertModel, CatchCertificateModel, toFrontEndSpecies, toFrontEndConservation, DocumentStatuses, cloneCatchCertificate as cloneCC, LandingsEntryOptions, Product } from '../schema/catchCert';
import logger from '../../logger';
import DocumentNumberService from '../../services/documentNumber.service';
import ManageCertsService from '../../services/manage-certs.service';
import ServiceNames from '../../validators/interfaces/service.name.enum';
import * as FrontEndConservation from '../schema/frontEndModels/conservation';
import * as FrontEndSpecies from "../schema/frontEndModels/species";
import { CatchCertificateDraft, toFrontEndExportLocation } from '../schema/frontEndModels/catchCertificate';
import { Transport, toBackEndTransport, toFrontEndTransport } from '../schema/frontEndModels/transport';
import { ExportLocation } from "../schema/frontEndModels/export-location";
import { toBackEndCcExporterDetails, CcExporter, toFrontEndCcExporterDetails } from '../schema/frontEndModels/exporterDetails';
import { toBackEndProductsLanded, ProductsLanded, toFrontEndProductsLanded, DirectLanding, toFrontEndDirectLanding, SystemFailure } from '../schema/frontEndModels/payload';
import { IDraft } from '../schema/common';
import SummaryErrorsService from '../../services/summaryErrors.service';
import { SessionStoreFactory } from '../../session_store/factory';
import { getRedisOptions } from '../../session_store/redis';
import { validateDocumentOwner } from '../../validators/documentOwnershipValidator';
import { CATCH_CERTIFICATE_KEY, COMPLETED_CC_HEADERS_KEY, DRAFT_HEADERS_KEY } from '../../session_store/constants';
import { userCanCreateDraft } from '../../validators/draftCreationValidator';
import { getSpeciesByFaoCode } from '../../services/reference-data.service';

export const getDocument = async (
  documentNumber: string,
  userPrincipal: string,
  contactId: string
): Promise<CatchCertificate> => {
  const document = await CatchCertModel.findOne({
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
): Promise<CatchCertificate[]> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  let skip = 0;
  if (page !== 1) {
    skip = (page - 1) * limit;
  }

  const documents = await CatchCertModel.find({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
  })
    .select([
      'documentNumber',
      'status',
      'documentUri',
      'createdAt',
      'userReference',
      'catchSubmission',
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return documents;
};

export const countCompletedDocuments = async (
  userPrincipal: string,
  contactId: string,
): Promise<number> => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);

  const documents = await CatchCertModel.countDocuments({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
  });

  return documents;
};

export const getAllCatchCertsForUserByYearAndMonth = async (yearAndMonth: string, userPrincipal: string, contactId: string): Promise<CatchCertificateModel[]> => {
  const cacheKey = `${CATCH_CERTIFICATE_KEY}/${COMPLETED_CC_HEADERS_KEY}/${yearAndMonth}`;
  const cachedResults = await getDraftCache<CatchCertificateModel[]>(userPrincipal, contactId, cacheKey);
  if (cachedResults !== null && Array.isArray(cachedResults)) {
    logger.info(`[GET-COMPLETED-CC-HEADERS-FROM-CACHE][USER-PRINCIPAL][${userPrincipal}][CONTACT-ID][${contactId}][YEAR-MONTH][${yearAndMonth}]`);
    return cachedResults;
  }

  logger.info(`[GET-COMPLETED-CC-HEADERS-FROM-MONGO][YEAR-MONTH][${yearAndMonth}]`);

  const [month, year] = yearAndMonth.split('-');
  const currentDate = new Date();
  const yearInt = year ? Number.parseInt(year) : currentDate.getUTCFullYear();
  const monthInt = month ? Number.parseInt(month) : (currentDate.getUTCMonth() + 1);
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const data = await CatchCertModel.find({
    $or: ownerQuery,
    status: DocumentStatuses.Complete,
    createdAt: {
      '$gte': new Date(yearInt, monthInt - 1, 1),
      '$lt': new Date(yearInt, monthInt, 1)
    } as Condition<any>
  }).sort({ createdAt: 'desc' }).select(['documentNumber', 'createdAt', 'documentUri', 'status', 'userReference', 'catchSubmission']).lean();

  void saveDraftCache(userPrincipal, contactId, cacheKey, data);

  return data;
};

export const getDraftCatchCertHeadersForUser = async (userPrincipal: string, contactId: string): Promise<CatchCertificateDraft[]> => {

  const cacheResults = await getDraftCache<CatchCertificateDraft[]>(userPrincipal, contactId, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`);
  if (cacheResults !== null && Array.isArray(cacheResults)) {
    logger.info(`[GET-DRAFT-CATCH-CERTIFICATE-HEADERS-FROM-CACHE][USER-PRINCIPAL][${userPrincipal}][CONTACT-ID][${contactId}]`);
    return cacheResults;
  }

  logger.info(`[GET-DRAFT-CATCH-CERTIFICATE-HEADERS-FROM-MONGO][${cacheResults}]`);

  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = [
    {
      $match: {
        $or: ownerQuery,
        status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending, DocumentStatuses.Locked] }
      }
    },
    {
      $lookup: {
        from: 'failedonlinecertificates',
        localField: 'documentNumber',
        foreignField: 'documentNumber',
        as: 'isFailed'
      }
    },
    {
      $project: {
        documentNumber: true,
        status: true,
        userReference: true,
        createdAt: true,
        isFailed: { $and: [{ $anyElementTrue: ["$isFailed"] }, { $eq: ["$status", DocumentStatuses.Draft] }] }
      }
    }
  ];

  const [result, systemErrors] = await Promise.all([
    CatchCertModel.aggregate(query).sort({ createdAt: 'desc' }),
    SummaryErrorsService.getAllSystemErrors(userPrincipal, contactId)
  ]);
  const data: CatchCertificateDraft[] = result.map(catchCert => ({
    documentNumber: catchCert.documentNumber,
    status: catchCert.status,
    userReference: catchCert.userReference,
    startedAt: moment.utc(catchCert.createdAt).format('DD MMM YYYY'),
    isFailed: systemErrors.some((systemFailure: SystemFailure) => systemFailure.documentNumber === catchCert.documentNumber) || catchCert.isFailed
  }));

  void saveDraftCache(userPrincipal, contactId, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, data);

  return data;
}

export const createDraft = async (
  userPrincipal: string,
  email: string,
  requestedByAdmin: any,
  contactId: string
) => {
  const documentNumberGenerated =
    await DocumentNumberService.getUniqueDocumentNumber(
      ServiceNames.CC,
      CatchCertModel
    );

  await new CatchCertModel({
    createdBy: userPrincipal,
    createdByEmail: email,
    createdAt: moment.utc().toISOString(),
    status: DocumentStatuses.Draft,
    documentNumber: documentNumberGenerated,
    requestByAdmin: requestedByAdmin,
    contactId: contactId,
  }).save();

  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);

  return documentNumberGenerated;
};

export const upsertDraftData = async (
  userPrincipal: string,
  documentNumber: string,
  update: object,
  contactId: string
) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const conditions: any = {
    $or: ownerQuery,
    status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending] },
    documentNumber: documentNumber,
  };
  const options = {
    upsert: false,
    omitUndefined: true,
    new: true
  };
  logger.debug(
    `[UPSERT-DRAFT-DATA][CONTACT-ID][${contactId}][DOCUMENT-NUMBER][${documentNumber}][UPDATE][${JSON.stringify(
      update
    )}]`
  );

  const result = await CatchCertModel.findOneAndUpdate(conditions, update, options);
  if (result) {
    void invalidateDraftCache(userPrincipal, documentNumber, contactId);
    void saveDraftCache(userPrincipal, contactId, documentNumber, result);
  }
};

// TODO: Not used by CatchCertificate, refactor for PS & SD
export const getDraftCertificateNumber = async (userPrincipal: string): Promise<string> => {
  const query = { createdBy: userPrincipal, status: DocumentStatuses.Draft };
  const draft = await CatchCertModel.findOne(query, 'documentNumber', { lean: true });
  const dataExists = (draft && draft.documentNumber);

  return dataExists
    ? draft.documentNumber
    : undefined;
};

export const getDraftData = async (
  userPrincipal: string,
  path: string,
  contactId: string,
  defaultValue: any = {}
) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query = {
    $or: ownerQuery,
    status: DocumentStatuses.Draft,
  };
  const draft = await CatchCertModel.findOne(query, "draftData", {
    lean: true,
  });
  const dataExists =
    draft &&
    Object.prototype.hasOwnProperty.call(draft, "draftData") &&
    Object.prototype.hasOwnProperty.call(draft.draftData, path);
  logger.debug(`[GET-DRAFT-DATA][USER-PRINCIPLE][${userPrincipal}]`);

  return dataExists ? draft.draftData[path] : defaultValue;
};

export const deleteSpecies = async (userPrincipal: string, speciesId: string, documentNumber: string, contactId: string) => {
  const query = {
    'speciesId': speciesId
  };

  await upsertDraftData(userPrincipal, documentNumber, {
    '$pull': {
      'exportData.products': query
    }
  }, contactId);
};

export const deleteDraftCertificate = async (
  userPrincipal: string,
  documentNumber: string | undefined,
  contactId: string
) => {
  const ownerQuery = constructOwnerQuery(userPrincipal, contactId);
  const query: any = {
    $or: ownerQuery,
    documentNumber: documentNumber,
    status: DocumentStatuses.Draft,
  };

  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);

  return CatchCertModel.findOneAndDelete(query);
};

export const getDraftCache = async <T = CatchCertificate | CatchCertificateDraft[] | IDraft>(
  userPrincipal: string,
  contactId: string,
  key: string
): Promise<T> => {
  const sessionStore = await SessionStoreFactory.getSessionStore(
    getRedisOptions()
  );

  const result: any = await sessionStore.readFor(userPrincipal, contactId, key);

  return result;
};

export const saveDraftCache = async <T>(
  userPrincipal: string,
  contactId: string,
  key: string,
  cacheData: T
): Promise<void> => {
  const sessionStore = await SessionStoreFactory.getSessionStore(
    getRedisOptions()
  );
  await sessionStore.writeFor(userPrincipal, contactId, key, cacheData as any);
};

export const invalidateDraftCache = async (
  userPrincipal: string,
  key: string,
  contactId: string
): Promise<void> => {
  const sessionStore = await SessionStoreFactory.getSessionStore(
    getRedisOptions()
  );

  await sessionStore.deleteFor(userPrincipal, contactId, key);
};

export const getDraft = async (
  userPrincipal: string,
  documentNumber: string,
  contactId: string
): Promise<CatchCertificate> => {
  logger.info(`[GET-DRAFT][DOCUMENT-NUMBER][${documentNumber}][USER-PRINCIPLE][${userPrincipal}][CONTACT-ID][${contactId}]`);

  let doc = await getDraftCache<CatchCertificate>(userPrincipal, contactId, documentNumber);
  if (isEmpty(doc)) {
    logger.info(`[GET-DRAFT][DOCUMENT-NUMBER][${documentNumber}][GET-DRAFT-CACHE-EMPTY]`);

    doc = await CatchCertModel.findOne({
      status: {
        $in: [
          DocumentStatuses.Draft,
          DocumentStatuses.Pending,
          DocumentStatuses.Locked,
        ],
      },
      documentNumber: documentNumber,
    });

    if (!doc) {
      return null;
    }

    const ownerValidation = validateDocumentOwner(doc, userPrincipal, contactId);
    if (!ownerValidation) {
      return null;
    }

    if (doc.status === DocumentStatuses.Draft)
      await saveDraftCache(userPrincipal, contactId, documentNumber, doc);
  }

  return doc;
};

export const completeDraft = async (userPrincipal: string, documentNumber: string, documentUri: string, createdByEmail: string, contactId: string) => {
  const now = new Date(Date.now());
  const update: StrictUpdateFilter<CatchCertificate> = {
    $set: {
      'createdByEmail': createdByEmail,
      'status': DocumentStatuses.Complete,
      'documentUri': documentUri,
      'createdAt': now.toString()
    }
  };

  await CatchCertModel.findOneAndUpdate(
    { documentNumber: documentNumber, status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending] } },
    update
  );

  const currentYearAndMonth = `${now.getUTCMonth() + 1}-${now.getUTCFullYear()}`;
  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${COMPLETED_CC_HEADERS_KEY}/${currentYearAndMonth}`, contactId);
};

export const updateCertificateStatus = async (userPrincipal: string, documentNumber: string, contactId: string, status: DocumentStatuses): Promise<void> => {
  const update: StrictUpdateFilter<CatchCertificate> = {
    $set: {
      'status': status
    }
  };

  await CatchCertModel.findOneAndUpdate(
    {
      documentNumber: documentNumber,
      status: { $ne: DocumentStatuses.Complete }
    },
    update
  );

  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
};

export const getCertificateStatus = async (
  userPrincipal: string,
  documentNumber: string,
  contactId: string
): Promise<string> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return draft && draft.status ? draft.status : null;
};

export const getSpecies = async (
  userPrincipal: string,
  documentNumber: string,
  contactId: string
): Promise<FrontEndSpecies.Product[]> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return draft && draft.exportData && draft.exportData.products
    ? draft.exportData.products.map((_) => toFrontEndSpecies(_))
    : null;
};

export const upsertSpecies = async (
  userPrincipal: string,
  payload: FrontEndSpecies.Product[],
  documentNumber: string,
  contactId: string
): Promise<void> => {
  const species = payload.map((_) => FrontEndSpecies.toBackEndProduct(_));

  await upsertDraftData(
    userPrincipal,
    documentNumber,
    { $set: { "exportData.products": species } },
    contactId
  );
};

export const getExportPayload = async (
  userPrincipal: string,
  documentNumber: string,
  contactId: string
): Promise<ProductsLanded> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return draft?.exportData?.products
    ? toFrontEndProductsLanded(draft.exportData.products)
    : null;
};

export const getDirectExportPayload = async (
  userPrincipal: string,
  documentNumber: string,
  contactId: string
): Promise<DirectLanding> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return draft && draft.exportData && draft.exportData.products
    ? toFrontEndDirectLanding(draft.exportData.products)
    : null;
};

export const getTransportDetails = async (userPrincipal: string, documentNumber: string, contactId: string): Promise<Transport> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return (draft && draft.exportData && draft.exportData.transportation)
    ? toFrontEndTransport(draft.exportData.transportation)
    : null;
};

export const getExporterDetails = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return (draft && draft.exportData && draft.exportData.exporterDetails)
    ? toFrontEndCcExporterDetails(draft.exportData.exporterDetails)
    : null;
};

export const getLandingsEntryOption = async (userPrincipal: string, documentNumber: string, contactId: string): Promise<LandingsEntryOptions> => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return draft?.exportData?.landingsEntryOption;
}

export const upsertExporterDetails = async (userPrincipal: string, documentNumber: string, payload: CcExporter, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.exporterDetails': toBackEndCcExporterDetails(payload) } }, contactId);
};

export const upsertExportPayload = async (userPrincipal: string, payload: ProductsLanded, documentNumber: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.products': toBackEndProductsLanded(payload) } }, contactId);
};

export const upsertLandingsEntryOption = async (userPrincipal: string, documentNumber: string, landingsEntryOption: LandingsEntryOptions, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.landingsEntryOption': landingsEntryOption } }, contactId);
};

export const upsertTransportDetails = async (userPrincipal: string, payload: Transport, documentNumber: string, contactId: string) => {
  const transport = toBackEndTransport(payload);

  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.transportation': transport } }, contactId);
};

export const deleteTransportDetails = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$unset': { 'exportData.transportation': '' } }, contactId);
}

export const getExportLocation = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return (draft && draft.exportData)
    ? toFrontEndExportLocation(draft.exportData)
    : null;
};

export const upsertExportLocation = async (userPrincipal: string, payload: ExportLocation, documentNumber: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.exportedFrom': payload.exportedFrom, 'exportData.exportedTo': payload.exportedTo, 'exportData.pointOfDestination': payload.pointOfDestination } }, contactId);
};

export const upsertConservation = async (userPrincipal: string, payload: FrontEndConservation.Conservation, documentNumber: string, contactId: string) => {
  const conservation = FrontEndConservation.toBackEndConservationDetails(payload);
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.conservation': conservation } }, contactId);
};

export const getConservation = async (userPrincipal: string, documentNumber: string, contactId: string) => {
  const draft = await getDraft(userPrincipal, documentNumber, contactId);

  return (draft && draft.exportData && draft.exportData.conservation)
    ? toFrontEndConservation(draft.exportData.conservation)
    : null;
};

export const upsertUserReference = async (userPrincipal: string, documentNumber: string, userReference: string, contactId: string) => {
  await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'userReference': userReference } }, contactId);
  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
}

export const updateProductScientificName = async (product: Product, documentNumber: string) => {
  if (!product.scientificName || product.scientificName === null) {
    const speciesCode = product.speciesCode;
    try {
      const data = await getSpeciesByFaoCode(speciesCode);
      const species = data.find((item) => item.faoCode === speciesCode);

      if (species && species.scientificName) {
        product.scientificName = species.scientificName;
      }
    } catch (error) {
      logger.
        info(`[GET-COPY][DOCUMENT-NUMBER][${documentNumber}][PRODUCT][${product}][GET-FAO-CODE][${speciesCode}]`);
    }
  }
};

export const cloneCatchCertificate = async (documentNumber: string, userPrincipal: string, excludeLandings: boolean, contactId: string, requestByAdmin: boolean, voidOriginal: boolean): Promise<string> => {

  const original = await getDocument(documentNumber, userPrincipal, contactId);

  if (!original) {
    throw new Error(`Document ${documentNumber} not found for user ${userPrincipal}`);
  }

  const newDocumentNumber = await DocumentNumberService.getUniqueDocumentNumber(ServiceNames.CC, CatchCertModel);
  const copy = cloneCC(original, newDocumentNumber, excludeLandings, contactId, requestByAdmin, voidOriginal);

  if (Array.isArray(copy.exportData.products) && copy.exportData.products.length > 0) {
    await Promise.all(copy.exportData.products.map(product => updateProductScientificName(product, documentNumber)));
  } else {
    logger.info(`[GET-COPY][PRODUCT][${documentNumber}][NO-PRODUCT]`);
  }

  void invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);

  await new CatchCertModel(copy).save();

  return newDocumentNumber;

};

export const voidCatchCertificate = async (documentNumber: string, userPrincipal: string, contactId: string): Promise<boolean> => {

  const voided = await ManageCertsService.voidCertificate(documentNumber, userPrincipal, contactId);

  if (!voided) {
    throw new Error(`Document ${documentNumber} not be voided by user ${userPrincipal}`);
  }

  return voided;
}

export const checkDocument = async (
  documentNumber: string,
  userPrincipal: string,
  contactId: string,
  documentType: string
): Promise<boolean> => {
  const document = await CatchCertModel.findOne({
    documentNumber: documentNumber,
  });

  if (!document) {
    return false;
  }

  const ownerValidation = validateDocumentOwner(
    document,
    userPrincipal,
    contactId
  );

  if (!ownerValidation) {
    return false;
  }

  return await userCanCreateDraft(userPrincipal, documentType, contactId);
};

export const constructOwnerQuery = (
  userPrincipal: string,
  contactId: string
) => {
  if (userPrincipal && contactId) {
    return [
      {
        createdBy: userPrincipal,
      },
      {
        contactId: contactId,
      },
      {
        'exportData.exporterDetails.contactId': contactId,
      },
    ];
  }

  if (!userPrincipal && contactId) {
    return [
      {
        contactId: contactId,
      },
      {
        'exportData.exporterDetails.contactId': contactId,
      },
    ];
  }

  if (userPrincipal && !contactId) {
    return [
      {
        createdBy: userPrincipal,
      },
    ];
  }

  throw new Error('UserPrincipal and ContactId are both undefined');
};