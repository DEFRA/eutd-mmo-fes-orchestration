import * as BackEndProcessingStatement from "../processingStatement";
import { DocumentNumber } from "./documentNumber";
import { Exporter, toBackEndPsAndSdExporterDetails } from "./exporterDetails";
import * as moment from 'moment';
import { ICountry, ProgressStatus } from '../common';
import {  BaseProgress } from './payload';

export interface ProcessingStatement {
    catches : Catch[];
    validationErrors ? : {}[];
    products?: Product[],
    consignmentDescription?: string;
    error: string;
    addAnotherCatch ? : string;
    personResponsibleForConsignment ? : string;
    plantApprovalNumber ? : string;
    plantAddressOne ? : string;
    plantBuildingNumber?: string;
    plantSubBuildingName?: string;
    plantBuildingName?: string;
    plantStreetName?: string;
    plantCounty?: string;
    plantCountry?: string;
    plantTownCity ? : string;
    plantPostcode?  : string;
    dateOfAcceptance ? : string;
    plantName ? : string;
    healthCertificateNumber ? : string;
    healthCertificateDate ? : string;
    errors ? : {};
    errorsUrl ? : string;
    exportedTo: ICountry;
    _plantDetailsUpdated ? : boolean;
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
    totalWeightLanded?: string
    exportWeightBeforeProcessing?: string;
    exportWeightAfterProcessing?: string;
    scientificName?: string
}

export interface Product {
  id?: string,
  commodityCode: string,
  description: string
}

export interface ProcessingStatementProgress extends BaseProgress {
  consignmentDescription: ProgressStatus;
  catches: ProgressStatus;
  processingPlant: ProgressStatus;
  processingPlantAddress: ProgressStatus;
  exportHealthCertificate: ProgressStatus;
  exportDestination: ProgressStatus;
}

export const toBackEndCatchProcessingStatement = (catches: Catch[]) : BackEndProcessingStatement.Catch[] =>
{
  return catches
  ? catches.map<BackEndProcessingStatement.Catch>((cat: Catch, index: number) => {
      return {
        species: cat.species,
        speciesCode: cat.speciesCode,
        catchCertificateNumber: cat.catchCertificateNumber,
        catchCertificateType: cat.catchCertificateType,
        totalWeightLanded: cat.totalWeightLanded,
        exportWeightBeforeProcessing: cat.exportWeightBeforeProcessing,
        exportWeightAfterProcessing: cat.exportWeightAfterProcessing,
        id: cat.id || cat.catchCertificateNumber !== undefined ? `${cat.catchCertificateNumber}-${moment.utc().unix()}-${index}` : undefined,
        scientificName: cat.scientificName
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
) : BackEndProcessingStatement.ProcessingStatement => {
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

export const toBackEndProcessingStatementExportData = (
  processingStatement: ProcessingStatement,
  exporterDetails: Exporter | null = null,
  documentNumber: string): BackEndProcessingStatement.ExportData => {
  const mappedProperties = {
    catches: (processingStatement && Array.isArray(processingStatement.catches)) ? toBackEndCatchProcessingStatement(processingStatement.catches) : undefined,
    exporterDetails: exporterDetails ? toBackEndPsAndSdExporterDetails(exporterDetails) : undefined,
    products: (processingStatement && Array.isArray(processingStatement.products)) ? toBackEndProductProcessingStatement(processingStatement.products, documentNumber) : undefined,
    consignmentDescription: processingStatement.consignmentDescription,
    healthCertificateNumber: processingStatement && processingStatement.healthCertificateNumber ? processingStatement.healthCertificateNumber : undefined,
    healthCertificateDate: processingStatement && processingStatement.healthCertificateDate ? processingStatement.healthCertificateDate : undefined,
    personResponsibleForConsignment: processingStatement && processingStatement.personResponsibleForConsignment ? processingStatement.personResponsibleForConsignment : undefined,
    plantApprovalNumber: processingStatement && processingStatement.plantApprovalNumber ? processingStatement.plantApprovalNumber : undefined,
    plantName: processingStatement && processingStatement.plantName ? processingStatement.plantName : undefined,
    plantAddressOne: processingStatement && processingStatement.plantAddressOne ? processingStatement.plantAddressOne : undefined,
    plantBuildingName: processingStatement && processingStatement.plantBuildingName ? processingStatement.plantBuildingName : undefined,
    plantBuildingNumber: processingStatement && processingStatement.plantBuildingNumber ? processingStatement.plantBuildingNumber : undefined,
    plantSubBuildingName: processingStatement && processingStatement.plantSubBuildingName ? processingStatement.plantSubBuildingName : undefined,
    plantStreetName: processingStatement && processingStatement.plantStreetName ? processingStatement.plantStreetName : undefined,
    plantCounty: processingStatement && processingStatement.plantCounty ? processingStatement.plantCounty : undefined,
    plantCountry: processingStatement && processingStatement.plantCountry ? processingStatement.plantCountry : undefined,
    plantTownCity: processingStatement && processingStatement.plantTownCity ? processingStatement.plantTownCity : undefined,
    plantPostcode: processingStatement && processingStatement.plantPostcode ? processingStatement.plantPostcode : undefined,
    dateOfAcceptance: processingStatement && processingStatement.dateOfAcceptance ? processingStatement.dateOfAcceptance : undefined,
    exportedTo: processingStatement && processingStatement.exportedTo ? processingStatement.exportedTo : undefined
  };

  Object.keys(mappedProperties).forEach(key => mappedProperties[key] === undefined && delete mappedProperties[key]);

  return mappedProperties;
}
