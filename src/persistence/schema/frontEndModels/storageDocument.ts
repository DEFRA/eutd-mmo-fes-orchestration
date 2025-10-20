import * as moment from 'moment';
import * as BackEndSD from '../storageDoc';
import * as Transport from './transport';
import * as ExporterDetails from './exporterDetails';
import { ICountry, ProgressStatus } from '../common';
import { toFrontEndPsAndSdExporterDetails } from "./exporterDetails";
import { BaseProgress } from './payload';

export interface StorageDocument {
  userReference?: string;
  catches?: Catch[];
  storageFacilities?: StorageFacility[];
  validationErrors?: {}[];
  addAnotherProduct?: string;
  addAnotherStorageFacility?: string;
  transport?: Transport.Transport;
  arrivalTransport?: Transport.Transport;
  exportedTo?: ICountry,
  errors?: {};
  errorsUrl?: string;
  facilityName?: string;
  facilityAddressOne?: string;
  facilityTownCity?: string;
  facilityPostcode?: string;
  facilitySubBuildingName?: string;
  facilityBuildingNumber?: string;
  facilityBuildingName?: string;
  facilityStreetName?: string;
  facilityCounty?: string;
  facilityCountry?: string;
  facilityApprovalNumber?: string;
  facilityStorage?: string;
  _facilityUpdated?: boolean;
  facilityArrivalDate?: string;
}

export interface Catch {
  id?: string;
  product: string;
  commodityCode: string;
  productWeight?: string;
  dateOfUnloading?: string;
  placeOfUnloading?: string;
  transportUnloadedFrom?: string;
  certificateNumber?: string;
  weightOnCC?: string;
  scientificName?: string;
  speciesCode?: string;
  certificateType?: 'uk' | 'non_uk';
  supportingDocuments?: string[];
  productDescription?: string;
  netWeightProductArrival?: string;
  netWeightFisheryProductArrival?: string;
  netWeightProductDeparture?: string;
  netWeightFisheryProductDeparture?: string;
}

export interface StorageDocumentProgress extends BaseProgress {
  catches: ProgressStatus;
  storageFacilities: ProgressStatus;
  arrivalTransportationDetails?: ProgressStatus;
  transportDetails: ProgressStatus;
}

export interface StorageFacility {
  facilityName: string;
  facilityAddressOne?: string;
  facilityAddressTwo?: string;
  facilityTownCity?: string;
  facilityPostcode?: string;
  facilitySubBuildingName?: string;
  facilityBuildingNumber?: string;
  facilityBuildingName?: string;
  facilityStreetName?: string;
  facilityCounty?: string;
  facilityCountry?: string;
  facilityApprovalNumber?: string;
  facilityStorage?: string;
  facilityArrivalDate?: string;
}

export interface StorageDocumentDraft {
  documentNumber: string,
  status: string,
  startedAt: string,
  userReference: string
}

export const toBackEndCatchSD = (catchDetails: Catch[]): BackEndSD.Catch[] => {
  return (catchDetails)
    ? catchDetails.map<BackEndSD.Catch>((cat, index: number) => {
      return {
        product: cat.product,
        speciesCode: cat.speciesCode,
        commodityCode: cat.commodityCode,
        certificateNumber: cat.certificateNumber,
        productWeight: cat.productWeight,
        weightOnCC: cat.weightOnCC,
        placeOfUnloading: cat.placeOfUnloading,
        dateOfUnloading: cat.dateOfUnloading,
        transportUnloadedFrom: cat.transportUnloadedFrom,
        id: cat.id || cat.certificateNumber !== undefined ? `${cat.certificateNumber}-${moment.utc().unix()}-${index}` : undefined,
        scientificName: cat.scientificName,
        certificateType: cat.certificateType,
        supportingDocuments: cat.supportingDocuments,
        productDescription: cat.productDescription,
        netWeightProductArrival: cat.netWeightProductArrival,
        netWeightFisheryProductArrival: cat.netWeightFisheryProductArrival,
        netWeightProductDeparture: cat.netWeightProductDeparture,
        netWeightFisheryProductDeparture: cat.netWeightFisheryProductDeparture,
      }
    })
    : [];
};

export const toBackEndExportDataSD = (storageDocument: StorageDocument, exporterDetails: ExporterDetails.Exporter | undefined): BackEndSD.ExportData => {
  return {
    exporterDetails: ExporterDetails.toBackEndPsAndSdExporterDetails(exporterDetails),
    catches: toBackEndCatchSD(storageDocument.catches),
    storageFacilities: storageDocument.storageFacilities,
    transportation: storageDocument.transport ? Transport.toBackEndTransport(storageDocument.transport) : undefined,
    arrivalTransportation: storageDocument.arrivalTransport ? Transport.toBackEndTransport(storageDocument.arrivalTransport) : undefined,
    exportedTo: storageDocument.exportedTo,
    facilityName: storageDocument.facilityName,
    facilityAddressOne: storageDocument.facilityAddressOne,
    facilityTownCity: storageDocument.facilityTownCity,
    facilityPostcode: storageDocument.facilityPostcode,
    facilitySubBuildingName: storageDocument.facilitySubBuildingName,
    facilityBuildingNumber: storageDocument.facilityBuildingNumber,
    facilityBuildingName: storageDocument.facilityBuildingName,
    facilityStreetName: storageDocument.facilityStreetName,
    facilityCounty: storageDocument.facilityCounty,
    facilityCountry: storageDocument.facilityCountry,
    facilityApprovalNumber: storageDocument.facilityApprovalNumber,
    facilityStorage: storageDocument.facilityStorage,
    facilityArrivalDate: storageDocument.facilityArrivalDate
  }
};

export const sdDataToSave = (newStorageDocument: StorageDocument, originalExportData: BackEndSD.ExportData | undefined): BackEndSD.ExportData =>
  toBackEndExportDataSD(
    { ...newStorageDocument },
    toFrontEndPsAndSdExporterDetails(originalExportData?.exporterDetails, true)
  );
