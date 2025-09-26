import { Progress, SystemFailure, ValidationFailure } from "../persistence/schema/frontEndModels/payload";
import * as CatchCertService from "../persistence/services/catchCert";
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import logger from "../logger";
import { isEmpty } from 'lodash';
import { ProgressStatus, ICountry, ExporterDetails, Transport as BackEndTransport } from "../persistence/schema/common";
import { CatchCertificateProgress } from "../persistence/schema/frontEndModels/catchCertificate";
import { ProcessingStatementProgress } from "../persistence/schema/frontEndModels/processingStatement";
import { StorageDocumentProgress } from "../persistence/schema/frontEndModels/storageDocument";
import { checkTransportDataFrontEnd, toFrontEndTransport, Transport, truck, train, plane, containerVessel } from "../persistence/schema/frontEndModels/transport";
import { Catch, Product, CcExporterDetails, CatchCertificate, CatchCertificateTransport } from "../persistence/schema/catchCert";
import SummaryErrorsService from "./summaryErrors.service";
import { utc } from 'moment';
import * as ProcessingStatement from '../persistence/schema/processingStatement';
import * as StorageDocument from '../persistence/schema/storageDoc';
import * as moment from "moment";
import { validateCatchDetails, validateCatchWeights } from './handlers/processing-statement';
import { validateEntry, validateProduct } from './handlers/storage-notes';
import { isInvalidLength, validateWhitespace } from './orchestration.service';
import * as FrontEndCatchCertificateTransport from "../persistence/schema/frontEndModels/catchCertificateTransport";
import catchCertificateTransportDetailsSchema from "../schemas/catchcerts/catchCertificateTransportDetailsSchema";
import truckSchema from "../schemas/catchcerts/truckSchema";
import trainSchema from "../schemas/catchcerts/trainSchema";
import planeSchema from "../schemas/catchcerts/planeSchema";
import containerVesselSchema from "../schemas/catchcerts/containerVesselSchema";

export default class ProgressService {

  public static async get(userPrincipal: string, documentNumber: string, contactId: string): Promise<Progress> {
    logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-CC-PROGRESS][STARTED]`);

    const data: CatchCertificate = await CatchCertService.getDraft(userPrincipal, documentNumber, contactId);

    if (data?.exportData?.landingsEntryOption) {
      const { landingsEntryOption, exporterDetails, products, conservation, transportation, transportations, exportedFrom, exportedTo } = data.exportData;

      logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-CC-PROGRESS][SUCCEEDED][${JSON.stringify(data)}]`);

      const transportType = ProgressService.getTransportType(transportation, transportations);
      const exportJourney = ProgressService.getExportJourney(transportation, exportedFrom, exportedTo);

      const progressObject: CatchCertificateProgress = {
        reference: ProgressService.getUserReference(data.userReference),
        exporter: ProgressService.hasCCExporterDetails(exporterDetails, data?.requestByAdmin) ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE,
        dataUpload: '',
        products: (products && data.exportData.products.length > 0) ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE,
        landings: await ProgressService.getLandingsStatus(userPrincipal, documentNumber, data.exportData.products, contactId),
        conservation: conservation ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE,
        exportJourney
      };

      if (landingsEntryOption !== 'uploadEntry') {
        delete progressObject.dataUpload;
      }

      const progressSections: CatchCertificateProgress = ProgressService.getProgressSections(landingsEntryOption, progressObject, transportType, data);

      return {
        progress: progressSections,
        requiredSections: Object.keys(progressSections).filter(key => key !== 'dataUpload' && key !== 'reference').length,
        completedSections: ProgressService.getCompletedSectionsNumber(progressSections),
      };
    } else {
      return null;
    }
  }

  static readonly getTransportType = (transportation: BackEndTransport, transportations?: CatchCertificateTransport[]) =>
    transportation?.vehicle || Array.isArray(transportations) && transportations.length > 0 && transportations.every((t: CatchCertificateTransport) => !isEmpty(t.vehicle)) ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;

  static readonly getExportJourney = (transportation: BackEndTransport, exportedFrom: string, exportedTo: ICountry) => {
    if (exportedFrom && ProgressService.getExportDestinationStatus(exportedTo) === ProgressStatus.COMPLETED) {
      return ProgressStatus.COMPLETED;
    }

    return transportation?.exportedFrom && ProgressService.getExportDestinationStatus(transportation?.exportedTo) === ProgressStatus.COMPLETED ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  static readonly getProgressSections = (landingsEntryOption: string, progressObject: CatchCertificateProgress, transportType: ProgressStatus, data: CatchCertificate) => {
    if (landingsEntryOption === 'directLanding') {
      return progressObject;
    }

    const transportations: CatchCertificateTransport[] = data.exportData.transportations;
    const transportDetails: ProgressStatus = (Array.isArray(transportations) && transportations.length > 0) ? ProgressService.getCatchCertificateTransportDetails(transportations) : ProgressService.getTransportDetails(checkTransportDataFrontEnd(toFrontEndTransport(data.exportData.transportation)));

    return {
      ...progressObject,
      transportType,
      transportDetails
    };
  }

  public static getCompletedSectionsNumber(sections: CatchCertificateProgress | ProcessingStatementProgress | StorageDocumentProgress): number {
    const completedSections = [];
    for (const key in sections) {
      if (key !== 'dataUpload' && key !== 'reference') {
        completedSections.push(sections[key])
      }
    }

    return completedSections.filter(value => value === ProgressStatus.COMPLETED || value === ProgressStatus.ERROR).length;
  }

  public static async getLandingsStatus(userPrincipal: string, documentNumber: string, products: Product[], contactId: string): Promise<ProgressStatus> {
    const errors = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId) || [];
    const filteredErrors = errors.filter(ProgressService.filterErrors(documentNumber, products));

    if (filteredErrors.length > 0) {
      return ProgressStatus.ERROR;
    }
    if (products && products.length > 0 && !ProgressService.hasLandingData(products)) {
      return ProgressStatus.INCOMPLETE;
    }
    if (ProgressService.hasLandingData(products)) {
      return ProgressStatus.COMPLETED;
    }
    return ProgressStatus.CANNOT_START;
  }

  public static readonly filterErrors = (documentNumber: string, products: Product[]) =>
    (error: (ValidationFailure | SystemFailure)) => {

      const systemError = error as SystemFailure;
      const validationError = error as ValidationFailure;

      if (systemError.error && (!systemError.documentNumber || systemError.documentNumber === documentNumber)) {
        return true;
      }

      if (products?.length) {
        const catchMatch =
          (c: Catch) => c?.date === utc(validationError.date).format('YYYY-MM-DD') && c.vessel === validationError.vessel;

        const productMatch = (p: Product) => {
          return p?.speciesCode === validationError.species &&
            p.state?.code === validationError.state &&
            p.presentation?.code === validationError.presentation &&
            p.caughtBy?.length && p.caughtBy.some(catchMatch)
        }

        return validationError && products.some(productMatch);
      }

      return false;
    }

  public static readonly hasLandingData = (products: Product[]) => {
    if (products !== undefined && products.length > 0) {
      return products.every(item => {
        return !isEmpty(item.caughtBy);
      });
    }

    return false;
  }

  public static readonly hasCCExporterDetails = (exporterDetails: CcExporterDetails, requestByAdmin: boolean): boolean => {
    if (!isEmpty(exporterDetails)) {

      const expected: string[] = requestByAdmin ? [
        'exporterFullName', 'exporterCompanyName', 'addressOne', 'postcode'
      ] : [
        'exporterFullName', 'exporterCompanyName', 'addressOne', 'postcode', 'contactId'
      ];

      return expected.every(prop => ProgressService.isEmptyAndTrimSpaces(exporterDetails[prop]));
    }

    return false;
  }

  public static readonly getExporterDetails = (exporterDetails: ExporterDetails, requestByAdmin: boolean): ProgressStatus => {
    if (!isEmpty(exporterDetails)) {

      const expected: string[] = requestByAdmin ? [
        'exporterCompanyName',
        'addressOne',
        'postcode'
      ] : [
        'exporterCompanyName',
        'addressOne',
        'postcode',
        'contactId'
      ];

      return expected.every((value) => ProgressService.isEmptyAndTrimSpaces(exporterDetails[value])) ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
    }

    return ProgressStatus.INCOMPLETE;
  }

  public static readonly getArrivalTransportStatus = (arrival?: boolean): ProgressStatus =>
    arrival ? ProgressStatus.OPTIONAL : ProgressStatus.INCOMPLETE;

  public static readonly getTransportationStatus = (journey: string): ProgressStatus =>
    journey === "storageNotes" ? ProgressStatus.INCOMPLETE : ProgressStatus.CANNOT_START;

  public static readonly getRequiredArrivalExpectedValues = (vehicle: string): string[] => {
    let expected: string[];

    switch (vehicle) {
      case truck:
        expected = ['vehicle', 'nationalityOfVehicle', 'registrationNumber', 'freightBillNumber', 'departurePort', 'departureDate', 'departureCountry'];
        break;
      case train:
        expected = ['vehicle', 'railwayBillNumber', 'freightBillNumber', 'departurePort', 'departureDate', 'departureCountry'];
        break;
      case plane:
        expected = ['vehicle', 'airwayBillNumber', 'flightNumber', 'containerNumbers', 'freightBillNumber', 'departurePort', 'departureDate', 'departureCountry'];
        break;
      case containerVessel:
        expected = ['vehicle', 'vesselName', 'flagState', 'freightBillNumber', 'containerNumbers', 'departurePort', 'departureDate', 'departureCountry'];
        break;
      default:
        expected = []
    }

    return expected;
  }

  public static readonly getArrivalTransportCompleteStatus = (transportation: Transport, arrival?: boolean): ProgressStatus => {
    if (arrival) {
      return this.getRequiredArrivalExpectedValues(transportation.vehicle).every(prop => ProgressService.isEmptyAndTrimSpaces(transportation[prop])) ? ProgressStatus.COMPLETED : ProgressStatus.OPTIONAL;
    }

    return ProgressStatus.COMPLETED;
  }

  public static readonly getTransportDetailsStatus = (transportation: Transport, journey?: string, arrival?: boolean) => {
    const isTruck = transportation.vehicle === 'truck';
    const hasCmr = isTruck && transportation.cmr === 'true';

    if (hasCmr) {
      return ProgressStatus.COMPLETED;
    }

    let schema;

    switch (transportation.vehicle) {
      case truck:
        schema = truckSchema
        break;
      case train:
        schema = trainSchema;
        break;
      case plane:
        schema = planeSchema;
        break;
      case containerVessel:
        schema = containerVesselSchema;
        break;
      default:
        schema = null;
    }

    if (!schema) {
      return this.getArrivalTransportStatus(arrival);
    }

    const { error } = schema.validate({ ...transportation, journey, exportDateTo: journey === "storageNotes" && moment().startOf("day").add(1, "day").toISOString(), arrival });
    if (error) {
      return this.getArrivalTransportStatus(arrival);
    }

    return this.getArrivalTransportCompleteStatus(transportation, arrival);
  }

  public static readonly getTransportDetails = (transportation: Transport, journey?: string, arrival?: boolean): ProgressStatus => {
    if (ProgressService.isEmptyAndTrimSpaces(transportation?.vehicle)) {
      return this.getTransportDetailsStatus(transportation, journey, arrival);
    }

    if (arrival) {
      return ProgressStatus.OPTIONAL;
    }

    return this.getTransportationStatus(journey)
  }

  public static readonly getCatchCertificateTransportDetails = (
    transportations: CatchCertificateTransport[]
  ): ProgressStatus => {
    const allHaveVehicles = transportations.every((transportation: CatchCertificateTransport) =>
      ProgressService.isEmptyAndTrimSpaces(
        FrontEndCatchCertificateTransport.toFrontEndTransport(transportation)?.vehicle
      )
    );

    if (allHaveVehicles) {

      const isValidTransportDocument = (doc: FrontEndCatchCertificateTransport.CatchCertificateTransportDocument) =>
        ProgressService.isEmptyAndTrimSpaces(doc.name) && ProgressService.isEmptyAndTrimSpaces(doc.reference);

      const transportationIsIncomplete: boolean = transportations.some((transportation: CatchCertificateTransport) => {
        const frontEndTransportation: FrontEndCatchCertificateTransport.CatchCertificateTransport = FrontEndCatchCertificateTransport.toFrontEndTransport(transportation);
        const bypassForTruckCMR = frontEndTransportation.cmr === 'false' || !frontEndTransportation.cmr;
        const payload = { ...frontEndTransportation };
        delete payload.cmr;
        const { error } = catchCertificateTransportDetailsSchema.validate(payload);
        const hasValidationError = bypassForTruckCMR && error;
        const missingTransportationDetails = bypassForTruckCMR && !frontEndTransportation.departurePlace
        const transportationDocumentIncomplete = bypassForTruckCMR && Array.isArray(frontEndTransportation.documents) && !frontEndTransportation.documents.every(isValidTransportDocument);

        return hasValidationError || missingTransportationDetails || transportationDocumentIncomplete;
      })

      if (transportationIsIncomplete) {
        return ProgressStatus.INCOMPLETE;
      } else {
        return ProgressStatus.COMPLETED;
      }
    }

    return ProgressStatus.CANNOT_START;
  };

  public static readonly getPSCatchStatus = async (catches: ProcessingStatement.Catch[], documentNumber: string, userPrincipal: string, contactId: string): Promise<ProgressStatus> => {
    if (catches === undefined || catches.length <= 0) {
      return ProgressStatus.INCOMPLETE;
    }

    if (!catches.every(
      (singleCatch: ProcessingStatement.Catch) => [
        'id',
        'species',
        'catchCertificateNumber',
        'totalWeightLanded',
        'exportWeightBeforeProcessing',
        'exportWeightAfterProcessing'
      ].every((key: string) => {
        return ProgressService.isEmptyAndTrimSpaces(singleCatch[key])
      })
    )) {
      return ProgressStatus.INCOMPLETE;
    }

    const ctchDetailsErrors = {};

    for (const ctch in catches) {
      await validateCatchDetails(catches[ctch], parseInt(ctch), ctchDetailsErrors, documentNumber, userPrincipal, contactId);
      validateCatchWeights(catches[ctch], parseInt(ctch), ctchDetailsErrors);
    }

    return Object.keys(ctchDetailsErrors).length <= 0 ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  public static readonly getConsignmentDescriptionStatus = (exportData: ProcessingStatement.ExportData): ProgressStatus => {
    const hasValidProductDescriptions = (productDescriptions: ProcessingStatement.Product[]) => {
      if (!Array.isArray(productDescriptions) || productDescriptions.length <= 0) {
        return false;
      }

      return productDescriptions.every((productDescription: ProcessingStatement.Product) => {
        if (!productDescription.commodityCode || validateWhitespace(productDescription.commodityCode)) {
          return false;
        }

        if (!productDescription.description || validateWhitespace(productDescription.description) || isInvalidLength(productDescription.description, 0, 50)) {
          return false;
        }

        return true;
      });
    }

    return exportData?.consignmentDescription?.trim() || hasValidProductDescriptions(exportData?.products)
      ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  public static isEmptyAndTrimSpaces(propertyValue: any): boolean {
    if (typeof propertyValue === 'string') {
      return !isEmpty(propertyValue) && propertyValue.trim() !== '';
    }

    return !isEmpty(propertyValue) ? Object.keys(propertyValue).every(key => typeof propertyValue[key] === 'string' && propertyValue[key].trim() !== '') : false
  }

  public static readonly getSDCatchStatus = async (catches: StorageDocument.Catch[], userPrincipal: string, documentNumber: string, contactId: string): Promise<ProgressStatus> => {
    let status: boolean[] = [];

    if (catches !== undefined && catches.length > 0) {
      status = await Promise.all(catches.map(
        async (singleCatch, index) => {
          const productErrors: { errors: any } = await validateProduct(singleCatch, index, {});
          const entryErrors: { errors: any } = await validateEntry(singleCatch, index, {}, documentNumber, userPrincipal, contactId);

          return [
            'product',
            'id',
            'commodityCode',
            'certificateNumber',
            'certificateType',
            'weightOnCC'
          ].every(value => ProgressService.isEmptyAndTrimSpaces(singleCatch[value]) && Object.keys(productErrors.errors).length <= 0 && Object.keys(entryErrors.errors).length <= 0)
        }
      ));
    }

    return status.length > 0 && status.every(isValid => isValid === true) ?
      ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  public static readonly getStorageFacilitiesStatus = (storageFacilities: StorageDocument.StorageFacility[]): ProgressStatus => {
    const storageFacilitiesStatusCheck: (sf: StorageDocument.StorageFacility) => boolean = (sf: StorageDocument.StorageFacility) =>
      ProgressService.isEmptyAndTrimSpaces(sf['facilityName']) && ProgressService.isEmptyAndTrimSpaces(sf['facilityAddressOne']) && ProgressService.isEmptyAndTrimSpaces(sf['facilityTownCity']) && ProgressService.isEmptyAndTrimSpaces(sf['facilityPostcode'])

    return (storageFacilities !== undefined && storageFacilities.length > 0) && storageFacilities.every(storageFacilitiesStatusCheck)
      ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  public static readonly getUserReference = (userReference: string): ProgressStatus => {
    return ProgressService.isEmptyAndTrimSpaces(userReference)
      ? ProgressStatus.COMPLETED
      : ProgressStatus.OPTIONAL;
  }

  public static readonly getExportDestinationStatus = (exportedTo: ICountry): ProgressStatus => {
    return ['officialCountryName'].every((key: string) => ProgressService.isEmptyAndTrimSpaces(exportedTo?.[key])) ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE;
  }

  public static async getProcessingStatementProgress(userPrincipal: string, documentNumber: string, contactId: string): Promise<Progress> {
    logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`);

    const data = await ProcessingStatementService.getDraft(userPrincipal, documentNumber, contactId);

    logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][SUCCEEDED][${JSON.stringify(data)}]`);

    const hasValidHeathCertificateDate = (date: string): boolean => {
      const formattedDate = moment(
        date,
        ["DD/MM/YYYY", "DD/M/YYYY", "D/MM/YYYY", "D/M/YYYY"],
        true
      );
      return formattedDate.isValid() && formattedDate.isBefore(moment(Date.now()).add(8, 'days'));    // Todays date + 7 days advance as FI0-4667
    }

    const hasValidHealthCertificate = (exportHealthCertificate: string): boolean =>
      /^\d{2}\/\d\/\d{6}$/.test(exportHealthCertificate);

    const processingPlant =
      data?.exportData?.plantApprovalNumber?.trim() &&
        data.exportData.personResponsibleForConsignment?.trim()
        ? ProgressStatus.COMPLETED
        : ProgressStatus.INCOMPLETE;
    const processingPlantAddress =
      data?.exportData?.plantPostcode &&
        data.exportData.plantAddressOne &&
        ProgressService.isEmptyAndTrimSpaces(data.exportData.plantName)
        ? ProgressStatus.COMPLETED
        : ProgressStatus.INCOMPLETE;
    const exportHealthCertificate =
      hasValidHealthCertificate(data?.exportData?.healthCertificateNumber) &&
        hasValidHeathCertificateDate(data?.exportData?.healthCertificateDate)
        ? ProgressStatus.COMPLETED
        : ProgressStatus.INCOMPLETE;

    const psProgress = {
      reference: ProgressService.getUserReference(data?.userReference),
      exporter: ProgressService.getExporterDetails(data?.exportData?.exporterDetails, data?.requestByAdmin),
      catches: await ProgressService.getPSCatchStatus(data?.exportData?.catches, documentNumber, userPrincipal, contactId),
      consignmentDescription: ProgressService.getConsignmentDescriptionStatus(data?.exportData),
      processingPlant,
      processingPlantAddress,
      exportHealthCertificate,
      exportDestination: ProgressService.getExportDestinationStatus(data?.exportData?.exportedTo)
    };

    const requiredSectionsLength = Object.keys(psProgress).filter((key) => key !== "reference").length;

    return {
      progress: psProgress,
      requiredSections: requiredSectionsLength,
      completedSections: ProgressService.getCompletedSectionsNumber(psProgress),
    };
  }

  public static async getStorageDocumentProgress(userPrincipal: string, documentNumber: string, contactId: string): Promise<Progress> {
    logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`);

    const data = await StorageDocumentService.getDraft(userPrincipal, documentNumber, contactId);
    const catchesStatus: ProgressStatus = await ProgressService.getSDCatchStatus(data?.exportData?.catches, userPrincipal, documentNumber, contactId);
    const departureTransportation: ProgressStatus = ProgressService.getTransportDetails(checkTransportDataFrontEnd(toFrontEndTransport(data?.exportData?.transportation)), "storageNotes");

    logger.info(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][SUCCEEDED][${JSON.stringify(data)}]`);

    const isArrivalDepartureWeightsComplete: boolean = catchesStatus === ProgressStatus.COMPLETED && data?.exportData?.catches.every((ctch: StorageDocument.Catch) => !isEmpty(ctch.productWeight));
    const sdProgress = {
      reference: ProgressService.getUserReference(data?.userReference),
      exporter: ProgressService.getExporterDetails(data?.exportData?.exporterDetails, data?.requestByAdmin),
      catches: catchesStatus,
      storageFacilities: ProgressService.getStorageFacilitiesStatus(data?.exportData?.storageFacilities),
      transportDetails: departureTransportation === ProgressStatus.COMPLETED && isArrivalDepartureWeightsComplete ? ProgressStatus.COMPLETED : ProgressStatus.INCOMPLETE,
      arrivalTransportationDetails: data?.exportData?.arrivalTransportation ? ProgressService.getTransportDetails(toFrontEndTransport(data.exportData.arrivalTransportation), "storageNotes", true) : ProgressStatus.OPTIONAL
    };

    const requiredSectionsLength = Object.keys(sdProgress).filter((key) => key !== "reference" && key !== "arrivalTransportationDetails").length;

    return {
      progress: sdProgress,
      requiredSections: requiredSectionsLength,
      completedSections: ProgressService.getCompletedSectionsNumber(sdProgress),
    };
  }
}
