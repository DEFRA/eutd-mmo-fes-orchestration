import * as moment from 'moment';
import * as BackEndSD from '../storageDoc';
import * as Transport from './transport';
import * as ExporterDetails from './exporterDetails';
import { ICountry, ProgressStatus } from '../common';
import {toFrontEndPsAndSdExporterDetails} from "./exporterDetails";
import { BaseProgress } from './payload';

export interface StorageDocument {
  userReference?: string;
  catches?: Catch[];
  storageFacilities?: StorageFacility[];
  validationErrors?: {}[];
  addAnotherProduct?: string;
  addAnotherStorageFacility?: string;
  transport?: Transport.Transport;
  exportedTo?: ICountry,
  errors?: {};
  errorsUrl?: string;
}

export interface Catch {
  id?: string;
  product: string;
  commodityCode: string;
  productWeight: string;
  dateOfUnloading?: string;
  placeOfUnloading?: string;
  transportUnloadedFrom?: string;
  certificateNumber?: string;
  weightOnCC?: string;
  scientificName?: string;
  speciesCode?: string;
  certificateType?: 'uk' | 'non_uk'
}

export interface StorageDocumentProgress extends BaseProgress {
  catches: ProgressStatus;
  storageFacilities: ProgressStatus;
  exportDestination: ProgressStatus;
  arrivalTransportationDetails?: ProgressStatus;
  transportDetails: ProgressStatus;
}

export interface StorageFacility {
  facilityName: string;
  facilityAddressOne?: string;
  facilityTownCity?: string;
  facilityPostcode?: string;
  facilitySubBuildingName?: string,
  facilityBuildingNumber?: string,
  facilityBuildingName?: string,
  facilityStreetName?: string,
  facilityCounty?: string,
  facilityCountry?: string,
  facilityArrivalDate?: string,
}

export interface StorageDocumentDraft {
  documentNumber: string,
  status: string,
  startedAt: string,
  userReference: string
}

export const toBackEndCatchSD = (catchDetails: Catch[]): BackEndSD.Catch[]=> {
  return (catchDetails)
  ? catchDetails.map<BackEndSD.Catch>((cat, index: number) => {
      return {
        product : cat.product,
        speciesCode: cat.speciesCode,
        commodityCode : cat.commodityCode,
        certificateNumber : cat.certificateNumber,
        productWeight : cat.productWeight,
        weightOnCC : cat.weightOnCC,
        placeOfUnloading : cat.placeOfUnloading,
        dateOfUnloading : cat.dateOfUnloading,
        transportUnloadedFrom : cat.transportUnloadedFrom,
        id: cat.id || cat.certificateNumber !== undefined ? `${cat.certificateNumber}-${moment.utc().unix()}-${index}` : undefined,
        scientificName: cat.scientificName,
        certificateType: cat.certificateType
      }
    })
  : [];
};

export const toBackEndStorageFacilitySD = (storageFacility: StorageFacility): BackEndSD.StorageFacility => {
  return storageFacility as BackEndSD.StorageFacility;
};

export const toBackEndExportDataSD = (storageDocument: StorageDocument, exporterDetails : ExporterDetails.Exporter | undefined) : BackEndSD.ExportData => {
  return {
    exporterDetails : ExporterDetails.toBackEndPsAndSdExporterDetails(exporterDetails),
    catches: toBackEndCatchSD(storageDocument.catches),
    storageFacilities: storageDocument.storageFacilities,
    transportation : storageDocument.transport ? Transport.toBackEndTransport(storageDocument.transport) : undefined,
    exportedTo : storageDocument.exportedTo
  }
};

export const sdDataToSave = (newStorageDocument: StorageDocument, originalExportData: BackEndSD.ExportData | undefined): BackEndSD.ExportData => {

  const toSaveStorageDocument = { ...newStorageDocument };

  const hasAddressAndPostCode = (facilityAddressOne: string, facilityPostcode: string) =>
    facilityAddressOne?.length && facilityPostcode?.length;

  const hasFacilityName = (facilityName: string) => facilityName?.length;

  const hasOriginalData = (originalExportData: BackEndSD.ExportData | undefined, index: number) => originalExportData?.storageFacilities?.[index]?.facilityAddressOne?.length


  const toSaveFacilities = newStorageDocument.storageFacilities.map(
    (facility: StorageFacility, index: number) => {
      if (hasAddressAndPostCode(facility.facilityAddressOne, facility.facilityPostcode)) {
        return facility;
      } else if (hasOriginalData(originalExportData, index)) {
        return originalExportData.storageFacilities[index];
      } else if (hasFacilityName(facility.facilityName)) {
        return facility;
      } else {
        return undefined
      }
    }
  );

  toSaveStorageDocument.storageFacilities = toSaveFacilities.filter(facility => facility !== undefined);

  return toBackEndExportDataSD(
    toSaveStorageDocument,
    toFrontEndPsAndSdExporterDetails(originalExportData?.exporterDetails , true)
  );
};
