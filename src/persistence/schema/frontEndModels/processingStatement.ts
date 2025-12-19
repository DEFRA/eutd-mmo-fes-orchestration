import * as BackEndProcessingStatement from "../processingStatement";
import { DocumentNumber } from "./documentNumber";
import { Exporter, toBackEndPsAndSdExporterDetails } from "./exporterDetails";
import * as moment from 'moment';
import { ICountry, ProgressStatus } from '../common';
import { BaseProgress } from './payload';

export interface ProcessingStatement {
  catches: Catch[];
  validationErrors?: {}[];
  products?: Product[],
  consignmentDescription?: string;
  error: string;
  addAnotherCatch?: string;
  personResponsibleForConsignment?: string;
  plantApprovalNumber?: string;
  plantAddressOne?: string;
  plantBuildingNumber?: string;
  plantSubBuildingName?: string;
  plantBuildingName?: string;
  plantStreetName?: string;
  plantCounty?: string;
  plantCountry?: string;
  plantTownCity?: string;
  plantPostcode?: string;
  dateOfAcceptance?: string;
  plantName?: string;
  healthCertificateNumber?: string;
  healthCertificateDate?: string;
  errors?: {};
  errorsUrl?: string;
  exportedTo: ICountry;
  pointOfDestination?: string;
  _plantDetailsUpdated?: boolean;
}
export interface ProcessingStatementDraft {
  documentNumber: string,
  status: string,
  startedAt: string,
  userReference: string
}

export interface Catch {
  id?: string;
  species?: string;
  speciesCode?: string;
  catchCertificateNumber?: string;
  catchCertificateType?: 'uk' | 'non_uk',
  issuingCountry?: ICountry;
  totalWeightLanded?: string
  exportWeightBeforeProcessing?: string;
  exportWeightAfterProcessing?: string;
  scientificName?: string;
  productId?: string;
  productDescription?: string;
  productCommodityCode?: string;
}

export interface Product {
  id?: string,
  commodityCode: string,
  description: string
}

export interface ProcessingStatementProgress extends BaseProgress {
  processedProductDetails: ProgressStatus;
  processingPlant: ProgressStatus;
  processingPlantAddress: ProgressStatus;
  exportHealthCertificate: ProgressStatus;
  exportDestination: ProgressStatus;
}

export const toBackEndCatchProcessingStatement = (catches: Catch[]): BackEndProcessingStatement.Catch[] => {
  return catches
    ? catches.map<BackEndProcessingStatement.Catch>((cat: Catch, index: number) => {
      return {
        species: cat.species,
        speciesCode: cat.speciesCode,
        catchCertificateNumber: cat.catchCertificateNumber,
        catchCertificateType: cat.catchCertificateType,
        issuingCountry: cat.issuingCountry,
        totalWeightLanded: cat.totalWeightLanded,
        exportWeightBeforeProcessing: cat.exportWeightBeforeProcessing,
        exportWeightAfterProcessing: cat.exportWeightAfterProcessing,
        id: cat.id || cat.catchCertificateNumber !== undefined ? `${cat.catchCertificateNumber}-${moment.utc().unix()}-${index}` : undefined,
        scientificName: cat.scientificName,
        productId: cat.productId,
        productDescription: cat.productDescription,
        productCommodityCode: cat.productCommodityCode,
      }
    })
    : [];
}

export const toBackEndProductProcessingStatement = (products: Product[], documentNumber: string): BackEndProcessingStatement.Product[] => {
  return products ? products.map<BackEndProcessingStatement.Product>((product: Product) => {
    return {
      id: product.id || documentNumber + '-' + moment.utc().unix(),
      commodityCode: product.commodityCode,
      description: product.description
    }
  }) : [];
}

export const toBackEndProcessingStatement = (
  documentNumber: DocumentNumber,
  processingStatement: ProcessingStatement,
  exporterDetails: Exporter,
  userReference: string,
  requestedByAdmin: boolean
): BackEndProcessingStatement.ProcessingStatement => {
  return {
    createdAt: documentNumber.startedAt,
    createdBy: "User Id to be done",
    createdByEmail: "User email to be done",
    documentNumber: documentNumber.documentNumber,
    status: documentNumber.status,
    documentUri: "",
    draftData: {},
    exportData: toBackEndProcessingStatementExportData(processingStatement, exporterDetails, documentNumber.documentNumber),
    audit: [],
    userReference: userReference,
    requestByAdmin: requestedByAdmin
  }
}

const getOptionalField = <T, K extends keyof T>(obj: T, key: K): T[K] | undefined => {
  return obj?.[key] ? obj[key] : undefined;
};

const mapPlantDetails = (processingStatement: ProcessingStatement) => ({
  personResponsibleForConsignment: getOptionalField(processingStatement, 'personResponsibleForConsignment'),
  plantApprovalNumber: getOptionalField(processingStatement, 'plantApprovalNumber'),
  plantName: getOptionalField(processingStatement, 'plantName'),
  plantAddressOne: getOptionalField(processingStatement, 'plantAddressOne'),
  plantBuildingName: getOptionalField(processingStatement, 'plantBuildingName'),
  plantBuildingNumber: getOptionalField(processingStatement, 'plantBuildingNumber'),
  plantSubBuildingName: getOptionalField(processingStatement, 'plantSubBuildingName'),
  plantStreetName: getOptionalField(processingStatement, 'plantStreetName'),
  plantCounty: getOptionalField(processingStatement, 'plantCounty'),
  plantCountry: getOptionalField(processingStatement, 'plantCountry'),
  plantTownCity: getOptionalField(processingStatement, 'plantTownCity'),
  plantPostcode: getOptionalField(processingStatement, 'plantPostcode'),
  dateOfAcceptance: getOptionalField(processingStatement, 'dateOfAcceptance'),
  exportedTo: getOptionalField(processingStatement, 'exportedTo'),
  pointOfDestination: getOptionalField(processingStatement, 'pointOfDestination'),
});

export const toBackEndProcessingStatementExportData = (
  processingStatement: ProcessingStatement,
  exporterDetails: Exporter | null,
  documentNumber: string): BackEndProcessingStatement.ExportData => {
  const mappedProperties = {
    catches: getCatches(processingStatement),
    exporterDetails: getExporterDetails(exporterDetails),
    products: getProducts(processingStatement, documentNumber),
    consignmentDescription: processingStatement.consignmentDescription,
    healthCertificateNumber: getHealthCertificateNumber(processingStatement),
    healthCertificateDate: getHealthCertificateDate(processingStatement),
    ...mapPlantDetails(processingStatement)
  };

  for (const key of Object.keys(mappedProperties)) {
    if (mappedProperties[key] === undefined) {
      delete mappedProperties[key];
    }
  }

  return mappedProperties;
}

const getCatches = (processingStatement: ProcessingStatement) => (processingStatement && Array.isArray(processingStatement.catches)) ? toBackEndCatchProcessingStatement(processingStatement.catches) : undefined;
const getExporterDetails = (exporterDetails: Exporter | null) => exporterDetails ? toBackEndPsAndSdExporterDetails(exporterDetails) : undefined;
const getProducts = (processingStatement: ProcessingStatement, documentNumber) => (processingStatement && Array.isArray(processingStatement.products)) ? toBackEndProductProcessingStatement(processingStatement.products, documentNumber) : undefined;
const getHealthCertificateNumber = (processingStatement: ProcessingStatement) => processingStatement?.healthCertificateNumber ? processingStatement.healthCertificateNumber : undefined;
const getHealthCertificateDate = (processingStatement: ProcessingStatement) => processingStatement?.healthCertificateDate ? processingStatement.healthCertificateDate : undefined;
