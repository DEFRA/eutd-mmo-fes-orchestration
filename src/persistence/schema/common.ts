import { Schema } from 'mongoose';
import { DocumentNumber } from "./frontEndModels/documentNumber";

// model types
export interface Audit {
  operation: string,
  // date time
  at: string
}

export const AuditSchema = new Schema({
  operation:  { type: String, required: true },
  at:         { type: Date, required: true }
}, { _id : false });

export interface BasicTransportDetails {
  vehicle: string,
  exportedFrom?: string,
  departurePlace? : string,
  exportDate? : string,
  exportedTo? : ICountry,
  pointOfDestination?: string,
  freightBillNumber?: string,
  departureCountry?: string;
  departurePort?: string;
  departureDate?: string;
  placeOfUnloading?: string;
}

export interface Train extends BasicTransportDetails {
  railwayBillNumber: string,
  containerNumbers?: string
}

export interface Plane extends BasicTransportDetails {
  flightNumber: string,
  airwayBillNumber?: string,
  containerNumbers?: string
}

export interface ContainerVessel extends BasicTransportDetails {
  vesselName: string,
  flagState: string,
  containerNumbers?: string
}

export interface Truck extends BasicTransportDetails {
  cmr?: boolean,
  nationalityOfVehicle?: string,
  registrationNumber?: string,
  containerNumbers?: string
}

type FishingVessel = BasicTransportDetails;

export type Transport = Train | Plane | ContainerVessel | Truck | FishingVessel;

export const Country = new Schema({
  officialCountryName:  { type: String, required: true },
  isoCodeAlpha2:        { type: String, required: false },
  isoCodeAlpha3:        { type: String, required: false },
  isoNumericCode:       { type: String, required: false }
}, { _id: false });

export const TransportSchema = new Schema({
  exportedFrom:                   { type: String },
  exportedTo:                     { type: Country, required: false },
  vehicle:                        { type: String,  required: false },
  departurePlace:                 { type: String,  required: false },
  pointOfDestination:             { type: String,  required: false },
  cmr:                            { type: Boolean, required: false },
  nationalityOfVehicle:           { type: String,  required: false },
  registrationNumber:             { type: String,  required: false },
  railwayBillNumber:              { type: String,  required: false },
  flightNumber:                   { type: String,  required: false },
  vesselName:                     { type: String,  required: false },
  flagState:                      { type: String,  required: false },
  containerNumbers:               { type: String,  required: false },
  exportDate:                     { type: String,  required: false },
  airwayBillNumber:               { type: String,  required: false },
  freightBillNumber:              { type: String,  required: false },
  departureCountry:               { type: String,  required: false },
  departurePort:                  { type: String,  required: false },
  departureDate:                  { type: String,  required: false },
  placeOfUnloading:               { type: String,  required: false },
}, { _id : false });

export interface ExporterDetails {
  contactId?: string;
  accountId?: string;
  addressOne: string;
  addressTwo?: string;
  buildingNumber?: string;
  subBuildingName?: string;
  buildingName?: string;
  streetName?: string;
  county?: string;
  country?: string;
  postcode: string;
  townCity?: string;
  exporterCompanyName: string;
  _dynamicsAddress: any;
  _dynamicsUser: any;
  _updated?: boolean;
}

export interface ICountry {
  officialCountryName: string;
  isoCodeAlpha2?: string;
  isoCodeAlpha3?: string;
  isoNumericCode?: string;
}

export enum ProgressStatus {
  INCOMPLETE ='INCOMPLETE',
  ERROR ='ERROR',
  COMPLETED = 'COMPLETED',
  CANNOT_START = 'CANNOT START',
  OPTIONAL = 'OPTIONAL'
}

export interface ICommodityCode {
  code: string;
  description: string;
  faoName : string;
}

export interface IPSSDCommodityCode {
  code: string;
  description: string;
}

export interface ICommodityCodeExtended extends ICommodityCode {
  stateLabel: string;
  presentationLabel: string;
}

export interface IProductDraft {
  species: string,
  speciesCode?: string,
  totalWeight?: number
}

export interface IProductsDraft {
  products: IProductDraft[]
}

export interface IDraft {
  [documentNumber: string]: IProductsDraft
}

// schema for model
export const ExporterDetailsSchema = new Schema({
  contactId:            { type: String, required: false  },
  accountId:            { type: String },
  addressOne:           { type: String },
  buildingNumber:       { type: String },
  subBuildingName:      { type: String },
  buildingName:         { type: String },
  streetName:           { type: String },
  county:               { type: String },
  country:              { type: String },
  postcode:             { type: String },
  townCity:             { type: String , required: false },
  addressTwo:           { type: String , required: false },
  exporterCompanyName:  { type: String },
  exporterFullName:     { type: String },
  _dynamicsAddress:     { type: Object },
  _dynamicsUser:        { type: Object },
  _updated:             { type: Boolean, required: false }
}, { _id : false } );

export const toFrontEndDocumentNumber = (document : any) : DocumentNumber => {
  return {
    documentNumber: document.documentNumber,
    status: document.status,
    startedAt: document.createdAt
  }
};

export const toExportedTo = (exportedTo: any): ICountry =>
  exportedTo && (typeof exportedTo === 'string')
  ? {
    officialCountryName: exportedTo
  } : exportedTo;

