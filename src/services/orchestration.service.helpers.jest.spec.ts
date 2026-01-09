import * as Service from './orchestration.service'
import { ExporterDetails } from '../persistence/schema/common'
import * as ProcessingStatementService from '../persistence/services/processingStatement'
import { toFrontEndPsAndSdExporterDetails } from '../persistence/schema/frontEndModels/exporterDetails'
import { loadRequiredData, processingStatement, storageNote } from './orchestration.service'
import { toFrontEndProcessingStatementExportData } from '../persistence/schema/processingStatement'
import * as StorageDocumentService from '../persistence/services/storageDoc'
import { toFrontEndStorageDocumentExportData } from '../persistence/schema/storageDoc'

describe('helper functions', () => {
  const contactId = 'contactBob';

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('validateExportHealthCertificateFormat()', () => {
    it('should identify correct health certificate number format', () => {
      let result = Service.validateExportHealthCertificateFormat('0/0/000000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('000/0/00000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('x/0/000000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('xx/00/00000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/00000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/x/000000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/00000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/0/x00000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/0x0000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/00x000');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/000x00');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/0000x0');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/00/00000x');
      expect(result).toBeFalsy()

      result = Service.validateExportHealthCertificateFormat('00/0/000000');
      expect(result).toBeTruthy()
    })
  });

  describe('validateCCNumberFormat()', () => {
    it('should identify correct catch certificate format', () => {
      let result = Service.validateCCNumberFormat(' CC-12/34\\- BR.96 ');
      expect(result).toBeTruthy();

      result = Service.validateCCNumberFormat('CC-1234');
      expect(result).toBeTruthy();

      result = Service.validateCCNumberFormat('CC/1234');
      expect(result).toBeTruthy();

      result = Service.validateCCNumberFormat("CC\\1234");
      expect(result).toBeTruthy();

      result = Service.validateCCNumberFormat('CC. 1234');
      expect(result).toBeTruthy();
    });

    it('should identify incorrect catch certificate format', () => {
      let result = Service.validateCCNumberFormat('CC-(1234)');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC_1234');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC*1234');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC:1234');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC 1234!');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC<1234>');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC@1234');
      expect(result).toBeFalsy();

      result = Service.validateCCNumberFormat('CC 1234, 1235');
      expect(result).toBeFalsy();
    })
  });

  describe('validatePersonResponsibleForConsignment()', () => {
    it('should identify correct person responsible correct format', () => {
      let result = Service.validatePersonResponsibleForConsignmentFormat('Sherlock Holmes');
      expect(result).toBeTruthy();

      result = Service.validatePersonResponsibleForConsignmentFormat("Shelock O'Holmes");
      expect(result).toBeTruthy();

      result = Service.validatePersonResponsibleForConsignmentFormat("Shelock O’Holmes");
      expect(result).toBeTruthy();

      result = Service.validatePersonResponsibleForConsignmentFormat("William Sherlock-Scott Holmes");
      expect(result).toBeTruthy();
    });

    it('should identify incorrect catch certificate format', () => {
      let result = Service.validatePersonResponsibleForConsignmentFormat('Sherl0ck Holmes 1');
      expect(result).toBeFalsy();

      result = Service.validatePersonResponsibleForConsignmentFormat('Sherlock Holmes ***');
      expect(result).toBeFalsy();

      result = Service.validatePersonResponsibleForConsignmentFormat('Sherlock_Holmes');
      expect(result).toBeFalsy();

      result = Service.validatePersonResponsibleForConsignmentFormat('Sherlock Holmes 221B');
      expect(result).toBeFalsy();

      result = Service.validatePersonResponsibleForConsignmentFormat('Sherlock Homes & Moriarty');
      expect(result).toBeFalsy();
    })
  });

  describe('validateTransportUnloadedFromFormat()', () => {
    it('should identify correct transport details format', () => {
      let result = Service.isPlantApprovalNumberFormatValid('vehicle registration');
      expect(result).toBeTruthy();

      result = Service.isPlantApprovalNumberFormatValid("veh1cle reg1stration : \\1234/");
      expect(result).toBeTruthy();

      result = Service.isPlantApprovalNumberFormatValid("vehicle-registration,  vehicle registration: 2");
      expect(result).toBeTruthy();
    });

    it('should identify incorrect transport details format', () => {
      let result = Service.isPlantApprovalNumberFormatValid('vehicle registration; 1');
      expect(result).toBeFalsy();

      result = Service.isPlantApprovalNumberFormatValid('vehicle_registration 1');
      expect(result).toBeFalsy();

      result = Service.isPlantApprovalNumberFormatValid('vehicle registration + flight number');
      expect(result).toBeFalsy();
    })
  });

  describe('validate_isPlaceProductEntersUkValid()', () => {
    it('should identify correct Place product entered the UK', () => {
      let result = Service.isPlaceProductEntersUkValid('Dover');
      expect(result).toBeTruthy();

      result = Service.isPlaceProductEntersUkValid("Great Up & Little Up, hills in The Lake District, UK");
      expect(result).toBeTruthy();

      result = Service.isPlaceProductEntersUkValid("AAAaaas-, (the) / ; & ");
      expect(result).toBeTruthy();
    });

    it('should identify incorrect transport details format', () => {
      let result = Service.isPlaceProductEntersUkValid('!Dover');
      expect(result).toBeFalsy();

      result = Service.isPlaceProductEntersUkValid('$Dover£');
      expect(result).toBeFalsy();

      result = Service.isPlaceProductEntersUkValid('Dover ! London');
      expect(result).toBeFalsy();
    })
  });

  describe('loadRequiredData', () => {
    let mockGetDraftData: jest.SpyInstance;
    const exporterDetails: ExporterDetails = {
      contactId : 'a contact Id',
      accountId  : 'an account id',
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      addressTwo: "London",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: {someData: 'original data'},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    beforeAll(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('case processingStatement', async () => {
      const data = {
        exportData : {
          catches: [{
            species: "Astronesthes niger (AHR)",
            id: '12345-1610018899',
            catchCertificateNumber: "2342234",
            totalWeightLanded: "34",
            exportWeightBeforeProcessing: "34",
            exportWeightAfterProcessing: "45",
            scientificName: 'scientificName'
          }],
          consignmentDescription: "code",
          healthCertificateNumber: "567567",
          healthCertificateDate: "27/10/2019",
          personResponsibleForConsignment: "Isaac",
          plantApprovalNumber: "456456",
          plantName: "Plant Name",
          plantAddressOne: "London",
          plantAddressTwo: "London",
          plantTownCity: "London",
          plantPostcode: "SE37 6YH",
          dateOfAcceptance: "12/02/2020",
          exporterDetails: exporterDetails,
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        }};

      mockGetDraftData = jest.spyOn(ProcessingStatementService, 'getDraft');
      mockGetDraftData.mockReturnValue(data);
      const frontEndExporterDetails = toFrontEndPsAndSdExporterDetails(data.exportData.exporterDetails);
      frontEndExporterDetails.model.journey = processingStatement;
      const expectedResult = {
        data: toFrontEndProcessingStatementExportData(data.exportData),
        exporter: frontEndExporterDetails
      };

      const result = await loadRequiredData('user-principal', 'document-number', processingStatement, contactId);

      expect(result).toEqual(expectedResult);
    });

    it('case storageNote', async () => {
      const data = {
        test: "test",
        exportData : {
          catches: [{
            product: "Atlantic herring (HER)",
            id: '12345-1610018899',
            commodityCode: "12345",
            productWeight: "45",
            dateOfUnloading: "28/01/2020",
            placeOfUnloading: "London",
            transportUnloadedFrom: "12345",
            certificateNumber: "12345",
            weightOnCC: "45"
          }],
          storageFacilities: [{
            facilityName: "Storage Facilities",
            facilityAddressOne: "Build and Street",
            facilityTownCity: "Essex",
            facilityPostcode: "ES8 7UJ",
            facilitySubBuildingName: "Sub building name",
            facilityBuildingNumber: null,
            facilityBuildingName: "Building name",
            facilityStreetName: "Street name",
            facilityCounty: "Ealing",
            facilityCountry: "United Kingdom of Great Britain and Northern Ireland"

          }],
          exporterDetails: exporterDetails,
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        }
      };
      mockGetDraftData = jest.spyOn(StorageDocumentService, 'getDraft');
      mockGetDraftData.mockReturnValue(data);
      const frontEndExporterDetails = toFrontEndPsAndSdExporterDetails(data.exportData.exporterDetails);
      frontEndExporterDetails.model.journey = storageNote;
      const expectedResult = {
        data: toFrontEndStorageDocumentExportData(data.exportData),
        exporter: frontEndExporterDetails
      };

      const result = await loadRequiredData('user-principal', 'document-number', storageNote, contactId);

      expect(result).toEqual(expectedResult);
    });
  });
});
