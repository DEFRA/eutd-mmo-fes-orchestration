import { utc } from 'moment';
import { Schema, Document } from 'mongoose';
import { BaseModel } from './base';
import {
  Audit,
  AuditSchema,
  Country,
  ExporterDetails,
  ExporterDetailsSchema,
  ICountry,
  toFrontEndDocumentNumber,
  toExportedTo,
  IDraft,
  IProductsDraft,
  IProductDraft
} from './common';
import * as FrontEndProcessingStatement from '../schema/frontEndModels/processingStatement';
import { getRandomNumber } from '../../helpers/utils/utils';
import { CatchCertificate } from './catchCert';
import { getDraftCache } from '../services/catchCert';
import { CatchCertificateDraft } from './frontEndModels/catchCertificate';
import { numberAsString, validateTodayOrInThePast } from '../../services/orchestration.service';
import { validateCompletedDocument } from '../../validators/documentValidator';
import { isEmpty } from 'lodash';

export enum CatchCertificateType {
  UK = 'uk',
  NON_UK = 'non_uk'
}

export interface Catch {
  species?                      : string,
  speciesCode?                  : string,
  id?                           : string,
  catchCertificateNumber?       : string,
  catchCertificateType?         : 'uk' | 'non_uk',
  issuingCountry?               : ICountry,
  totalWeightLanded?            : string,
  exportWeightBeforeProcessing? : string,
  exportWeightAfterProcessing?  : string,
  scientificName?               : string,
  productId?                    : string,
  productDescription?           : string;
  productCommodityCode?         : string;
}

export interface Product {
  id?: string,
  commodityCode: string,
  description: string
}

export interface ExportData {
  catches?                           : Catch[],
  products?                          : Product[],
  consignmentDescription?            : string,
  healthCertificateNumber?           : string,
  healthCertificateDate?             : string,
  personResponsibleForConsignment?   : string,
  plantApprovalNumber?               : string,
  plantName?                         : string,
  plantAddressOne?                   : string,
  plantBuildingNumber?               : string,
  plantSubBuildingName?              : string,
  plantBuildingName?                 : string,
  plantStreetName?                   : string,
  plantCounty?                       : string,
  plantCountry?                      : string,
  plantTownCity?                     : string,
  plantPostcode                      : string,
  dateOfAcceptance?                  : string,
  exporterDetails?                   : ExporterDetails,
  exportedTo                         : ICountry,
  pointOfDestination?                : string,
}

export interface ProcessingStatement {
  documentNumber: string,
  status: string,
  createdAt: string,
  createdBy: string,
  createdByEmail: string,
  draftData?: {},
  exportData: ExportData,
  documentUri?: string,
  audit?: Audit[],
  userReference?: string,
  requestByAdmin?: boolean,
  contactId?: string,
  clonedFrom?:string,
  parentDocumentVoid?: boolean
}

export interface ProcessingStatementDraft {
  documentNumber: string,
  status: string,
  startedAt: string,
  userReference: string
}

export interface IProcessingStatementModel extends ProcessingStatement, Document {}

const CatchesSchema = new Schema({
  catchCertificateNumber        : { type: String, uppercase: true },
  catchCertificateType          : { type: String, required: false, enum: Object.values(CatchCertificateType) },
  issuingCountry                : { type: Country, required: false },
  species                       : { type: String },
  speciesCode                   : { type: String, required: false },
  id                            : { type: String },
  totalWeightLanded             : { type: String },
  exportWeightBeforeProcessing  : { type: String },
  exportWeightAfterProcessing   : { type: String },
  scientificName                : { type: String },
  productId                     : { type: String },
  productDescription            : { type: String },
  productCommodityCode          : { type: String },
}, { _id : true });

const ProductsSchema = new Schema({
  id                  : { type: String },
  commodityCode       : { type: String },
  description         : { type: String }
});

const ExportDataSchema = new Schema({
  catches                           : { type: [CatchesSchema] },
  products                          : { type: [ProductsSchema], required: false },
  consignmentDescription            : { type: String, required: false },
  healthCertificateNumber           : { type: String },
  healthCertificateDate             : { type: String },
  exporterDetails                   : { type: ExporterDetailsSchema },
  personResponsibleForConsignment   : { type: String },
  plantApprovalNumber               : { type: String },
  plantName                         : { type: String },
  plantAddressOne                   : { type: String },
  plantBuildingNumber               : { type: String },
  plantSubBuildingName              : { type: String },
  plantBuildingName                 : { type: String },
  plantStreetName                   : { type: String },
  plantCounty                       : { type: String },
  plantCountry                      : { type: String },
  plantTownCity                     : { type: String },
  plantPostcode                     : { type: String },
  dateOfAcceptance                  : { type: String },
  exportedTo                        : { type: Country },
  pointOfDestination                : { type: String, required: false }
}, { _id : false } );

const ProcessingStatementSchema = new Schema({
  documentNumber:   { type: String, required: true },
  userReference:    { type: String, required: false },
  status:           { type: String, required: true },
  createdAt:        { type: Date, required: true, default: new Date() },
  createdBy:        { type: String, required: false },
  createdByEmail:   { type: String },
  audit:            { type: [AuditSchema] },
  draftData:        { type: Object, required: false, default: {} },
  exportData:       { type: ExportDataSchema, required: false },
  documentUri:      { type: String, required: false },
  requestByAdmin:   { type: Boolean, required: false },
  clonedFrom:       { type: String, required: false },
  parentDocumentVoid:   { type: Boolean, required: false },
  contactId:        { type: String, required: false }
});

export const toFrontEndProcessingStatementDocumentNumber = (document: ProcessingStatement) => toFrontEndDocumentNumber(document);

export const toFrontEndProcessingStatementExportData = (exportData: ExportData, userReference?: string) : FrontEndProcessingStatement.ProcessingStatement => {
  let plantDetailsUpdated;
  if (isOldProcessingPlantAddress(exportData)) {
    exportData = clearOldProcessingPlantAddress(exportData);
    plantDetailsUpdated = true
  }

  const dateValidation =  [];

  if(exportData?.healthCertificateDate && !validateTodayOrInThePast(exportData?.healthCertificateDate)) {
    const errorObj = {};
    errorObj['message'] = 'psAddHealthCertificateErrorTodayOrPastSubmitDateError';
    errorObj['key'] = 'dateValidationError';
    dateValidation.push(errorObj);
    const fieldError = {};
    fieldError['message'] = 'psAddHealthCertificateErrorTodayOrPastSubmitDateValidationError';
    fieldError['key'] = 'dateFieldError';
    dateValidation.push(fieldError);
  }


  return {
    catches: getCatches(exportData),
    validationErrors: dateValidation,
    error: "",
    addAnotherCatch: "No",
    products: getProducts(exportData),
    consignmentDescription: getDatafromExportData(exportData, 'consignmentDescription'),
    healthCertificateDate: getDatafromExportData(exportData, 'healthCertificateDate'),
    healthCertificateNumber: getDatafromExportData(exportData, 'healthCertificateNumber'),
    personResponsibleForConsignment: getDatafromExportData(exportData, 'personResponsibleForConsignment'),
    plantApprovalNumber: getDatafromExportData(exportData, 'plantApprovalNumber'),
    plantName: getDatafromExportData(exportData, 'plantName'),
    plantAddressOne: getDatafromExportData(exportData, 'plantAddressOne'),
    plantBuildingName: getDatafromExportData(exportData, 'plantBuildingName'),
    plantBuildingNumber: getDatafromExportData(exportData, 'plantBuildingNumber'),
    plantSubBuildingName: getDatafromExportData(exportData, 'plantSubBuildingName'),
    plantStreetName: getDatafromExportData(exportData, 'plantStreetName'),
    plantCounty: getDatafromExportData(exportData, 'plantCounty'),
    plantCountry: getDatafromExportData(exportData, 'plantCountry'),
    plantTownCity: getDatafromExportData(exportData, 'plantTownCity'),
    plantPostcode: getDatafromExportData(exportData, 'plantPostcode'),
    dateOfAcceptance: getDatafromExportData(exportData, 'dateOfAcceptance'),
    exportedTo: exportData?.exportedTo ? toExportedTo(exportData.exportedTo) : null,
    pointOfDestination: getDatafromExportData(exportData, 'pointOfDestination'),
    _plantDetailsUpdated : !!plantDetailsUpdated,
    userReference
  };
}

const getCatches = (exportData: ExportData) => exportData?.catches ? toFrontEndCatchProcessingStatement(exportData?.catches) : [];
const getProducts = (exportData: ExportData) => exportData?.products ? toFrontEndProductProcessingStatement(exportData?.products) : null;
const getDatafromExportData = (exportData: ExportData, property: string) => {
  if (exportData) {
    return exportData[property] ? exportData[property] : null
  } else {
    return null;
  }
}

export const addTotalWeightLandedProcessingStatement = async (documentNumber: string, userPrincipal: string, contactId: string, catches: Catch[]): Promise<Catch[]> =>
  await Promise.all(
    catches.map(async (ctch: Catch) => {
      if (ctch.catchCertificateType === 'uk' && await validateCompletedDocument(ctch.catchCertificateNumber, userPrincipal, contactId, documentNumber)) {
        const dataCache: CatchCertificate | CatchCertificateDraft[] | IDraft = await getDraftCache(userPrincipal, contactId, documentNumber);
        const completedCatchCertificate: IProductsDraft = dataCache?.[ctch.catchCertificateNumber];
        const findSpecies: (product: IProductDraft) => boolean = (product: IProductDraft) => product.species === ctch.species || (!isEmpty(product.speciesCode) && product.speciesCode === ctch.speciesCode);
        if (Array.isArray(completedCatchCertificate?.products) && completedCatchCertificate.products.some(findSpecies)) {
          const weightLanded: number = completedCatchCertificate.products.find(findSpecies)?.totalWeight || 0;
          return {
            ...ctch,
            totalWeightLanded: weightLanded % 1 === 0 ? numberAsString(weightLanded) : weightLanded.toFixed(2)
          }
        }
      }

      return ctch;
    })
  );

export const toFrontEndCatchProcessingStatement = (catches: Catch[]) : FrontEndProcessingStatement.Catch[] =>
  catches.map(catchObj => catchObj as FrontEndProcessingStatement.Catch);

export const toFrontEndProductProcessingStatement = (products: Product[]) : FrontEndProcessingStatement.Product[] =>
  products.map(product => product as FrontEndProcessingStatement.Product);

export const cloneProcessingStatement = (original: ProcessingStatement, newDocumentNumber: string, requestByAdmin: boolean, voidOriginal: boolean): ProcessingStatement => {
  const {createdBy, createdByEmail, exportData, userReference} = original;
  const result = {
    createdBy,
    createdByEmail,
    createdAt: utc().toISOString(),
    status: 'DRAFT',
    documentNumber: newDocumentNumber,
    exportData: cloneExportData(exportData),
    userReference,
    requestByAdmin,
    clonedFrom:original.documentNumber,
    parentDocumentVoid:voidOriginal
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const cloneExportData = (original: ExportData): ExportData => (
  {
    ...original,
    exportedTo: toExportedTo(original.exportedTo),
    catches: (original.catches?.length)
      ? original.catches.map((ctch: Catch) => cloneCatch(ctch))
      : original.catches
  }
);

export const cloneCatch = (original: Catch): Catch => {
  const {
    species,
    speciesCode,
    catchCertificateNumber,
    catchCertificateType,
    issuingCountry,
    totalWeightLanded,
    exportWeightBeforeProcessing,
    exportWeightAfterProcessing,
    scientificName,
    productDescription,
    productCommodityCode,
    productId
  } = original;

  const result = {
    id: catchCertificateNumber + '-' + getRandomNumber(),
    species,
    speciesCode,
    catchCertificateNumber,
    catchCertificateType,
    issuingCountry,
    totalWeightLanded,
    exportWeightBeforeProcessing,
    exportWeightAfterProcessing,
    scientificName,
    productDescription,
    productCommodityCode,
    productId
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const isOldProcessingPlantAddress = (exportData: ExportData): boolean => {
  if (!exportData || isEmpty(exportData)) {
    return false;
  }

  return exportData.plantName !== undefined &&
    exportData.plantName !== '' &&
    exportData.plantBuildingName === undefined &&
    exportData.plantSubBuildingName === undefined &&
    exportData.plantBuildingNumber === undefined &&
    exportData.plantStreetName === undefined &&
    exportData.plantCounty === undefined &&
    exportData.plantCountry === undefined
}


export const clearOldProcessingPlantAddress = (exportData) => {
  const clearedData = {
    ...exportData
  };
  clearedData.plantAddressOne = "";
  clearedData.plantTownCity = "";
  clearedData.plantPostcode = "";
  delete clearedData.plantAddressTwo;

  return clearedData;
};

export const ProcessingStatementModel = BaseModel.discriminator<IProcessingStatementModel>('processingStatement', ProcessingStatementSchema);