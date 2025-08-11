import { Schema, Document } from 'mongoose';
import { BaseModel } from './base';
import {
  Audit,
  AuditSchema,
  Transport,
  TransportSchema,
  Country,
  ExporterDetailsSchema,
  toFrontEndDocumentNumber,
  ExporterDetails,
  ICountry
} from './common';
import * as FrontEndModel from "../schema/frontEndModels/conservation";
import * as SpeciesModelFE from "../schema/frontEndModels/species";
import { utc } from 'moment';
import { HighSeasAreaType } from './frontEndModels/payload';

export enum LandingValidationStatus {
  Pending = 'PENDING_LANDING_DATA',
  Elog = 'ELOG_SPECIES_MISMATCH',
  LandingOveruse = 'LANDING_DATA_OVERUSED',
  Complete = 'HAS_LANDING_DATA',
  Exceeded14Days = 'EXCEEDED_14_DAY_LIMIT',
  DataNeverExpected = 'LANDING_DATA_NEVER_EXPECTED'
}

export enum DocumentStatuses {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Complete = 'COMPLETE',
  Void = 'VOID',
  Blocked = 'BLOCKED',
  Locked = 'LOCKED'
}

export enum LandingsEntryOptions {
  DirectLanding = 'directLanding',
  ManualEntry = 'manualEntry',
  UploadEntry = 'uploadEntry'
}

export enum AddTransportation {
  Yes = 'yes',
  No = 'no',
}

export enum HighSeasAreaOptions {
  Yes = 'Yes',
  No = 'No'
}

export const LandingStatuses = Object.freeze(LandingValidationStatus);

export interface Catch {
  id: string;
  vessel?: string;
  pln?: string;
  homePort?: string;
  flag?: string; // jurisdiction under whose laws the vessel is registered or licensed
  cfr?: string; // cost and freight (CFR) is a legal term
  imoNumber?: string | null;
  licenceNumber?: string;
  licenceValidTo?: string;
  licenceHolder?: string;
  date?: string;
  startDate?: string;
  faoArea?: string;
  weight?: number;
  gearCategory?: string;
  gearType?: string;
  highSeasArea?: HighSeasAreaType;
  exclusiveEconomicZones?: ICountry[];
  _status?: LandingValidationStatus;
  numberOfSubmissions?: number;
  vesselOverriddenByAdmin?: boolean;
  vesselNotFound?: boolean;
  dataEverExpected?: boolean;
  landingDataExpectedDate?: string;
  landingDataEndDate?: string;
  isLegallyDue?: boolean;
  vesselRiskScore?: number;
  exporterRiskScore?: number;
  speciesRiskScore?: number;
  threshold?: number;
  riskScore?: number;
  isSpeciesRiskEnabled?: boolean;
  rfmo?: string;
}

export interface Conservation {
  conservationReference: string;
}

const fishingPolicies = Object.freeze(
  {
    UK : 'UK Fisheries Policy',
    EU : 'Common Fisheries Policy'
  }
);

export const toFrontEndConservation = (conservationReference : Conservation) : FrontEndModel.Conservation => {

  const applicablePolicies = conservationReference ? conservationReference.conservationReference.split(',').map(_=>_.trim()) : [""];
  const otherWaters = applicablePolicies.find(_ => _ != fishingPolicies.UK && _ != fishingPolicies.EU);

  const output = {
    conservationReference: conservationReference ? conservationReference.conservationReference : '',
    legislation: applicablePolicies,
    caughtInUKWaters: applicablePolicies.includes(fishingPolicies.UK) ? "Y" : undefined,
    caughtInEUWaters: applicablePolicies.includes(fishingPolicies.EU) ? "Y" : undefined,
    caughtInOtherWaters: otherWaters ? "Y" : undefined,
    otherWaters: otherWaters || undefined,
    user_id: "Test",
    currentUri: "Test",
    nextUri: "Test"
  };

  Object.keys(output).forEach(key => output[key] === undefined && delete output[key]);

  return output;
};

export interface State {
  code: string;
  name?: string;
  admin?: string;
}

export interface Presentation {
  code: string;
  name?: string;
  admin?: string;
}

export interface Product {
  speciesId: string;
  species?: string;
  speciesAdmin?: string;
  speciesCode?: string;
  commodityCode?: string;
  commodityCodeAdmin?: string;
  commodityCodeDescription?: string;
  scientificName?: string;
  state?: State;
  presentation?: Presentation;
  caughtBy?: Catch[];
  factor? : number;
}

export const toFrontEndSpecies = (backEndProduct: Product): SpeciesModelFE.Product => {
  const result: SpeciesModelFE.Product = {
    id: backEndProduct.speciesId,
    species: backEndProduct.species,
    speciesAdmin: backEndProduct.speciesAdmin,
    speciesCode: backEndProduct.speciesCode,
    scientificName: backEndProduct.scientificName,
    commodity_code: backEndProduct.commodityCode,
    commodity_code_admin: backEndProduct.commodityCodeAdmin,
    commodity_code_description: backEndProduct.commodityCodeDescription,
    user_id: null,
    factor : backEndProduct.factor,
    caughtBy : backEndProduct.caughtBy || undefined
  };

  if (backEndProduct.state) {
    result.state = backEndProduct.state.code;
    result.stateLabel = backEndProduct.state.name;
    result.stateAdmin = backEndProduct.state.admin;
  }

  if (backEndProduct.presentation) {
    result.presentation = backEndProduct.presentation.code;
    result.presentationLabel = backEndProduct.presentation.name;
    result.presentationAdmin = backEndProduct.presentation.admin;
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const toFrontEndCatchCertificateDocumentNumber = (document: CatchCertificate) => toFrontEndDocumentNumber(document);

export const cloneCatchCertificate = (original: CatchCertificate, newDocumentNumber: string, excludeLandings: boolean, contactId: string, requestByAdmin: boolean, voidOriginal: boolean): CatchCertificate => {
  const {createdBy, createdByEmail, exportData, userReference} = original;
  const result = {
    createdBy,
    contactId,
    createdByEmail,
    createdAt: utc().toISOString(),
    status: DocumentStatuses.Draft,
    documentNumber: newDocumentNumber,
    exportData: cloneExportData(exportData, newDocumentNumber, excludeLandings),
    userReference,
    requestByAdmin,
    clonedFrom: original.documentNumber,
    landingsCloned: !excludeLandings,
    parentDocumentVoid: voidOriginal
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
};

export const cloneExportData = (original: ExportData, newDocumentNumber: string, excludeLandings: boolean): ExportData => (
  {
    ...original,
    transportation: (original.transportation && typeof original.transportation.exportedTo === 'string')
      ? {
        ...original.transportation,
        exportedTo: {
          officialCountryName: original.transportation.exportedTo
        }
      }
      : original.transportation,
    products: (original.products?.length)
      ? original.products.map(product => cloneProductData(product, newDocumentNumber, excludeLandings))
      : original.products
  }
);

export const cloneProductData = (original: Product, newDocumentNumber: string, excludeLandings: boolean): Product => {
  let caughtBy: Catch[] | undefined;

  if (!original.caughtBy?.length) {
    caughtBy = original.caughtBy
  } else if (!excludeLandings) {
    caughtBy = original.caughtBy.map((landing: Catch) => cloneCatch(landing, newDocumentNumber));
  }
  const result = {
    ...original,
    speciesId: `${newDocumentNumber}${original.speciesId.slice(newDocumentNumber.length)}`,
    caughtBy
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
}

export const cloneCatch = (original: Catch, newDocumentNumber: string): Catch => {
  const {id,vessel, pln, homePort, flag, cfr, imoNumber, licenceNumber, licenceValidTo, licenceHolder, date, startDate, faoArea, weight, gearCategory, gearType,highSeasArea,
    exclusiveEconomicZones, rfmo } = original;

  const result = {
    id: `${newDocumentNumber}${id.slice(newDocumentNumber.length)}`,
    vessel,
    pln,
    homePort,
    flag,
    cfr,
    imoNumber,
    licenceNumber,
    licenceValidTo,
    licenceHolder,
    date,
    startDate,
    faoArea,
    weight,
    gearCategory,
    gearType,
    highSeasArea,
    exclusiveEconomicZones,
    rfmo
  }

  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
}

export interface CcExporterDetails extends ExporterDetails {
  exporterFullName: string;
}

export interface CatchCertificateTransportDocument {
  name: string,
  reference: string
}

export interface CatchCertificateBasicTransportDetails {
  id: number,
  vehicle: string,
  departurePlace?: string,
  freightBillNumber?: string,
  transportDocuments?: CatchCertificateTransportDocument[]
}
export interface CatchCertificateTrain extends CatchCertificateBasicTransportDetails {
  railwayBillNumber: string,
}

export interface CatchCertificatePlane extends CatchCertificateBasicTransportDetails {
  flightNumber: string,
  containerNumber: string
}

export interface CatchCertificateContainerVessel extends CatchCertificateBasicTransportDetails {
  vesselName: string,
  flagState: string,
  containerNumber: string
}

export interface CatchCertificateTruck extends CatchCertificateBasicTransportDetails {
  cmr?: boolean;
  nationalityOfVehicle?: string,
  registrationNumber?: string
}

export type CatchCertificateTransport = CatchCertificateTrain | CatchCertificatePlane | CatchCertificateContainerVessel | CatchCertificateTruck;

export interface ExportData {
  products: Product[];
  transportation?: Transport;
  transportations?: CatchCertificateTransport[];
  addTransportation?: AddTransportation;
  conservation: Conservation;
  exporterDetails: CcExporterDetails;
  landingsEntryOption?: LandingsEntryOptions;
  exportedTo?: ICountry;
  exportedFrom?: string;
}

export interface CatchCertificate {
  documentNumber: string;
  status: string;
  createdAt: string;
  createdBy?: string;
  createdByEmail: string;
  draftData?: {};
  exportData: ExportData;
  documentUri?: string;
  userReference?: string;
  requestByAdmin?: boolean;
  audit?: Audit[];
  contactId?: string;
}

// Catch cert
export interface CatchCertificateModel extends Document, CatchCertificate {}


// Schema
const PresentationSchema = new Schema({
  code:  { type: String, required: true },
  name:  { type: String },
  admin: { type: String }
}, { _id : false } );

const StateSchema = new Schema({
  code:  { type: String, required: true },
  name:  { type: String },
  admin: { type: String }
}, { _id : false } );

const CatchSchema = new Schema({
  vessel:                   { type: String, required: true  },
  pln:                      { type: String, required: true  },
  homePort:                 { type: String, required: false },
  flag:                     { type: String, required: false },
  cfr:                      { type: String, required: false },
  imoNumber:                { type: String, required: false },
  licenceNumber:            { type: String, required: false },
  licenceValidTo:           { type: String, required: false },
  licenceHolder:            { type: String, required: false },
  id:                       { type: String, required: true  },
  date:                     { type: String, required: true  },
  startDate:                { type: String, required: false },
  faoArea:                  { type: String, required: true  },
  highSeasArea:             { type: String, required: false, enum: Object.values(HighSeasAreaOptions) },
  exclusiveEconomicZones:    { type: [Country], required: false },
  weight:                   { type: Number },
  gearCategory:             { type: String, required: false  },
  gearType:                 { type: String, required: false  },
  numberOfSubmissions:      { type: Number, required: true, default: 0 },
  vesselOverriddenByAdmin:  { type: Boolean, required: false },
  vesselNotFound:           { type: Boolean, required: false },
  _status:                  { type: String, required: false, enum: Object.values(LandingStatuses) },
  dataEverExpected:         { type: Boolean,required: false },
  landingDataExpectedDate:  { type: String, required: false },
  landingDataEndDate:       { type: String, required: false },
  isLegallyDue:             { type: Boolean, required: false },
  vesselRiskScore:          { type: Number, required: false },
  exporterRiskScore:        { type: Number, required: false },
  speciesRiskScore:         { type: Number, required: false },
  threshold:                { type: Number, required: false },
  riskScore:                { type: Number, required: false },
  isSpeciesRiskEnabled:     { type: Boolean,required: false },
  rfmo:                     { type: String, required: false },
}, { _id : false } );

const ProductSchema = new Schema({
  speciesId:                { type: String, required: true },
  species:                  { type: String, required: false },
  speciesAdmin:             { type: String, required: false },
  speciesCode:              { type: String, required: false },
  commodityCode:            { type: String, required: false },
  commodityCodeAdmin:       { type: String, required: false },
  commodityCodeDescription: { type: String, required: false },
  scientificName:           { type: String, required: false },
  state:                    { type: StateSchema, required: false },
  presentation:             { type: PresentationSchema, required: false },
  factor:                   { type: Number, required: false },
  caughtBy:                 { type: [CatchSchema], require: false }
}, { _id : false } );

const ConservationSchema = new Schema({
  conservationReference: { type: String, required: true }
}, { _id : false } );

const CatchCertificateTransportDocumentSchema = new Schema({
  name:       { type: String, required: true },
  reference:  { type: String, required: true }
}, { _id: false });

export const CatchCertificateTransportSchema = new Schema({
  id:                   { type: Number,  required: true  },
  vehicle:              { type: String,  required: true  },
  cmr:                  { type: Boolean, required: false },
  departurePlace:       { type: String,  required: false },
  nationalityOfVehicle: { type: String,  required: false },
  registrationNumber:   { type: String,  required: false },
  railwayBillNumber:    { type: String,  required: false },
  flightNumber:         { type: String,  required: false },
  vesselName:           { type: String,  required: false },
  flagState:            { type: String,  required: false },
  containerNumber:      { type: String,  required: false },
  freightBillNumber:    { type: String,  required: false },
  transportDocuments:   { type: [CatchCertificateTransportDocumentSchema], required: false }
}, { _id : false });

const ExportDataSchema = new Schema({
  products:             { type: [ProductSchema], required: true },
  transportation:       { type: TransportSchema, required: false },
  transportations:      { type: [CatchCertificateTransportSchema], required: false },
  addTransportation:    { type: String, required: false, enum: Object.values(AddTransportation) },
  conservation:         { type: ConservationSchema, required: true },
  exporterDetails:      { type: ExporterDetailsSchema, require: true },
  landingsEntryOption:  { type: String,  required: false, enum: Object.values(LandingsEntryOptions) },
  exportedFrom:         { type: String,  required: false },
  exportedTo:           { type: Country, required: false },
}, { _id : false } );

const CatchCertSchema = new Schema({
  documentNumber:   { type: String, required: true },
  status:           { type: String, required: true },
  createdAt:        { type: Date,   required: true, default: new Date() },
  createdBy:        { type: String },
  createdByEmail:   { type: String },
  submittedAt:      { type: Date,   required: false },
  audit:            { type: [AuditSchema] },
  draftData:        { type: Object, required: false, default: {} },
  exportData:       { type: ExportDataSchema, required: false },
  documentUri:      { type: String, required: false },
  userReference:    { type: String, required: false },
  requestByAdmin:   { type: Boolean,required: false },
  contactId:        { type: String },
  clonedFrom:       { type: String, required: false},
  landingsCloned:   { type: Boolean, required: false},
  parentDocumentVoid:{ type: Boolean, required: false}
});

export const CatchCertModel = BaseModel.discriminator<CatchCertificateModel>('catchCert', CatchCertSchema);
