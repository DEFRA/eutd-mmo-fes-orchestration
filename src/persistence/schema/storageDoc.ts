import { Schema, Document } from 'mongoose';
import { utc } from 'moment';
import { getRandomNumber } from '../../helpers/utils/utils';
import { BaseModel } from './base';
import {
  Audit,
  AuditSchema,
  Transport,
  TransportSchema,
  ExporterDetails,
  ExporterDetailsSchema,
  toFrontEndDocumentNumber,
  Country,
  ICountry,
  toExportedTo
} from './common';
import { toFrontEndTransport } from './frontEndModels/transport';
import * as FrontEndStorageDocument from './frontEndModels/storageDocument';
import { isEmpty } from 'lodash';

export enum CertificateType {
  UK = 'uk',
  NON_UK = 'non_uk'
}
export interface Catch {
 product               : string,
 id?                   : string,
 commodityCode         : string,
 productWeight         : string,
 certificateNumber?    : string,
 weightOnCC?           : string,
 dateOfUnloading?      : string,
 placeOfUnloading?     : string,
 transportUnloadedFrom?: string,
 scientificName?       : string,
 speciesCode?          : string,
 certificateType?      : 'uk' | 'non_uk'
}

export interface StorageFacility {
  facilityName             : string,
  facilityAddressOne?      : string,
  facilityTownCity?        : string,
  facilityPostcode?        : string,
  facilitySubBuildingName? : string,
  facilityBuildingNumber?  : string,
  facilityBuildingName?    : string,
  facilityStreetName?      : string,
  facilityCounty?          : string,
  facilityCountry?         : string,
  facilityApprovalNumber?  : string,
  facilityStorage?         : string,
  _facilityUpdated?        : boolean
}

export interface ExportData {
  catches                 ? : Catch[],
  storageFacilities       ? : StorageFacility[],
  exporterDetails           : ExporterDetails,
  transportation          ? : Transport,
  arrivalTransportation   ? : Transport,
  exportedTo              ? : ICountry
}

export interface StorageDocument {
  documentNumber: string,
  userReference?: string,
  status: string,
  createdAt: string,
  createdBy: string,
  createdByEmail: string,
  exportData: ExportData,
  draftData?: {},
  documentUri?: string,
  audit?: Audit[],
  requestByAdmin: boolean,
  contactId?: string
}

export interface StorageDocumentModel extends StorageDocument, Document {}


const CatchSchema = new Schema({
  product               : { type: String },
  id                    : { type: String, required: false },
  commodityCode         : { type: String },
  certificateNumber     : { type: String, required: false, uppercase: true },
  productWeight         : { type: String },
  dateOfUnloading       : { type: String, required: false },
  placeOfUnloading      : { type: String, required: false },
  transportUnloadedFrom : { type: String, required: false },
  weightOnCC            : { type: String, required: false },
  scientificName        : { type: String, required: false},
  speciesCode           : { type: String, required: false },
  certificateType       : { type: String, required: false, enum: Object.values(CertificateType) }
}, { _id : true } );

const StorageFacilitySchema = new Schema({
  facilityName              : { type: String },
  facilityAddressOne        : { type: String },
  facilityTownCity          : { type: String },
  facilityPostcode          : { type: String },
  facilitySubBuildingName   : { type: String },
  facilityBuildingNumber    : { type: String },
  facilityBuildingName      : { type: String },
  facilityStreetName        : { type: String },
  facilityCounty            : { type: String },
  facilityCountry           : { type: String },
  facilityApprovalNumber    : { type: String, required: false },
  facilityStorage           : { type: String, required: false }
}, { _id : false } );

const ExportDataSchema = new Schema({
  catches                   : { type: [CatchSchema] },
  storageFacilities         : { type: [StorageFacilitySchema] },
  exporterDetails           : { type: ExporterDetailsSchema },
  transportation            : { type: TransportSchema },
  arrivalTransportation     : { type: TransportSchema, required: false },
  exportedTo                : { type: Country, required: false }
}, { _id : false } );

const StorageDocumentSchema = new Schema({
  documentNumber:   { type: String, required: true },
  userReference:    { type: String, required: false },
  status:           { type: String, required: true },
  createdAt:        { type: Date, required: true, default: new Date() },
  createdBy:        { type: String, required: false },
  createdByEmail:   { type: String, required: false },
  audit:            { type: [AuditSchema] },
  draftData:        { type: Object, required: false, default: {}},
  exportData:       { type: ExportDataSchema, required: false },
  documentUri:      { type: String, required: false },
  requestByAdmin:   { type: Boolean,required: false },
  contactId:        { type: String,required: false },
  clonedFrom:       { type: String, required: false },
  parentDocumentVoid: { type: Boolean, required: false }
});

export const toFrontEndStorageDocumentDocumentNumber = (document: StorageDocument) => toFrontEndDocumentNumber(document);

export const toFrontEndCatchStorageDocument = (catchSD: Catch): Catch => {
  return catchSD as FrontEndStorageDocument.Catch;
};

export const toFrontEndStorageFacility = (storageFacility : StorageFacility): FrontEndStorageDocument.StorageFacility => {
  return storageFacility as FrontEndStorageDocument.StorageFacility;
}

export const isOldStorageFacilityAddress = (storageFacility: StorageFacility) => (
  !isEmpty(storageFacility)
  && storageFacility.facilityAddressOne && storageFacility.facilityAddressOne !== ''
  && storageFacility.facilityBuildingName === undefined
  && storageFacility.facilitySubBuildingName === undefined
  && storageFacility.facilityBuildingNumber === undefined
  && storageFacility.facilityStreetName === undefined
  && storageFacility.facilityCounty === undefined
  && storageFacility.facilityCountry === undefined
)

export const clearOldAddress = (storageFacility: StorageFacility): StorageFacility => {
  const update = isOldStorageFacilityAddress(storageFacility);

  return (update)
    ? {facilityName: storageFacility.facilityName, _facilityUpdated: update}
    : {...storageFacility, _facilityUpdated: update};
}

export const toFrontEndStorageDocumentExportData = (exportData : ExportData) : FrontEndStorageDocument.StorageDocument => {
  const isEmpty = (
    exportData == undefined ||
    (
      exportData.catches == undefined &&
      exportData.transportation == undefined &&
      exportData.storageFacilities == undefined
    )
  );

  if (isEmpty) {
    return {
      catches: [],
      storageFacilities: [],
      validationErrors: [{}],
      addAnotherProduct: "No",
      addAnotherStorageFacility: "No",
      transport: undefined
    }
  }

  const storageFacilities = exportData.storageFacilities?.map(facility => toFrontEndStorageFacility(clearOldAddress(facility))) || [];

  return {
    catches: exportData && exportData.catches ? exportData.catches.map(catchSD => toFrontEndCatchStorageDocument(catchSD)) : [],
    storageFacilities: storageFacilities,
    validationErrors: [],
    addAnotherProduct: "No",
    addAnotherStorageFacility: "No",
    transport: exportData.transportation ? toFrontEndTransport(exportData.transportation) : undefined,
    exportedTo: toExportedTo(exportData.exportedTo)
  };
}

export const cloneStorageDocument = (original: StorageDocument, newDocumentNumber: string, requestByAdmin: boolean, voidOriginal: boolean): StorageDocument => {
  const { createdBy, createdByEmail, exportData, userReference, contactId } = original;
  const result = {
    createdBy,
    createdByEmail,
    createdAt: utc().toISOString(),
    status: 'DRAFT',
    documentNumber: newDocumentNumber,
    exportData: cloneExportData(exportData),
    userReference,
    requestByAdmin,
    contactId,
    clonedFrom: original.documentNumber,
    parentDocumentVoid: voidOriginal
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const cloneExportData = (original: ExportData): ExportData => (
  {
    ...original,
    exportedTo: toExportedTo(original.exportedTo),
    catches: (original.catches && original.catches.length)
      ? original.catches.map((ctch: Catch) => cloneCatches(ctch))
      : original.catches,
    transportation: (original.transportation && typeof original.transportation.exportedTo === 'string')
    ? {
      ...original.transportation,
      exportedTo: {
        officialCountryName: original.transportation.exportedTo
      }
    }
    : original.transportation,
  }
);

export const cloneCatches = (original: Catch): Catch => {
  const { product, commodityCode, certificateNumber, productWeight, weightOnCC, dateOfUnloading, placeOfUnloading, transportUnloadedFrom,  scientificName, certificateType } = original;

  const result = {
    id: certificateNumber + '-' + getRandomNumber(),
    product,
    commodityCode,
    certificateNumber,
    productWeight,
    weightOnCC,
    dateOfUnloading,
    placeOfUnloading,
    transportUnloadedFrom,
    scientificName,
    certificateType
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const StorageDocumentModel = BaseModel.discriminator<StorageDocumentModel>('storageDocument', StorageDocumentSchema);

