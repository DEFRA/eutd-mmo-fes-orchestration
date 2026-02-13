import ProgressService from './progress.service';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as DocumentValidator from '../validators/documentValidator';
import * as FishValidator from '../validators/fish.validator';
import * as CommodityCodeValidator from '../validators/pssdCommodityCode.validator';
import * as CountriesValidator from '../validators/countries.validator';
import SummaryErrorsService from './summaryErrors.service';
import { ProgressStatus } from '../persistence/schema/common';
import { Progress } from '../persistence/schema/frontEndModels/payload';
import logger from '../logger';
import { Transport } from '../persistence/schema/frontEndModels/transport';
import { StorageDocumentProgress } from '../persistence/schema/frontEndModels/storageDocument';
import axios from 'axios';

jest.mock('axios');
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

  let mockGetDraft: jest.SpyInstance;
  let mockGetSummaryErrors: jest.SpyInstance;

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
        transportations: [],
        exporterDetails,
        landingsEntryOption: 'manualEntry'
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

  it('will return the progress data for incomplete transport', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        products: [],
        transportations: [{
          id: 0,
          vehicle: 'train'
        }, {}],
        exporterDetails,
        landingsEntryOption: 'manualEntry'
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

  it('will show exportJourney as COMPLETE for new documents', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        products: [],
        exporterDetails,
        transportation: {
          vehicle: 'directLanding'
        },
        landingsEntryOption: 'directLanding',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul'
      }
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

  it('will show exportJourney as INCOMPLETE for new documents', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        products: [],
        exporterDetails,
        transportation: {
          vehicle: 'directLanding'
        },
        landingsEntryOption: 'directLanding',
        exportedFrom: 'United Kingdom',
        exportedTo: {
        }
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

  it('will show exportJourney as INCOMPLETE when pointOfDestination is missing', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        products: [],
        exporterDetails,
        transportation: {
          vehicle: 'directLanding'
        },
        landingsEntryOption: 'directLanding',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        }
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
          pointOfDestination: 'Port of Kabul',
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

  it('will return COMPLETED transportationDetails if the user adds a vehicle and the transport details', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'AA123456',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return COMPLETED transportationDetails if the user adds a vehicle and the transport details for transportation', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return COMPLETED transportationDetails if the user adds a truck vehicle with cmr flag set to true and no vehicle details', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportations: [{
          id: 0,
          vehicle: 'truck',
          cmr: true,
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return INCOMPLETE transportationDetails if the user adds a truck vehicle with cmr flag set to true and truck vehicle with cmr flag set to false with no mandatory fields filled', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportations: [{
          id: 0,
          vehicle: 'truck',
          cmr: true,
        }, {
          id: 1,
          vehicle: 'truck',
          cmr: false,
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
    });
    expect(mockGetDraft).toHaveBeenCalledWith(
      userPrincipal,
      documentNumber,
      contactId
    );
  });

  it('will return INCOMPLETE transportationDetails if the user adds a vehicle and the transport details for transportation with no reference', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'AA1234567',
          transportDocuments: [{
            name: 'name'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
    });
    expect(mockGetDraft).toHaveBeenCalledWith(
      userPrincipal,
      documentNumber,
      contactId
    );
  });

  it('will return COMPLETE transportationDetails if the user adds a vehicle and the transport details for transportation with no name', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'AA1234567',
          transportDocuments: [{
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
    });
    expect(mockGetDraft).toHaveBeenCalledWith(
      userPrincipal,
      documentNumber,
      contactId
    );
  });

  it('will return COMPLETE transportationDetails if the user adds a vehicle and the transport details for transportation with no documents', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'AA1234567',
          transportDocuments: []
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return COMPLETE transportationDetails if the user adds a vehicle and the transport details for transportation with no CMR', async () => {
    // Mock axios to return countries list including 'UK'
    (axios.get as jest.Mock).mockResolvedValue({
      data: [
        {
          officialCountryName: 'UK',
          isoCodeAlpha2: 'GB',
          isoCodeAlpha3: 'GBR',
          isoNumericCode: '826'
        }
      ]
    });

    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'truck',
          cmr: false,
          departurePlace: 'Hull',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'NU89OUJ',
          freightBillNumber: 'AA1234567',
          transportDocuments: []
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return COMPLETE transportationDetails if the transport details have valid freightBillNumber format', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'ABC-123/456.789',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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

  it('will return INCOMPLETE transportationDetails if the user adds a vehicle and the transport details for only one transportation', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'AA1234567'
        }, {
          id: 1,
          vehicle: 'plane'
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
    });
    expect(mockGetDraft).toHaveBeenCalledWith(
      userPrincipal,
      documentNumber,
      contactId
    );
  });

  it('will return INCOMPLETE transportationDetails if the user adds a vehicle and the transport details for transportation has a validation error', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456345634563456345634563456',
          containerNumbers: ['345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456345634563456'],
          departurePlace: '@',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
    });
    expect(mockGetDraft).toHaveBeenCalledWith(
      userPrincipal,
      documentNumber,
      contactId
    );
  });

  it('will return INCOMPLETE transportationDetails if the user adds a vehicle and the transport details with invalid freightBillNumber format', async () => {
    mockGetDraft.mockResolvedValue({
      exportData: {
        transportation: undefined,
        transportations: [{
          id: 0,
          vehicle: 'plane',
          flightNumber: '3456',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London',
          freightBillNumber: 'ABC@123#!£$',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        landingsEntryOption: 'manualEntry',
        exportedFrom: 'United Kingdom',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        pointOfDestination: 'Port of Kabul',
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
        transportDetails: 'INCOMPLETE',
      },
      requiredSections: 7,
      completedSections: 2,
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
        transportations: [{
          id: 0,
          vehicle: 'plane',
          exportedFrom: 'United Kingdom',
          flightNumber: 'BA078',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London Heathrow',
          freightBillNumber: 'AA123456',
          transportDocuments: [{
            name: 'name',
            reference: 'reference'
          }]
        }],
        conservation: {
          conservationReference: 'UK Fisheries Policy',
        },
        landingsEntryOption: 'manualEntry',
        exportedTo: {
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        exportedFrom: 'United Kingdom',
        pointOfDestination: 'Port of Kabul'
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

  let mockGetSummaryErrors: jest.SpyInstance;
  let mockHasLandingData: jest.SpyInstance;
  let mockFilterErrors: jest.SpyInstance;

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

  it('will return false for no products', () => {
    const filter = ProgressService.filterErrors(documentNumber, null);

    expect(filter(validationFailure)).toStrictEqual(false);
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

  it('will return false for a validation failure with no catch', () => {
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
      caughtBy: [undefined],
    } as any;

    const filter = ProgressService.filterErrors(documentNumber, [product]);

    expect(filter(validationFailure)).toStrictEqual(false);
  });

  it('will return false for a validation failure with no catches', () => {
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
      caughtBy: undefined
    } as any;

    const filter = ProgressService.filterErrors(documentNumber, [product]);

    expect(filter(validationFailure)).toStrictEqual(false);
  });

  it('will return false for a validation failure with no products', () => {
    const product = undefined;

    const filter = ProgressService.filterErrors(documentNumber, [product]);

    expect(filter(validationFailure)).toStrictEqual(false);
  });

  it('will return false for a validation failure with product with no state', () => {
    const product = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: undefined,
      presentation: {
        code: 'WHL',
        name: 'Whole',
      },
      caughtBy: undefined
    } as any;

    const filter = ProgressService.filterErrors(documentNumber, [product]);

    expect(filter(validationFailure)).toStrictEqual(false);
  });

  it('will return false for a validation failure with no presentation', () => {
    const product = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: {
        code: 'FRE',
        name: 'Fresh',
      },
      presentation: undefined,
      caughtBy: undefined
    } as any;

    const filter = ProgressService.filterErrors(documentNumber, [product]);

    expect(filter(validationFailure)).toStrictEqual(false);
  });
});

describe('getTransportDetails', () => {
  describe('with journey as storage notes', () => {
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

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
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

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
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

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return COMPLETE for a truck without a cmr but with a departure place', () => {
      const transport: Transport & { exportDateTo: string } = {
        vehicle: 'truck',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        pointOfDestination: 'Rio de Janeiro',
        cmr: 'false',
        nationalityOfVehicle: 'UK',
        registrationNumber: 'OP98Y89',
        departurePlace: 'Hull',
        exportDate: '04/07/2024',
        exportDateTo: '04/07/2024',
        departureCountry: 'United Kingdom',
        departurePort: 'Lucis Port',
        departureDate: '04/07/2024',
        facilityArrivalDate: '03/07/2024'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return INCOMPLETED for a truck without a cmr but with a departure place with validation errors', () => {
      const transport: Transport = {
        vehicle: 'truck',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: '@'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETED for a train with a departure place with validation errors', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: '@'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETED for a plane with a departure place with validation errors', () => {
      const transport: Transport = {
        vehicle: 'plane',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: '@'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return COMPLETED when all arrival plane fields are filled out with valid values', () => {
      const transport: Transport = {
        vehicle: 'plane',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        airwayBillNumber: 'AWB123456',
        flightNumber: 'FL123',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureDate: '15/11/2023',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return INCOMPLETE when some arrival plane fields are missing', () => {
      const transport: Transport = {
        vehicle: 'plane',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        airwayBillNumber: 'AWB123456',
        flightNumber: 'FL123',
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when some arrival plane fields have validation errors', () => {
      const transport: Transport = {
        vehicle: 'plane',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        airwayBillNumber: 'AWB123456',
        flightNumber: 'FL123',
        containerNumbers: ['CONT001', '@%&*'],
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETED for a container vessel with a departure place with validation errors', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: '@'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return COMPLETED when all arrival container vessel fields are filled out with valid values', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureDate: '15/11/2023',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return INCOMPLETE when some arrival container vessel fields are missing', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when some arrival container vessel fields have validation errors', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['CONT001', '@%&*'],
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    // FI0-10290: Container vessel arrival transport flagState validation tests
    it('should return INCOMPLETE when arrival container vessel is missing flagState', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureDate: '15/11/2023',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    // Test removed: containerNumbers is now optional for container vessels
    it('should return INCOMPLETE when arrival container vessel is missing departureCountry', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureDate: '15/11/2023',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival container vessel is missing departurePort', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departureDate: '15/11/2023',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival container vessel is missing departureDate', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival container vessel has invalid flagState format', () => {
      const transport: Transport = {
        vehicle: 'containerVessel',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: '@#$%^',
        containerNumbers: ['ABCU1234567', 'ABCJ7654321'],
        freightBillNumber: 'FB789',
        departurePort: 'London Heathrow',
        departureDate: '15/11/2023',
        departureCountry: 'United Kingdom',
        placeOfUnloading: 'Sao Paulo'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    // Test removed: containerNumbers now allows empty strings in array
    // FI0-10289: Train arrival transport validation tests
    it('should return COMPLETED when all arrival train fields are filled out with valid values', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departurePort: 'Calais port',
        departureDate: '15/11/2023',
        departureCountry: 'France',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.COMPLETED
      );
    });

    it('should return INCOMPLETE when arrival train is missing departureCountry', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departurePort: 'Calais port',
        departureDate: '15/11/2023',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival train is missing departurePort', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departureDate: '15/11/2023',
        departureCountry: 'France',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival train is missing departureDate', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departurePort: 'Calais port',
        departureCountry: 'France',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival train has invalid departurePort format', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departurePort: '@@@invalid',
        departureDate: '15/11/2023',
        departureCountry: 'France',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when arrival train has invalid departureDate format', () => {
      const transport: Transport = {
        vehicle: 'train',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        railwayBillNumber: 'RB123456',
        freightBillNumber: 'FB789',
        departurePort: 'Calais port',
        departureDate: 'invalid-date',
        departureCountry: 'France',
        placeOfUnloading: 'Dover'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE when some arrival fields have validation errors', () => {
      const transport: Transport = {
        vehicle: 'not valid',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        vesselName: 'WIRON 5',
        flagState: 'UK',
        containerNumbers: ['CONT001', '@%&*'],
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes", true)).toBe(
        ProgressStatus.INCOMPLETE
      );
    });

    it('should return INCOMPLETE if there is no valid transport type', () => {
      const transport: Transport = {
        vehicle: 'not valid',
        exportedTo: {
          officialCountryName: 'Brazil',
          isoCodeAlpha2: 'BR',
          isoCodeAlpha3: 'BRA',
          isoNumericCode: '076',
        },
        cmr: 'false',
        departurePlace: 'Hull'
      };

      expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
        ProgressStatus.INCOMPLETE
      );
    });
  });

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
      pointOfDestination: 'Rio de Janeiro',
      cmr: 'false',
      nationalityOfVehicle: 'UK',
      registrationNumber: 'OP98Y89',
      departurePlace: 'Hull',
      departureCountry: 'United Kingdom',
      departurePort: 'Lexis Port',
      departureDate: '04/07/2024',
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.COMPLETED
    );
  });

  it('should return INCOMPLETED for a truck without a cmr but with a departure place with validation errors', () => {
    const transport: Transport = {
      vehicle: 'truck',
      exportedTo: {
        officialCountryName: 'Brazil',
        isoCodeAlpha2: 'BR',
        isoCodeAlpha3: 'BRA',
        isoNumericCode: '076',
      },
      cmr: 'false',
      departurePlace: '@'
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.INCOMPLETE
    );
  });

  it('should return INCOMPLETED for a train with a departure place with validation errors', () => {
    const transport: Transport = {
      vehicle: 'train',
      exportedTo: {
        officialCountryName: 'Brazil',
        isoCodeAlpha2: 'BR',
        isoCodeAlpha3: 'BRA',
        isoNumericCode: '076',
      },
      cmr: 'false',
      departurePlace: '@'
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.INCOMPLETE
    );
  });

  it('should return INCOMPLETED for a plane with a departure place with validation errors', () => {
    const transport: Transport = {
      vehicle: 'plane',
      exportedTo: {
        officialCountryName: 'Brazil',
        isoCodeAlpha2: 'BR',
        isoCodeAlpha3: 'BRA',
        isoNumericCode: '076',
      },
      cmr: 'false',
      departurePlace: '@'
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.INCOMPLETE
    );
  });

  it('should return INCOMPLETED for a container vessel with a departure place with validation errors', () => {
    const transport: Transport = {
      vehicle: 'containerVessel',
      exportedTo: {
        officialCountryName: 'Brazil',
        isoCodeAlpha2: 'BR',
        isoCodeAlpha3: 'BRA',
        isoNumericCode: '076',
      },
      cmr: 'false',
      departurePlace: '@'
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.INCOMPLETE
    );
  });

  it('should return INCOMPLETE if there is no valid transport type', () => {
    const transport: Transport = {
      vehicle: 'not valid',
      exportedTo: {
        officialCountryName: 'Brazil',
        isoCodeAlpha2: 'BR',
        isoCodeAlpha3: 'BRA',
        isoNumericCode: '076',
      },
      cmr: 'false',
      departurePlace: 'Hull'
    };

    expect(ProgressService.getTransportDetails(transport)).toBe(
      ProgressStatus.INCOMPLETE
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
      departurePlace: 'Hull'
    };

    expect(ProgressService.getTransportDetails(transport, "storageNotes")).toBe(
      ProgressStatus.INCOMPLETE
    );
  });
});

describe('getStorageFacilityStatus', () => {
  it('should return INCOMPLETE for incomplete storage facilities', () => {
    const storageFacilities = {
      facilityName: '',
      facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
      facilityTownCity: 'LANCASTER HOUSE',
      facilityPostcode: '',
      facilityArrivalDate: '04/07/2024',
      facilityStorage: 'Chilled'
    };

    expect(
      ProgressService.getStorageFacilityStatus(storageFacilities.facilityName, storageFacilities.facilityAddressOne, storageFacilities.facilityTownCity, storageFacilities.facilityPostcode, storageFacilities.facilityArrivalDate, storageFacilities.facilityStorage)
    ).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE for storage facilities with no address details', () => {
    const storageFacilities = {
      facilityName: 'FACILITY',
      facilityAddressOne: '',
      facilityTownCity: '',
      facilityPostcode: '',
      facilityArrivalDate: '04/07/2024',
      facilityStorage: 'Chilled'
    };

    expect(
      ProgressService.getStorageFacilityStatus(storageFacilities.facilityName, storageFacilities.facilityAddressOne, storageFacilities.facilityTownCity, storageFacilities.facilityPostcode, storageFacilities.facilityArrivalDate, storageFacilities.facilityStorage)
    ).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE for incomplete storage facilities with no arrival date', () => {
    const storageFacilities = {
      facilityName: 'FACILITY',
      facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
      facilityBuildingName: 'LANCASTER HOUSE',
      facilityBuildingNumber: '',
      facilityPostcode: 'NE7 4BY',
      facilityTownCity: 'NEWCASTLE UPON TYNE',
      facilityArrivalDate: '',
      facilityStorage: 'Chilled'
    };

    expect(
      ProgressService.getStorageFacilityStatus(storageFacilities.facilityName, storageFacilities.facilityAddressOne, storageFacilities.facilityTownCity, storageFacilities.facilityPostcode, storageFacilities.facilityArrivalDate, storageFacilities.facilityStorage)
    ).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return COMPLETED for complete storage facilities', () => {
    const storageFacilities = {
      facilityName: 'FACILITY',
      facilityAddressOne: 'MMO, LANCASTER HOUSE, HAMPSHIRE COURT',
      facilityTownCity: 'LANCASTER HOUSE',
      facilityPostcode: 'NE7 4BY',
      facilityArrivalDate: '04/07/2024',
      facilityStorage: 'Chilled'
    };

    expect(
      ProgressService.getStorageFacilityStatus(storageFacilities.facilityName, storageFacilities.facilityAddressOne, storageFacilities.facilityTownCity, storageFacilities.facilityPostcode, storageFacilities.facilityArrivalDate, storageFacilities.facilityStorage)
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

  let mockProcessingStatementDraft: jest.SpyInstance;
  let mockValidateCompletedDocument: jest.SpyInstance;
  let mockValidateSpeciesMissing: jest.SpyInstance;
  let mockValidateCountriesName: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpeciesMissing = jest.spyOn(DocumentValidator, 'validateSpecies');
    mockValidateSpeciesMissing.mockResolvedValue(true);
    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false });
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE processedProductDetails if products have valid descriptions but no associated catches (FI0-10647)', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        products: [
          {
            id: 'product-1',
            commodityCode: '03026929',
            description: 'Herring fillets',
          },
          {
            id: 'product-2',
            commodityCode: '16041210',
            description: 'Atlantic cod fishcakes',
          }
        ],
        catches: [],
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE processedProductDetails if some products do not have catch details (FI0-10647)', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        products: [
          {
            id: 'product-1',
            commodityCode: '03026929',
            description: 'Herring fillets - with catches',
          },
          {
            id: 'product-2',
            commodityCode: '16041210',
            description: 'Atlantic cod - no catches',
          }
        ],
        catches: [
          {
            productId: 'product-1',
            species: 'Gymnotus pantherinus (AGH)',
            speciesCode: 'AGH',
            catchCertificateNumber: 'GBR-2022-CC-VALID123',
            id: 'CC-10-1670865091',
            scientificName: 'Gymnotus pantherinus',
            totalWeightLanded: '7',
            exportWeightBeforeProcessing: '5',
            exportWeightAfterProcessing: '6',
            catchCertificateType: 'uk',
          }
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE catches even if scientific name is missing', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        catches: [
          {
            species: 'Atlantic herring (HER)',
            speciesCode: 'HER',
            id: '2342234-1610018899',
            catchCertificateNumber: '12345',
            totalWeightLanded: '34',
            exportWeightBeforeProcessing: '34',
            exportWeightAfterProcessing: '45',
            scientificName: '',
          },
          {
            species: 'Black scabbardfish (BSF)',
            speciesCode: 'BSF',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE catches if all of these properties species, id, catchCertificateNumber, totalWeightLanded, exportWeightBeforeProcessing, exportWeightAfterProcessing and scientificName are present in every catch object', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        catches: [
          {
            species: 'Atlantic herring (HER)',
            speciesCode: 'HER',
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
            speciesCode: 'BSF',
            id: '2342234-1610018900',
            catchCertificateNumber: 'GB-123-456-345',
            totalWeightLanded: '170',
            exportWeightBeforeProcessing: '156',
            exportWeightAfterProcessing: '160',
            scientificName: 'scientificName',
            catchCertificateType: 'uk',
          },
          {
            species: 'Atlantic herring (COD)',
            speciesCode: 'COD',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
            speciesCode: 'HER',
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
            speciesCode: 'BSF',
            id: '2342234-1610018900',
            catchCertificateNumber: 'GB-123-456-345',
            totalWeightLanded: '170',
            exportWeightBeforeProcessing: '156',
            exportWeightAfterProcessing: '160',
            scientificName: 'scientificName',
          },
          {
            species: 'Atlantic herring (COD)',
            speciesCode: 'COD',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
            speciesCode: 'HER',
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
            speciesCode: 'BSF',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
            speciesCode: 'HER',
            id: '2342234-1610018899',
            catchCertificateNumber: '12345',
            totalWeightLanded: '£$"£kg',
            exportWeightBeforeProcessing: '34',
            exportWeightAfterProcessing: '45',
            scientificName: 'scientificName',
          },
          {
            species: 'Black scabbardfish (BSF)',
            speciesCode: 'BSF',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
            speciesCode: 'HER',
            id: '2342234-1610018899',
            catchCertificateNumber: '12345',
            totalWeightLanded: '34',
            exportWeightBeforeProcessing: '34',
            exportWeightAfterProcessing: '45',
            scientificName: 'scientificName',
          },
          {
            species: 'Atlantic herring (HER)',
            speciesCode: 'HER',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
            speciesCode: 'HER',
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
            speciesCode: 'BSF',
            id: '2342234-1610018900',
            catchCertificateNumber: 'GB-123-456-345',
            totalWeightLanded: '170',
            exportWeightBeforeProcessing: '156',
            exportWeightAfterProcessing: '160',
            scientificName: 'scientificName',
          },
          {
            species: 'Atlantic herring (COD)',
            speciesCode: 'COD',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.COMPLETED,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return COMPLETED exportDestination if there is exportedTo and pointOfDestination in exportData', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        exportedTo: {
          officialCountryName: 'SPAIN',
          isoCodeAlpha2: 'A1',
          isoCodeAlpha3: 'A3',
          isoNumericCode: 'SP',
        },
        pointOfDestination: 'Calais port',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.COMPLETED,
      },
      completedSections: 1,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE exportDestination if exportedTo is present but pointOfDestination is missing', async () => {
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return INCOMPLETE exportDestination if pointOfDestination is empty string', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        exportedTo: {
          officialCountryName: 'SPAIN',
          isoCodeAlpha2: 'A1',
          isoCodeAlpha3: 'A3',
          isoNumericCode: 'SP',
        },
        pointOfDestination: '',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.COMPLETED,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
    };

    expect(result).toStrictEqual(expected);
  });

  it('will return COMPLETE processingPlantAddress if any of plantName, plantAddressOne and plantPostcode is missing in exportData', async () => {
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.COMPLETED,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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

  it('will return COMPLETED processingPlantAddress if all plantAddressOne and plantPostcode exist in exportData', async () => {
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.COMPLETED,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
    mockProcessingStatementDraft.mockResolvedValue(undefined);

    const result = await ProgressService.getProcessingStatementProgress(
      userPrincipal,
      documentNumber,
      contactId
    );

    const expected: Progress = {
      progress: {
        exporter: ProgressStatus.INCOMPLETE,
        reference: ProgressStatus.OPTIONAL,
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.INCOMPLETE,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 6,
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

  it('will return COMPLETE processingPlantAddress if there is any of plantAddressOne and plantPostcode has empty value in exportData', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        plantAddressOne: '   ',
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
        processedProductDetails: ProgressStatus.INCOMPLETE,
        processingPlant: ProgressStatus.INCOMPLETE,
        processingPlantAddress: ProgressStatus.COMPLETED,
        exportHealthCertificate: ProgressStatus.INCOMPLETE,
        exportDestination: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 6,
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
        products: [
          {
            id: 'product-1',
            description: 'Processed Fish Product',
            commodityCode: '03055310',
          },
        ],
        catches: [
          {
            productId: 'product-1',
            species: 'Atlantic herring (HER)',
            speciesCode: 'HER',
            id: '2342234-1610018899',
            catchCertificateNumber: '12345',
            totalWeightLanded: '34',
            exportWeightBeforeProcessing: '34',
            exportWeightAfterProcessing: '45',
            scientificName: 'scientificName',
            catchCertificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'A1',
              isoCodeAlpha3: 'A3',
              isoNumericCode: 'SP',
            },
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
        pointOfDestination: 'Calais port',
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
        processedProductDetails: ProgressStatus.COMPLETED,
        processingPlant: ProgressStatus.COMPLETED,
        processingPlantAddress: ProgressStatus.COMPLETED,
        exportHealthCertificate: ProgressStatus.COMPLETED,
        exportDestination: ProgressStatus.COMPLETED,
      },
      requiredSections: 6,
      completedSections: 6,
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

  let mockStorageDocumentDraft: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;
  let mockSpeciesNameValid: jest.SpyInstance;
  let mockCommodityCodeValid: jest.SpyInstance;
  let mockValidateCountriesName: jest.SpyInstance;

  beforeEach(() => {
    mockStorageDocumentDraft = jest.spyOn(StorageDocumentService, 'getDraft');
    mockStorageDocumentDraft.mockResolvedValue(null);
    mockSpeciesNameValid = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockSpeciesNameValid.mockResolvedValue({ isError: false });
    mockCommodityCodeValid = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockCommodityCodeValid.mockResolvedValue({ isError: false });
    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false });
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 5
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 5
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '5',
            weightOnCC: '5',
            placeOfUnloading: 'sdfdf',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'sfdfd',
            id: 'dsfdsf-1643629199',
            netWeightProductArrival: '1',
            netWeightFisheryProductArrival: '1',
            netWeightProductDeparture: '700',
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 5
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
            productDescription: 'Some product description',
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
            productDescription: 'Some product description',
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
            productDescription: 'Some product description',
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
        catches: [
          {
            product: "Red abalone (ABF)",
            id: "GBR-2024-CC-BEFCD6036-1758535312-0",
            commodityCode: "03022400",
            certificateNumber: "GBR-2024-CC-BEFCD6036",
            productWeight: "100",
            weightOnCC: "100",
            scientificName: "Haliotis rufescens",
            certificateType: "non_uk",
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            supportingDocuments: [],
            productDescription: 'Some product description',
            netWeightProductArrival: "1",
            netWeightFisheryProductArrival: "1",
            netWeightProductDeparture: "100",
            netWeightFisheryProductDeparture: "100"
          }
        ],
        transportations: [{
          id: 1,
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumber: "ABCU1234567",
          freightBillNumber: "123"
        }],
        exportedTo: {
          officialCountryName: "Algeria",
          isoCodeAlpha2: "DZ",
          isoCodeAlpha3: "DZA",
          isoNumericCode: "012"
        },
        pointOfDestination: "Algiers Port",
        exportDate: "22/09/2025"
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 1,
      requiredSections: 5
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
        transportation: {
          id: "transport-id-124",
          exportedTo: {
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: ["ABCJ1234567"],
          exportDate: "22/09/2025",
          freightBillNumber: "123"
        }
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '5',
            weightOnCC: '5',
            placeOfUnloading: 'sdfdf',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'sfdfd',
            id: 'dsfdsf-1643629199',
            netWeightProductArrival: '1',
            netWeightFisheryProductArrival: '1',
            netWeightProductDeparture: '700',
            netWeightFisheryProductDeparture: '700'
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
            facilityArrivalDate: '10/10/2020',
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
          officialCountryName: 'Afghanistan',
          isoCodeAlpha2: 'AF',
          isoCodeAlpha3: 'AFG',
          isoNumericCode: '004',
        },
        transportations: [{
          id: 1,
          vehicle: 'plane',
          flightNumber: 'BA078',
          containerNumbers: ['ABCU1234567'],
          departurePlace: 'London Heathrow',
          freightBillNumber: '123'
        }],
        pointOfDestination: 'Kabul Airport',
        exportDate: '25/09/2023',
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
        facilityArrivalDate: '20/09/2023',
        facilityStorage: 'Chilled',
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
        storageFacilities: ProgressStatus.INCOMPLETE,
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 2,
      requiredSections: 5
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

  it('will return a completed arrival transportation section', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          vehicle: 'train',
          railwayBillNumber: '0123456789',
          freightBillNumber: 'a',
          departurePort: 'Port',
          departureDate: '09/01/2020',
          departureCountry: 'Equatorial Guinea',
          placeOfUnloading: 'place',
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.COMPLETED,
      },
      completedSections: 1,
      requiredSections: 5
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

  it('will return a completed arrival transportation section - truck', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          vehicle: 'truck',
          registrationNumber: '0123456789',
          freightBillNumber: 'a',
          departurePort: 'Port',
          departureDate: '09/01/2020',
          nationalityOfVehicle: 'UK',
          departureCountry: 'Equatorial Guinea',
          placeOfUnloading: 'place'
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.COMPLETED,
      },
      completedSections: 1,
      requiredSections: 5
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

  it('will return a completed arrival transportation section - plane', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          vehicle: 'plane',
          flightNumber: '0123456789',
          airwayBillNumber: 'a',
          containerNumbers: 'ABCU1234567, ABCJ7654321',
          freightBillNumber: 'a',
          departurePort: 'airport',
          departureDate: '01/09/2025',
          departureCountry: 'Equatorial Guinea',
          placeOfUnloading: 'place'
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.COMPLETED,
      },
      completedSections: 1,
      requiredSections: 5
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

  it('will return a optional arrival transportation section', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          vehicle: 'train',
          railwayBillNumber: '0123456789'
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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

  it('will return a optional arrival transportation section - truck', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          vehicle: 'truck',
          nationalityOfVehicle: ''
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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

  it('will return a uncompleted arrival transportation section as optional', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        arrivalTransportation: {
          railwayBillNumber: '0123456789'
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
        transportDetails: ProgressStatus.INCOMPLETE,
        arrivalTransportationDetails: ProgressStatus.INCOMPLETE,
      },
      completedSections: 0,
      requiredSections: 5
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
  it('should return INCOMPLETE transport details when product departure weight is zero', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '0',
          netWeightFisheryProductDeparture: '20.75'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when fishery product departure weight is zero', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '10.50',
          netWeightFisheryProductDeparture: '0'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when weights exceed 2 decimals', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '10.5011',
          netWeightFisheryProductDeparture: '20.7522'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when weights exceed 12 digits', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '1234567890123',
          netWeightFisheryProductDeparture: '1234567890445'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when productWeight is empty', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '1234567890123',
          netWeightFisheryProductDeparture: '1234567890445'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when both weight types are invalid', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '-90',
          netWeightFisheryProductDeparture: 'abcc'
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });
  it('should return COMPLETED transport details when weights are valid', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '10.50',
          netWeightFisheryProductDeparture: '20.75'
        }],
        transportations: [{
          id: 1,
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: ["ABCU1234567"],
          freightBillNumber: "123"
        }],
        exportedTo: {
          officialCountryName: "Algeria",
          isoCodeAlpha2: "DZ",
          isoCodeAlpha3: "DZA",
          isoNumericCode: "012"
        },
        pointOfDestination: "Algiers Port",
        exportDate: "22/09/2025"
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  it('should return INCOMPLETE transport details when at least one weight type is valid', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [{
          product: 'Atlantic cod (COD)',
          productDescription: 'Some product description',
          commodityCode: '45345454354',
          certificateNumber: 'DSFDSF',
          certificateType: 'non_uk',
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
          productWeight: '100',
          weightOnCC: '100',
          placeOfUnloading: 'London',
          dateOfUnloading: '24/01/2022',
          transportUnloadedFrom: 'vessel',
          id: 'catch-id-123',
          netWeightProductArrival: '90',
          netWeightFisheryProductArrival: '90',
          netWeightProductDeparture: '10.50',
          netWeightFisheryProductDeparture: ''
        }],
        transportation: {
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          pointOfDestination: "Algiers Port",
          vehicle: "containerVessel",
          departurePlace: "port",
          vesselName: "Felicity Ace",
          flagState: "Greece",
          containerNumbers: "Test1,Test2",
          exportDate: "22/09/2025",
          freightBillNumber: ""
        },
      }
    });

    const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

    expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
  });

  describe('Storage Facilities Date Validation Tests', () => {
    it('should return COMPLETED storageFacilities when facility arrival date is after arrival transportation departure date', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '15/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '14/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "22/01/2026",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).storageFacilities).toBe(ProgressStatus.COMPLETED);
    });

    it('should return INCOMPLETE storageFacilities when facility arrival date is not after arrival transportation departure date', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '13/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '14/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "22/01/2026",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).storageFacilities).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return INCOMPLETE storageFacilities when facility arrival date is missing', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '14/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "22/01/2026",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).storageFacilities).toBe(ProgressStatus.INCOMPLETE);
    });
  });

  describe('Transport Details Date Validation Tests', () => {
    it('should return COMPLETED transportDetails when departure transport date is after arrival transport departure date', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '14/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '14/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportations: [{
            id: 1,
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: ["ABCU1234567"],
            freightBillNumber: "123"
          }],
          exportedTo: {
            officialCountryName: "Algeria",
            isoCodeAlpha2: "DZ",
            isoCodeAlpha3: "DZA",
            isoNumericCode: "012"
          },
          pointOfDestination: "Algiers Port",
          exportDate: "15/01/2026"
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return INCOMPLETE transportDetails when departure transport date is not after arrival transport departure date', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '14/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '20/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "15/01/2026",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return INCOMPLETE transportDetails when departure transport date is missing', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '14/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '20/01/2026',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return INCOMPLETE transportDetails when arrival transport departure date is missing', async () => {
      mockStorageDocumentDraft.mockResolvedValue({
        exportData: {
          catches: [{
            product: 'Atlantic cod (COD)',
            productDescription: 'Some product description',
            commodityCode: '45345454354',
            certificateNumber: 'DSFDSF',
            certificateType: 'non_uk',
            issuingCountry: {
              officialCountryName: 'SPAIN',
              isoCodeAlpha2: 'ES',
              isoCodeAlpha3: 'ESP',
              isoNumericCode: '724',
            },
            productWeight: '100',
            weightOnCC: '100',
            placeOfUnloading: 'London',
            dateOfUnloading: '24/01/2022',
            transportUnloadedFrom: 'vessel',
            id: 'catch-id-123',
            netWeightProductArrival: '90',
            netWeightFisheryProductArrival: '90',
            netWeightProductDeparture: '10.50',
            netWeightFisheryProductDeparture: '10'
          }],
          facilityName: 'Cold Storage Facility',
          facilityAddressOne: '123 Storage Lane',
          facilityTownCity: 'London',
          facilityPostcode: 'SW1A 1AA',
          facilityArrivalDate: '14/01/2026',
          facilityStorage: 'Frozen storage',
          arrivalTransportation: {
            departureDate: '',
            exportedTo: {
              officialCountryName: 'UK',
              isoCodeAlpha2: 'GB',
              isoCodeAlpha3: 'GBR',
              isoNumericCode: '826'
            },
            pointOfDestination: 'London Port',
            vehicle: 'truck',
            departurePlace: 'port',
            cmr: 'false'
          },
          transportation: {
            exportedTo: {
              officialCountryName: "Algeria",
              isoCodeAlpha2: "DZ",
              isoCodeAlpha3: "DZA",
              isoNumericCode: "012"
            },
            pointOfDestination: "Algiers Port",
            vehicle: "containerVessel",
            departurePlace: "port",
            vesselName: "Felicity Ace",
            flagState: "Greece",
            containerNumbers: "Test1,Test2",
            exportDate: "21/01/2026",
            freightBillNumber: ""
          },
        }
      });

      const result = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);

      expect((result.progress as StorageDocumentProgress).transportDetails).toBe(ProgressStatus.INCOMPLETE);
    });

    it('should return false when firstDateStr is undefined in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate(undefined, '14/01/2026');
      expect(result).toBe(false);
    });

    it('should return false when secondDateStr is undefined in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('15/01/2026', undefined);
      expect(result).toBe(false);
    });

    it('should return false when both dates are undefined in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate(undefined, undefined);
      expect(result).toBe(false);
    });

    it('should return false when firstDateStr is invalid in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('invalid-date', '14/01/2026');
      expect(result).toBe(false);
    });

    it('should return false when secondDateStr is invalid in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('15/01/2026', 'invalid-date');
      expect(result).toBe(false);
    });

    it('should return false when both dates are invalid in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('invalid-date1', 'invalid-date2');
      expect(result).toBe(false);
    });

    it('should return true when first date is after second date in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('15/01/2026', '14/01/2026');
      expect(result).toBe(true);
    });

    it('should return true when first date is same as second date in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('14/01/2026', '14/01/2026');
      expect(result).toBe(true);
    });

    it('should return false when first date is before second date in isFirstDateAfterSecondDate', () => {
      const result = ProgressService.isFirstDateAfterSecondDate('13/01/2026', '14/01/2026');
      expect(result).toBe(false);
    });
  });
});

describe('Catch Certificate Progress - requestByAdmin branch coverage', () => {
  let mockGetDraft: jest.SpyInstance;
  let mockGetSummaryErrors: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
    mockGetSummaryErrors = jest.spyOn(SummaryErrorsService, 'get');
    mockGetSummaryErrors.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mark exporter as COMPLETED when requestByAdmin is true even without contactId', async () => {
    mockGetDraft.mockResolvedValue({
      requestByAdmin: true,
      exportData: {
        landingsEntryOption: 'manualEntry',
        exporterDetails: {
          exporterFullName: 'John Doe',
          exporterCompanyName: 'Test Company',
          addressOne: 'Test Address',
          postcode: 'TE1 1ST'
        },
        products: [],
        transportation: {}
      }
    });

    const result = await ProgressService.get('user123', 'DOC-123', 'contact123');

    expect(result.progress['exporter']).toBe(ProgressStatus.COMPLETED);
  });
});

describe('isFacilityArrivalAfterTransportDeparture - missing departure date', () => {
  it('should return false when arrivalTransportation has no departureDate', () => {
    const arrivalTransportation = {
      vehicle: 'truck',
      exportDate: '15/01/2026'
    };
    const facilityArrivalDate = '16/01/2026';

    const result = ProgressService.isFacilityArrivalAfterTransportDeparture(
      arrivalTransportation as any,
      facilityArrivalDate
    );

    expect(result).toBe(false);
  });
});

describe('isDepartureTransportAfterArrivalTransport - missing dates', () => {
  it('should return false when departure transport has no exportDate', () => {
    const departureTransportation = {
      vehicle: 'truck'
    };
    const arrivalTransportation = {
      vehicle: 'plane',
      departureDate: '14/01/2026'
    };

    const result = ProgressService.isDepartureTransportAfterArrivalTransport(
      departureTransportation as any,
      arrivalTransportation as any
    );

    expect(result).toBe(false);
  });

  it('should return false when arrival transport has no departureDate', () => {
    const departureTransportation = {
      vehicle: 'truck',
      exportDate: '15/01/2026'
    };
    const arrivalTransportation = {
      vehicle: 'plane'
    };

    const result = ProgressService.isDepartureTransportAfterArrivalTransport(
      departureTransportation as any,
      arrivalTransportation as any
    );

    expect(result).toBe(false);
  });

  it('should return true when both dates are present and departure is after arrival', () => {
    const departureTransportation = {
      vehicle: 'truck',
      exportDate: '16/01/2026'
    };
    const arrivalTransportation = {
      vehicle: 'plane',
      departureDate: '15/01/2026'
    };

    const result = ProgressService.isDepartureTransportAfterArrivalTransport(
      departureTransportation as any,
      arrivalTransportation as any
    );

    expect(result).toBe(true);
  });

  it('should return false when both dates are present but departure is before arrival', () => {
    const departureTransportation = {
      vehicle: 'truck',
      exportDate: '14/01/2026'
    };
    const arrivalTransportation = {
      vehicle: 'plane',
      departureDate: '15/01/2026'
    };

    const result = ProgressService.isDepartureTransportAfterArrivalTransport(
      departureTransportation as any,
      arrivalTransportation as any
    );

    expect(result).toBe(false);
  });

  it('should correctly access departureDate from BackEndTransport type', () => {
    const departureTransportation = {
      vehicle: 'truck',
      exportDate: '16/01/2026',
      exportedFrom: 'UK Port',
      exportedTo: { officialCountryName: 'France' }
    };
    const arrivalTransportation = {
      vehicle: 'plane',
      departureDate: '15/01/2026',
      exportedFrom: 'Port A'
    };

    const result = ProgressService.isDepartureTransportAfterArrivalTransport(
      departureTransportation as any,
      arrivalTransportation as any
    );

    expect(result).toBe(true);
  });
});

describe('isEmptyAndTrimSpaces - object value', () => {
  it('should return true when object has all non-empty string values', () => {
    const objectValue = {
      prop1: 'value1',
      prop2: 'value2'
    };

    const result = ProgressService.isEmptyAndTrimSpaces(objectValue);

    expect(result).toBe(true);
  });

  it('should return false when object has empty string values', () => {
    const objectValue = {
      prop1: 'value1',
      prop2: ''
    };

    const result = ProgressService.isEmptyAndTrimSpaces(objectValue);

    expect(result).toBe(false);
  });

  it('should return false when object is empty', () => {
    const result = ProgressService.isEmptyAndTrimSpaces({});

    expect(result).toBe(false);
  });
});

describe('Processing Statement Progress - processingPlant COMPLETED branch', () => {
  let mockProcessingStatementDraft: jest.SpyInstance;
  let mockValidateCompletedDocument: jest.SpyInstance;
  let mockValidateSpeciesMissing: jest.SpyInstance;
  let mockValidateCountriesName: jest.SpyInstance;
  let mockValidateCommodityCode: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpeciesMissing = jest.spyOn(DocumentValidator, 'validateSpecies');
    mockValidateSpeciesMissing.mockResolvedValue(true);
    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false });
    mockValidateCommodityCode = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockValidateCommodityCode.mockResolvedValue({ isError: false });
    mockProcessingStatementDraft = jest.spyOn(ProcessingStatementService, 'getDraft');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mark processingPlant as COMPLETED when all required fields are present', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        plantName: 'Test Plant',
        plantApprovalNumber: 'AP12345',
        personResponsibleForConsignment: 'John Doe',
        plantPostcode: 'TE1 1ST',
        plantAddressOne: '123 Test Street',
      }
    });

    const result = await ProgressService.getProcessingStatementProgress('user123', 'DOC-PS-123', 'contact123');

    expect(result.progress['processingPlant']).toBe(ProgressStatus.COMPLETED);
  });

  it('should mark exportHealthCertificate as COMPLETED when certificate number and date are valid', async () => {
    mockProcessingStatementDraft.mockResolvedValue({
      exportData: {
        healthCertificateNumber: '12/3/456789',
        healthCertificateDate: '25/01/2026',
      }
    });

    const result = await ProgressService.getProcessingStatementProgress('user123', 'DOC-PS-123', 'contact123');

    expect(result.progress['exportHealthCertificate']).toBe(ProgressStatus.COMPLETED);
  });
});

describe('Storage Document Progress - transportDetails with all conditions met', () => {
  let mockStorageDocumentDraft: jest.SpyInstance;
  let mockValidateFishValidator: jest.SpyInstance;
  let mockValidateCommodityCode: jest.SpyInstance;

  beforeEach(() => {
    mockValidateFishValidator = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidateFishValidator.mockResolvedValue({ isError: false });
    mockValidateCommodityCode = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockValidateCommodityCode.mockResolvedValue({ isError: false });
    mockStorageDocumentDraft = jest.spyOn(StorageDocumentService, 'getDraft');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mark transportDetails as INCOMPLETE when departure transport is not completed', async () => {
    mockStorageDocumentDraft.mockResolvedValue({
      exportData: {
        catches: [
          {
            product: 'Cod',
            id: 'catch-1',
            commodityCode: '03026110',
            certificateNumber: 'GBR-2022-CC-123456',
            totalWeightLanded: '100',
            exportWeightBeforeProcessing: '90',
            exportWeightAfterProcessing: '85',
            productWeight: '50',
            fisheryProductDepartureWeight: '48'
          }
        ],
        transportation: {
          vehicle: 'truck',
          // Missing exportDate - makes it INCOMPLETE
          departurePlace: 'London Port'
        },
        arrivalTransportation: {
          vehicle: 'plane',
          departureDate: '15/01/2026',
          exportDate: '15/01/2026',
          departurePlace: 'Paris Port',
          productWeight: '50',
          fisheryProductDepartureWeight: '48'
        }
      }
    });

    const result = await ProgressService.getStorageDocumentProgress('user123', 'DOC-SD-123', 'contact123');

    expect(result.progress['transportDetails']).toBe(ProgressStatus.INCOMPLETE);
  });
});
