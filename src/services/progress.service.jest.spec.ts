import ProgressService from './progress.service';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as DocumentValidator from '../validators/documentValidator';
import * as FishValidator from '../validators/fish.validator';
import * as CommodityCodeValidator from '../validators/pssdCommodityCode.validator';
import SummaryErrorsService from './summaryErrors.service';
import { ProgressStatus } from '../persistence/schema/common';
import { Progress } from '../persistence/schema/frontEndModels/payload';
import logger from '../logger';
import { Transport } from '../persistence/schema/frontEndModels/transport';

describe('progressService', () => {
  describe('get', () => {
    const documentNumber = 'document123';
    const userPrincipal = 'Bob';
    const contactId = 'contactBob';
    const exporterDetails = {
      contactId: 'some-guid-contactId',
      exporterFullName: 'Dora',
      exporterCompanyName: 'Capgem',
      addressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
      subBuildingName: 'MMO',
      buildingName: 'LANCASTER HOUSE',
      streetName: 'HAMPSHIRE COURT',
      county: 'TYNESIDE',
      country: 'ENGLAND',
      townCity: 'NEWCASTLE UPON TYNE',
      postcode: 'NE4 7YH',
    };
    const product = {
      species: 'Atlantic cod (COD)',
      speciesId: 'GBR-2021-CC-757029CB7-5bb47f61-3d74-4f3c-a081-c69174cc35e4',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      commodityCode: '03044410',
      commodityCodeDescription:
        'Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macrocephalus" and of Boreogadus saida',
      state: {
        code: 'FRE',
        name: 'Fresh',
      },
      presentation: {
        code: 'FIL',
        name: 'Filleted',
      },
    };

    let mockGetDraft;
    let mockGetSummaryErrors;

    beforeEach(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockGetDraft.mockResolvedValue(null);

      mockGetSummaryErrors = jest.spyOn(SummaryErrorsService, 'get');
      mockGetSummaryErrors.mockResolvedValue(null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('will return null if there is no document data', async () => {
      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual(null);
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return null if there is no exportData', async () => {
      mockGetDraft.mockResolvedValue({ data: {} });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual(null);
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return null if there is exportData but no landingsTypeOption', async () => {
      mockGetDraft.mockResolvedValue({ exportData: {} });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual(null);
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return the progress data if the landing type is Manual Entry', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          exporterDetails,
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 1,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will not show transport details in the progress page if vehicle is directLanding and landingsEntryOption is uploadEntry', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          exporterDetails,
          transportation: {
            vehicle: 'directLanding',
            exportedFrom: 'United Kingdom',
            exportedTo: {
              officialCountryName: 'Afghanistan',
              isoCodeAlpha2: 'AF',
              isoCodeAlpha3: 'AFG',
              isoNumericCode: '004',
            },
            departurePlace: 'London Heathrow',
          },
          landingsEntryOption: 'uploadEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          dataUpload: '',
          exportJourney: 'COMPLETED',
        },
        requiredSections: 5,
        completedSections: 2,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return the progress data if the landing type is Direct Landing', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          exporterDetails,
          landingsEntryOption: 'directLanding',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
        },
        requiredSections: 5,
        completedSections: 1,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return the progress data if the landing type is Data Upload', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          exporterDetails,
          landingsEntryOption: 'uploadEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          dataUpload: '',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 1,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return the COMPLETED products but not landings in the progress data', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [
            {
              ...product,
              caughtBy: [],
            },
          ],
          exporterDetails,
          landingsEntryOption: 'directLanding',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'COMPLETED',
          landings: 'INCOMPLETE',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
        },
        requiredSections: 5,
        completedSections: 2,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return the COMPLETED products and COMPLETED LANDINGS in the progress data', async () => {
      mockGetDraft.mockResolvedValue({
        userReference: 'TestTEst',
        exportData: {
          products: [
            {
              ...product,
              caughtBy: [
                {
                  numberOfSubmissions: 0,
                  vessel: 'MOYUNA',
                  pln: 'CY389',
                  homePort: 'UNKNOWN',
                  flag: 'GBR',
                  cfr: 'GBRC17536',
                  imoNumber: null,
                  licenceNumber: '50298',
                  licenceValidTo: '2027-12-31T00:00:00',
                  id: 'GBR-2021-CC-757029CB7-1638174370',
                  date: '2021-11-27',
                  faoArea: 'FAO27',
                  weight: 5,
                },
              ],
            },
          ],
          exporterDetails,
          landingsEntryOption: 'directLanding',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'COMPLETED',
          exporter: 'COMPLETED',
          products: 'COMPLETED',
          landings: 'COMPLETED',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
        },
        requiredSections: 5,
        completedSections: 3,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return conservation COMPLETED and INCOMPLETE trasportDetails if the user adds a vehicle but no details', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          transportation: {
            vehicle: 'plane',
            exportedFrom: 'United Kingdom',
            exportedTo: {
              officialCountryName: 'Afghanistan',
              isoCodeAlpha2: 'AF',
              isoCodeAlpha3: 'AFG',
              isoNumericCode: '004',
            },
          },
          conservation: {
            conservationReference: 'UK Fisheries Policy',
          },
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'INCOMPLETE',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'COMPLETED',
          exportJourney: 'COMPLETED',
          transportType: 'COMPLETED',
          transportDetails: 'INCOMPLETE',
        },
        requiredSections: 7,
        completedSections: 3,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED trasportDetails if the user adds a vehicle and the transport details', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          transportation: {
            vehicle: 'plane',
            exportedFrom: 'United Kingdom',
            exportedTo: {
              officialCountryName: 'Afghanistan',
              isoCodeAlpha2: 'AF',
              isoCodeAlpha3: 'AFG',
              isoNumericCode: '004',
            },
            flightNumber: '3456',
            containerNumber: '34567',
            departurePlace: 'London',
          },
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'INCOMPLETE',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'COMPLETED',
          transportType: 'COMPLETED',
          transportDetails: 'COMPLETED',
        },
        requiredSections: 7,
        completedSections: 3,
      });
      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will count the landings section as completed if it has errors', async () => {
      mockGetSummaryErrors.mockResolvedValue([
        {
          species: 'COD',
          state: 'FRE',
          presentation: 'FIL',
          date: new Date('2021-11-27'),
          vessel: 'MOYUNA',
          rules: ['rule1'],
        },
      ]);

      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [
            {
              ...product,
              caughtBy: [
                {
                  vessel: 'MOYUNA',
                  date: '2021-11-27',
                },
              ],
            },
          ],
          exporterDetails,
          transportation: {
            vehicle: 'plane',
            exportedFrom: 'United Kingdom',
            flightNumber: 'BA078',
            containerNumber: '0123456789',
            exportedTo: {
              officialCountryName: 'Afghanistan',
              isoCodeAlpha2: 'AF',
              isoCodeAlpha3: 'AFG',
              isoNumericCode: '004',
            },
            departurePlace: 'London Heathrow',
          },
          conservation: {
            conservationReference: 'UK Fisheries Policy',
          },
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'COMPLETED',
          landings: 'ERROR',
          conservation: 'COMPLETED',
          exportJourney: 'COMPLETED',
          transportType: 'COMPLETED',
          transportDetails: 'COMPLETED',
        },
        requiredSections: 7,
        completedSections: 7,
      });
    });

    it('will return exporter details as COMPLETE without townCity', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          landingsEntryOption: 'manualEntry',
          exporterDetails: {
            contactId: 'some-guid-contact-id',
            exporterFullName: 'Kilambi Rama',
            exporterCompanyName:
              'Rama Phalguni Kilambi Venkata  export company services ',
            addressOne: '12, ',
            buildingNumber: '12',
            subBuildingName: null,
            buildingName: null,
            streetName: null,
            county: null,
            country: 'United Kingdom of Great Britain and Northern Ireland',
            townCity: null,
            postcode: '2NE4 7YH',
          },
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 1,
      });

      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return exporter details as INCOMPLETE without contact id', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          landingsEntryOption: 'manualEntry',
          exporterDetails: {
            exporterFullName: 'Kilambi Rama',
            exporterCompanyName:
              'Rama Phalguni Kilambi Venkata  export company services ',
            addressOne: '12, ',
            buildingNumber: '12',
            subBuildingName: null,
            buildingName: null,
            streetName: null,
            county: null,
            country: 'United Kingdom of Great Britain and Northern Ireland',
            townCity: null,
            postcode: '2NE4 7YH',
          },
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'INCOMPLETE',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 0,
      });

      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return exporter details as COMPLETE without contact id for an admin certificate', async () => {
      mockGetDraft.mockResolvedValue({
        requestByAdmin: true,
        exportData: {
          products: [],
          landingsEntryOption: 'manualEntry',
          exporterDetails: {
            exporterFullName: 'Kilambi Rama',
            exporterCompanyName:
              'Rama Phalguni Kilambi Venkata  export company services ',
            addressOne: '12, ',
            buildingNumber: '12',
            subBuildingName: null,
            buildingName: null,
            streetName: null,
            county: null,
            country: 'United Kingdom of Great Britain and Northern Ireland',
            townCity: null,
            postcode: '2NE4 7YH',
          },
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'COMPLETED',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 1,
      });

      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return exporter details as INCOMPLETE when not found in export data', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'INCOMPLETE',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 0,
      });

      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return exporter details as INCOMPLETE when details found are without all the required fields in export data', async () => {
      mockGetDraft.mockResolvedValue({
        exportData: {
          products: [],
          exporterDetails: {
            addressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
            subBuildingName: 'MMO',
            buildingName: 'LANCASTER HOUSE',
            streetName: 'HAMPSHIRE COURT',
            county: 'TYNESIDE',
            country: 'ENGLAND',
            townCity: 'NEWCASTLE UPON TYNE',
            postcode: 'NE4 7YH',
          },
          landingsEntryOption: 'manualEntry',
        },
      });

      const result = await ProgressService.get(
        userPrincipal,
        documentNumber,
        contactId
      );

      expect(result).toStrictEqual({
        progress: {
          reference: 'OPTIONAL',
          exporter: 'INCOMPLETE',
          products: 'INCOMPLETE',
          landings: 'CANNOT START',
          conservation: 'INCOMPLETE',
          exportJourney: 'INCOMPLETE',
          transportType: 'INCOMPLETE',
          transportDetails: 'CANNOT START',
        },
        requiredSections: 7,
        completedSections: 0,
      });

      expect(mockGetDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });
  });

  describe('getLandingStatus', () => {
    const userPrincipal = 'Bob';
    const documentNumber = 'document123';
    const contactId = 'contactBob';
    const products = ['product1', 'product2'] as any[];

    let mockGetSummaryErrors;
    let mockHasLandingData;
    let mockFilterErrors;

    beforeEach(() => {
      mockGetSummaryErrors = jest.spyOn(SummaryErrorsService, 'get');
      mockGetSummaryErrors.mockResolvedValue(null);

      mockHasLandingData = jest.spyOn(ProgressService, 'hasLandingData');
      mockHasLandingData.mockReturnValue(false);

      mockFilterErrors = jest.spyOn(ProgressService, 'filterErrors');
      mockFilterErrors.mockReturnValue(() => false);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('will return ERROR if there are summary errors', async () => {
      mockGetSummaryErrors.mockResolvedValue(['error']);
      mockFilterErrors.mockReturnValue(() => true);

      const result = await ProgressService.getLandingsStatus(
        userPrincipal,
        documentNumber,
        products,
        contactId
      );

      expect(result).toBe(ProgressStatus.ERROR);
    });

    it('will not return ERROR if the summary errors are filtered out', async () => {
      mockGetSummaryErrors.mockResolvedValue(['error']);

      const result = await ProgressService.getLandingsStatus(
        userPrincipal,
        documentNumber,
        products,
        contactId
      );

      expect(result).not.toBe(ProgressStatus.ERROR);
    });

    it('will return INCOMPLETE if the products are not complete', async () => {
      const result = await ProgressService.getLandingsStatus(
        userPrincipal,
        documentNumber,
        products,
        contactId
      );

      expect(result).toBe(ProgressStatus.INCOMPLETE);
    });

    it('will return CANNOT START if there are no products', async () => {
      const result = await ProgressService.getLandingsStatus(
        userPrincipal,
        documentNumber,
        [],
        contactId
      );

      expect(result).toBe(ProgressStatus.CANNOT_START);
    });

    it('will return COMPLETE if everything is complete', async () => {
      mockHasLandingData.mockReturnValue(true);

      const result = await ProgressService.getLandingsStatus(
        userPrincipal,
        documentNumber,
        products,
        contactId
      );

      expect(result).toBe(ProgressStatus.COMPLETED);
    });
  });

  describe('filterErrors', () => {
    const documentNumber = 'document123';

    const validationFailure = {
      species: 'COD',
      state: 'FRE',
      presentation: 'WHL',
      date: new Date('2020-01-01'),
      vessel: 'WIRON 5',
      rules: ['rule1'],
    };

    it('will return true for system errors without a document number', () => {
      const filter = ProgressService.filterErrors(documentNumber, []);

      expect(filter({ error: 'system error' })).toStrictEqual(true);
    });

    it('will return true for system errors with a matching document number', () => {
      const filter = ProgressService.filterErrors(documentNumber, []);

      expect(filter({ error: 'system error', documentNumber })).toStrictEqual(
        true
      );
    });

    it('will return false for system errors with a non-matching document number', () => {
      const filter = ProgressService.filterErrors(documentNumber, []);

      expect(
        filter({ error: 'system error', documentNumber: 'xxx' })
      ).toStrictEqual(false);
    });

    it('will return true for a validation failure with a matching catch', () => {
      const product = {
        species: 'Atlantic Cod',
        speciesCode: 'COD',
        state: {
          code: 'FRE',
          name: 'Fresh',
        },
        presentation: {
          code: 'WHL',
          name: 'Whole',
        },
        caughtBy: [
          {
            vessel: 'WIRON 5',
            date: '2020-01-01',
          },
          {
            vessel: 'WIRON 5',
            date: '2020-01-02',
          },
        ],
      } as any;

      const filter = ProgressService.filterErrors(documentNumber, [product]);

      expect(filter(validationFailure)).toStrictEqual(true);
    });

    it('will return false for a validation failure without a matching catch', () => {
      const product = {
        species: 'Atlantic Cod',
        speciesCode: 'COD',
        state: {
          code: 'FRE',
          name: 'Fresh',
        },
        presentation: {
          code: 'WHL',
          name: 'Whole',
        },
        caughtBy: [
          {
            vessel: 'WIRON 5',
            date: '2020-01-02',
          },
        ],
      } as any;

      const filter = ProgressService.filterErrors(documentNumber, [product]);

      expect(filter(validationFailure)).toStrictEqual(false);
    });
  });

  describe('getTransportDetails', () => {
    it('should return INCOMPLETE for a incomplete truck', () => {
      const transport = {
        vehicle: 'truck',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
      };

      expect(ProgressService.getTransportDetails(transport)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return COMPLETED for a truck with a cmr', () => {
      const transport: Transport = {
        vehicle: 'truck',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'true'
      };

      expect(ProgressService.getTransportDetails(transport)).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return INCOMPLETED for a truck without a cmr or departure place', () => {
      const transport: Transport = {
        vehicle: 'truck',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
      };

      expect(ProgressService.getTransportDetails(transport)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return COMPLETE for a truck without a cmr but with a departure place', () => {
      const transport: Transport = {
        vehicle: 'truck',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: 'Hull',
      };

      expect(ProgressService.getTransportDetails(transport)).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return CANNOT START if there is no transport type', () => {
      const transport: Transport = {
        vehicle: '',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: 'Hull',
      };

      expect(ProgressService.getTransportDetails(transport)).toBe(
        ProgressStatus.CANNOT_START
      );
    });
  });

  describe('getStorageFacilitiesStatus', () => {
    it('should return INCOMPLETE for incomplete storage facilities', () => {
      const storageFacilities = [
        {
          facilityName: '',
          facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
          facilityBuildingName: 'LANCASTER HOUSE',
          facilityBuildingNumber: '',
        },
      ];

      expect(
        ProgressService.getStorageFacilitiesStatus(storageFacilities)
      ).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return INCOMPLETE for storage facilities with no address details', () => {
      const storageFacilities = [
        {
          facilityName: 'FACILITY',
          facilityAddressOne: '',
          facilityBuildingName: '',
          facilityBuildingNumber: '',
        },
      ];

      expect(
        ProgressService.getStorageFacilitiesStatus(storageFacilities)
      ).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return COMPLETED for incomplete storage facilities', () => {
      const storageFacilities = [
        {
          facilityName: 'FACILITY',
          facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
          facilityBuildingName: 'LANCASTER HOUSE',
          facilityBuildingNumber: '',
          facilityPostcode: 'NE7 4BY',
          facilityTownCity: 'NEWCASTLE UPON TYNE'
        },
      ];

      expect(
        ProgressService.getStorageFacilitiesStatus(storageFacilities)
      ).toBe(ProgressStatus.COMPLETED);
    });
  });

  describe('getUserReference', () => {
    it('should return OPTIONAL for empty userReference', () => {
      expect(ProgressService.getUserReference('')).toBe(
        ProgressStatus.OPTIONAL
      );
    });

    it('should return COMPLETED for completed userReference', () => {
      expect(ProgressService.getUserReference('test1')).toBe(
        ProgressStatus.COMPLETED
      );
    });
  });

  describe('getProcessingStatementProgress', () => {
    const documentNumber = 'document-PS-123';
    const userPrincipal = 'Bob';
    const contactId = 'contactBob';

    let mockProcessingStatementDraft;
    let mockValidateCompletedDocument;
    let mockValidateSpeciesMissing;
    let mockLoggerInfo;

    beforeEach(() => {
      mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
      mockValidateCompletedDocument.mockResolvedValue(true);
      mockValidateSpeciesMissing = jest.spyOn(DocumentValidator, 'validateSpecies');
      mockValidateSpeciesMissing.mockResolvedValue(true);
      mockProcessingStatementDraft = jest.spyOn(
        ProcessingStatementService,
        'getDraft'
      );
      mockProcessingStatementDraft.mockResolvedValue(null);

      mockLoggerInfo = jest.spyOn(logger, 'info');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('will return the progress data', async () => {
      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return 0 completed sections', async () => {
      mockProcessingStatementDraft.mockResolvedValue({ data: {} });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return a progress object if there is an exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({ exportData: {} });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exporter if there is an exporter with addressOne, exporterCompanyName and postcode properties', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED exporter is without a contact id', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETE exporter is without a contact id for an admin', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        requestByAdmin: true,
        exportData: {
          exporterDetails: {
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exporter if there is any of addressOne, exporterCompanyName and postcode in the exporter properties missing', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            addressOne: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED consignmentDescription if there is a consignment description', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          consignmentDescription: 'Commodity code',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.COMPLETED,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED consignmentDescription if there is a list of products', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            description: 'some descriptions',
            commodityCode: '03912345'
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.COMPLETED,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED consignmentDescription if there is a list of products with a product missing a description', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            description: '',
            commodityCode: '03912345'
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED consignmentDescription if there is a list of products with a product missing a commodity code', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            description: 'some product descriptions',
            commodityCode: ''
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED consignmentDescription if there is a list of products with a product that has an undefined description', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            commodityCode: '03912345'
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED consignmentDescription if there is a list of products with a product that has an undefined commodity code', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            description: 'some product descriptions',
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED consignmentDescription if there is a list of products with a product that has a description over 50 characters', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          products: [{
            commodityCode: '01234567',
            description: 'some product descriptions some product descriptions some product descriptions some product descriptions some product descriptions some product descriptions',
          }]
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED catches even if scientific name is missing', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: '',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018899',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: '',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.COMPLETED,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED catches if all of these properties species, id, catchCertificateNumber, totalWeightLanded, exportWeightBeforeProcessing, exportWeightAfterProcessing and scientificName are present in every catch object', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              catchCertificateType: 'non_uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018900',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: 'scientificName',
            },
            {
              species: 'Atlantic herring (COD)',
              id: '2342234-1610018901',
              catchCertificateNumber: 'GBR-2022-CC-123456789',
              catchCertificateType: 'uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.COMPLETED,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE catches if one of the catch object references a non existence COMPLETE catch certificate', async () => {
      mockValidateCompletedDocument.mockResolvedValue(false);
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              catchCertificateType: 'non_uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018900',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: 'scientificName',
            },
            {
              species: 'Atlantic herring (COD)',
              id: '2342234-1610018901',
              catchCertificateNumber: 'GBR-2022-CC-123456789',
              catchCertificateType: 'uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE catches if one of the catches have a UK catchCertificateNumber in an incorrect format', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              catchCertificateType: 'uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018899',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED catches if any of these properties totalWeightLanded, exportWeightBeforeProcessing and exportWeightAfterProcessing are erroneous in any catch object', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              totalWeightLanded: '£$"£kg',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018899',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE catches if at least one of these properties species, id, catchCertificateNumber, totalWeightLanded, exportWeightBeforeProcessing, exportWeightAfterProcessing and scientificName is missing in any of the catch objects', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED catches if at least one of the catches have a UK catch certificate type for which the species is missing on the reference completed catch certificate', async () => {
      mockValidateSpeciesMissing.mockResolvedValue(false);
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              catchCertificateType: 'non_uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
            {
              species: 'Black scabbardfish (BSF)',
              id: '2342234-1610018900',
              catchCertificateNumber: 'GB-123-456-345',
              totalWeightLanded: '170',
              exportWeightBeforeProcessing: '156',
              exportWeightAfterProcessing: '160',
              scientificName: 'scientificName',
            },
            {
              species: 'Atlantic herring (COD)',
              id: '2342234-1610018901',
              catchCertificateNumber: 'GBR-2022-CC-123456789',
              catchCertificateType: 'uk',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
          ],
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED processing plant info if there is all plantName, plantApprovalNumber and plantResponsibleForConsignment', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          personResponsibleForConsignment: 'DILLIP',
          plantApprovalNumber: '12345',
          plantName: 'Plant Name',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.COMPLETED,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE processing plant info if there any of plantApprovalNumber or plantResponsibleForConsignment is missing', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          plantApprovalNumber: '12345',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportDestination if there is no exportedTo', async () => {
      mockProcessingStatementDraft.mockResolvedValue({ exportData: {} });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exportDestination if there is exportedTo in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          exportedTo: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.COMPLETED,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportDestination if any of officialCountryName, isoCodeAlpha2, isoCodeAlpha3 and isoNumericCode is missing in exportedTo', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          exportedTo: {
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exportHealthCertificate if there is healthCertificateDate and healthCertificateNumber in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          healthCertificateNumber: '20/2/123456',
          healthCertificateDate: '27/10/2019',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.COMPLETED,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportHealthCertificate if there is any of healthCertificateDate and healthCertificateNumber missing in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          healthCertificateNumber: '45645',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportHealthCertificate if healthCertificateDate is invalid', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          healthCertificateNumber: '45645',
          healthCertificateDate: 'Invalid Date',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
    });

    it('will return INCOMPLETE exportHealthCertificate if healthCertificateDate is a future date', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          healthCertificateNumber: '45645',
          healthCertificateDate: '20/02/2099',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
    });

    it('will return INCOMPLETE exportHealthCertificate if healthCertificateNumber is invalid', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          healthCertificateNumber: '45',
          healthCertificateDate: '20/10/2010',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
    });

    it('will return INCOMPLETE processingPlantAddress if any of plantName, plantAddressOne and plantPostcode is missing in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          plantAddressOne: 'London',
          plantPostcode: 'SE37 6YH',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED processingPlantAddress if all plantName, plantAddressOne and plantPostcode exist in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          plantName: 'plantName',
          plantAddressOne: 'London',
          plantPostcode: 'SE37 6YH',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.COMPLETED,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE processingPlantAddress if data and exportData is undefined', async () => {
      mockProcessingStatementDraft.mockResolvedValue();

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE processingPlantAddress if there is any of plantName, plantAddressOne and plantPostcode has empty value in exportData', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        exportData: {
          plantName: '   ',
          plantAddressOne: 'London',
          plantPostcode: 'SE37 6YH',
        },
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return requiredSections and completedSections the same number if all are COMPLETED including the user reference', async () => {
      mockProcessingStatementDraft.mockResolvedValue({
        createdBy: 'Bob',
        createdByEmail: 'bob@bob',
        createdAt: new Date('2020-01-01').toISOString(),
        status: 'DRAFT',
        exportData: {
          catches: [
            {
              species: 'Atlantic herring (HER)',
              id: '2342234-1610018899',
              catchCertificateNumber: '12345',
              totalWeightLanded: '34',
              exportWeightBeforeProcessing: '34',
              exportWeightAfterProcessing: '45',
              scientificName: 'scientificName',
            },
          ],
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          consignmentDescription: 'Commodity code',
          healthCertificateNumber: '20/2/123456',
          healthCertificateDate: '27/10/2019',
          personResponsibleForConsignment: 'Isaac',
          plantApprovalNumber: '12345',
          plantName: 'Plant Name',
          plantAddressOne: 'London',
          plantBuildingName: 'plantBuildingName',
          plantBuildingNumber: 'plantBuildingNumber',
          plantSubBuildingName: 'plantSubBuildingName',
          plantStreetName: 'plantStreetName',
          plantCountry: 'plantCountry',
          plantCounty: 'plantCounty',
          plantTownCity: 'London',
          plantPostcode: 'SE37 6YH',
          dateOfAcceptance: '10/02/2020',
          exportedTo: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
        requestByAdmin: false,
        documentUri: '',
        userReference: 'document export',
        draftData: {},
      });

      const result = await ProgressService.getProcessingStatementProgress(
        userPrincipal,
        documentNumber,
        contactId
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.COMPLETED,
          consignmentDescription: ProgressStatus.COMPLETED,
          catches: ProgressStatus.COMPLETED,
          processingPlant: ProgressStatus.COMPLETED,
          processingPlantAddress: ProgressStatus.COMPLETED,
          exportHealthCertificate: ProgressStatus.COMPLETED,
          exportDestination: ProgressStatus.COMPLETED,
        },
        completedSections: 7,
        requiredSections: 7,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-PS-PROGRESS][STARTED]`
      );
      expect(mockProcessingStatementDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });
  });

  describe('getStorageDocumentProgress', () => {
    const documentNumber = 'document-SD-123';
    const userPrincipal = 'Bob';
    const contactId = 'contactBob';

    let mockStorageDocumentDraft;
    let mockLoggerInfo;
    let mockSpeciesNameValid;
    let mockCommodityCodeValid;

    beforeEach(() => {
      mockStorageDocumentDraft = jest.spyOn(StorageDocumentService, 'getDraft');
      mockStorageDocumentDraft.mockResolvedValue(null);
      mockSpeciesNameValid = jest.spyOn(FishValidator, 'validateSpeciesName');
      mockSpeciesNameValid.mockResolvedValue({ isError: false });
      mockCommodityCodeValid = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
      mockCommodityCodeValid.mockResolvedValue({ isError: false });
      mockLoggerInfo = jest.spyOn(logger, 'info');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('will return 0 completed sections', async () => {
      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exporter if there is an exporter with addressOne, exporterCompanyName and postcode properties', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 1,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED exporter if there is no contact id', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exporter if there is no contact id for an admin', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        requestByAdmin: true,
        exportData: {
          exporterDetails: {
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 1,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exporter if there is any of addressOne, exporterCompanyName and postcode in the exporter properties missing', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            addressOne: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED catches even if scientific name is missing', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              product: 'Atlantic cod (COD)',
              commodityCode: '45345454354',
              certificateNumber: 'DSFDSF',
              certificateType: 'non_uk',
              productWeight: '5',
              weightOnCC: '5',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
              transportUnloadedFrom: 'sfdfd',
              id: 'dsfdsf-1643629199',
            },
          ],
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.COMPLETED,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETED catches if any of the weights are invalid', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              product: 'Atlantic cod (COD)',
              commodityCode: '45345454354',
              certificateNumber: 'DSFDSF',
              certificateType: 'non_uk',
              productWeight: '£$"£kg',
              weightOnCC: '£$"£kg',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
              transportUnloadedFrom: 'sfdfd',
              id: 'dsfdsf-1643629199',
            },
          ],
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, 'contactBob');

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`);
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
    });

    it('will return INCOMPLETE catches if any species are invalid', async () => {
      mockSpeciesNameValid.mockResolvedValue({ isError: true });

      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              product: 'Atlantic cod (COD)',
              commodityCode: '45345454354',
              certificateNumber: 'DSFDSF',
              certificateType: 'uk',
              productWeight: '5',
              weightOnCC: '5',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
              transportUnloadedFrom: 'sfdfd',
              id: 'dsfdsf-1643629199',
            },
          ],
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, 'contactBob');

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(`[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`);
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
    });

    it('will return INCOMPLETE catches any of them is missing in any of the required catch objects', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [
            {
              product: 'ASA',
              commodityCode: '45345454332434',
              certificateNumber: 'DSFdfdfsDSF',
              certificateType: 'non_uk',
              productWeight: '5',
              weightOnCC: '5',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
            },
            {
              product: 'Atlantic cod (COD)',
              commodityCode: '45345454354',
              certificateNumber: 'DSFDSF',
              certificateType: 'non_uk',
              productWeight: '5',
              weightOnCC: '5',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
              transportUnloadedFrom: 'sfdfd',
              id: 'dsfdsf-1643629199',
            },
          ],
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportDestination if there is no exportedTo', async () => {
      mockStorageDocumentDraft.mockResolvedValue({ exportData: {} });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return COMPLETED exportDestination if there is exportedTo in exportData', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          exportedTo: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.COMPLETED,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 1,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return INCOMPLETE exportDestination if any of officialCountryName, isoCodeAlpha2, isoCodeAlpha3 and isoNumericCode is missing in exportedTo', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          exportedTo: {
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );

      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
          transportType: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });

    it('will return requiredSections and completedSections the same number if all are COMPLETED including the user reference', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        createdBy: 'Bob',
        createdByEmail: 'bob@bob',
        createdAt: new Date('2020-01-01').toISOString(),
        status: 'DRAFT',
        exportData: {
          catches: [
            {
              product: 'Atlantic cod (COD)',
              commodityCode: '45345454354',
              certificateNumber: 'DSFDSF',
              certificateType: 'non_uk',
              productWeight: '5',
              weightOnCC: '5',
              placeOfUnloading: 'sdfdf',
              dateOfUnloading: '24/01/2022',
              transportUnloadedFrom: 'sfdfd',
              id: 'dsfdsf-1643629199',
            },
          ],
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterCompanyName: 'Exporter Fish Ltd',
            addressOne: 'London',
            streetName: 'London',
            townCity: 'London',
            country: 'UK',
            postcode: 'SE37 6YH',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          storageFacilities: [
            {
              facilityName: 'dora',
              facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
              facilityBuildingName: 'LANCASTER HOUSE',
              facilityBuildingNumber: '',
              facilitySubBuildingName: 'MMO',
              facilityStreetName: 'HAMPSHIRE COURT',
              facilityTownCity: 'NEWCASTLE UPON TYNE',
              facilityCounty: 'TYNESIDE',
              facilityCountry: 'ENGLAND',
              facilityPostcode: 'NE4 7YH',
            },
          ],
          exportedTo: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
          transportation: {
            vehicle: 'plane',
            flightNumber: 'BA078',
            containerNumber: '0123456789',
            exportedFrom: 'United Kingdom',
            exportedTo: {
              officialCountryName: 'Afghanistan',
              isoCodeAlpha2: 'AF',
              isoCodeAlpha3: 'AFG',
              isoNumericCode: '004',
            },
            departurePlace: 'London Heathrow',
          },
        },
        requestByAdmin: false,
        documentUri: '',
        userReference: 'document export',
        draftData: {},
      });

      const result = await ProgressService.getStorageDocumentProgress(
        userPrincipal,
        documentNumber,
        'contactBob'
      );
      const expected: Progress = {
        progress: {
          exporter: ProgressStatus.COMPLETED,
          reference: ProgressStatus.COMPLETED,
          catches: ProgressStatus.COMPLETED,
          storageFacilities: ProgressStatus.COMPLETED,
          exportDestination: ProgressStatus.COMPLETED,
          transportDetails: ProgressStatus.COMPLETED,
          transportType: ProgressStatus.COMPLETED,
        },
        completedSections: 6,
        requiredSections: 6,
      };

      expect(result).toStrictEqual(expected);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[PROGRESS][${documentNumber}-${userPrincipal}][GET-SD-PROGRESS][STARTED]`
      );
      expect(mockStorageDocumentDraft).toHaveBeenCalledWith(
        userPrincipal,
        documentNumber,
        contactId
      );
    });
  });
});
