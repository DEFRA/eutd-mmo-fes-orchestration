import * as Hapi from "@hapi/hapi";
import axios from 'axios';
import logger from '../logger';
import { SessionStoreFactory } from '../session_store/factory';
import OrchestrationService, { processingStatement, storageNote, isPositiveNumberWithTwoDecimals, isInvalidLength, isNumbersOnly, isPsPlantNameValid }  from './orchestration.service'
import SaveAsDraftService from './saveAsDraft.service';
import * as Service from './orchestration.service';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as ReferenceDataService from '../services/reference-data.service';
import * as MonitoringService from "../services/protective-monitoring.service";
import * as SystemBlock from '../persistence/services/systemBlock';
import * as SessionManager from '../helpers/sessionManager';
import * as ProcessingStatement from '../persistence/schema/processingStatement';
import * as DocumentValidator from '../validators/documentValidator';
import { toFrontEndProcessingStatementExportData } from '../persistence/schema/processingStatement';
import { ExporterDetails } from '../persistence/schema/common';
import { toFrontEndStorageDocumentExportData } from '../persistence/schema/storageDoc';
import * as moment from 'moment';
import { MAX_COMMODITY_CODE_LENGTH, MIN_COMMODITY_CODE_LENGTH } from '../../src/services/constants';
import * as pdfService from 'mmo-ecc-pdf-svc';
import * as EuCountriesService from './eu-countries.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const contactId = 'contactBob';

const h = {
  response: () => {
    function code(httpCode) {
      return httpCode;
    }

    return { code: code }
  },
  redirect: () => {
  }
} as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

describe('get', () => {

  describe('for processing statement', () => {
    const redisKey = 'processingStatement';

    const req: any = {
      app: {claims: {sub: 'Bob'}},
      params: {redisKey: redisKey}
    };

    const res = jest.fn();
    let mockGetDraftData: jest.SpyInstance;

    beforeAll(() => {
      mockGetDraftData = jest.spyOn(ProcessingStatementService, 'getDraft');
    });

    afterAll(() => {
      mockGetDraftData.mockRestore();
      res.mockReset();
    });

    const exporterDetails: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: "original data" },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      },
    };

    const sessionData = {
      test : "Test",
      userReference: "user-ref-123",
      exportData : {
        catches: [{
          species: "Astronesthes niger (AHR)",
          id: '2342234-1610018899',
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
        plantBuildingName: "plantBuildingName",
        plantBuildingNumber: "plantBuildingNumber",
        plantSubBuildingName: "plantSubBuildingName",
        plantStreetName: "plantStreetName",
        plantCountry: "plantCountry",
        plantCounty: "plantCounty",
        plantTownCity: "London",
        plantPostcode: "SE37 6YH",
        dateOfAcceptance: "12/02/2020",
        exporterDetails: exporterDetails,
        exportedTo: 'India'
      }
    };

    it('should return data from mongo in correct front end format', async () => {
      mockGetDraftData.mockResolvedValue(sessionData);

      const result = await OrchestrationService.get(req, h, 'Bob','GBR-34424-234234-234234', contactId);

      expect(result).toStrictEqual(toFrontEndProcessingStatementExportData(sessionData.exportData as any, sessionData.userReference));
    });

    it('should create an initial state if no data already exists', async () => {
      mockGetDraftData.mockResolvedValue(null);

      const result = await OrchestrationService.get(req, h, 'Bob','GBR-34424-234234-234234', contactId);

      expect(result).toStrictEqual(Service.initialState[redisKey]);
    });
  });

  describe('for storage document', () => {
    let mockGetDraftData: jest.SpyInstance;

    const redisKey = 'storageNotes';

    const req: any = {
      app: { claims: { sub: 'Bob' } },
      params: { redisKey: redisKey }
    };

    const res = jest.fn();

    beforeAll(() => {
      mockGetDraftData = jest.spyOn(StorageDocumentService, 'getDraft');
    });

    afterAll(() => {
      mockGetDraftData.mockRestore();
      res.mockReset();
    });

    const exporterDetails: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: "original data" },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      },
    };

    const sessionData = {
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
          weightOnCC: "45",
          scientificName: "some scientific name"
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
        transportation : {
          vehicle: 'plane',
          flightNumber: 'BA078',
          containerNumber: '12345',
          departurePlace: 'Essex',
          exportDate: '18/11/2019'
        },
        exporterDetails: exporterDetails,
        facilityAddressOne: "Build and Street",
        facilityApprovalNumber: undefined,
        facilityArrivalDate: "20/11/2023",
        facilityBuildingName: undefined,
        facilityBuildingNumber: undefined,
        facilityCountry: undefined,
        facilityCounty: undefined,
        facilityName: "Storage Facilities",
        facilityPostcode: "ES8 7UJ",
        facilityStorage: "Chilled",
        facilityStreetName: "Street",
        facilitySubBuildingName: undefined,
        facilityTownCity: "Essex",
      }
    };

    it('should return data from mongo in correct front end format', async () => {
      mockGetDraftData.mockResolvedValue(sessionData);

      const result = await OrchestrationService.get(req, h, 'Bob','GBR-34424-234234-234234', contactId);

      expect(result).toStrictEqual(toFrontEndStorageDocumentExportData(sessionData.exportData));
    });

    it('should create an initial state if no data already exists', async () => {
      mockGetDraftData.mockResolvedValue(null);

      const result = await OrchestrationService.get(req, h, 'Bob','GBR-34424-234234-234234', contactId);

      expect(result).toStrictEqual(Service.initialState[redisKey]);
    });
  });

  describe('for any other journey', () => {

    let mockGetSessionStore: jest.SpyInstance;
    const mockSessionStore = {
      readAllFor: jest.fn(),
      writeAllFor: jest.fn()
    };

    let mockGetDraftDataFromProcessingStatement: jest.SpyInstance;
    let mockGetDraftDataFromStorageDocument: jest.SpyInstance;

    const redisKey = 'otherJourney';

    const req: any = {
      app: {claims: {sub: 'Bob'}},
      params: {redisKey: redisKey}
    };

    const res = jest.fn();

    beforeAll(() => {
      mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
      mockGetSessionStore.mockResolvedValue(mockSessionStore);

      mockGetDraftDataFromProcessingStatement = jest.spyOn(ProcessingStatementService, 'getDraftData');
      mockGetDraftDataFromStorageDocument = jest.spyOn(StorageDocumentService, 'getDraftData');
    });

    afterAll(() => {
      mockGetDraftDataFromProcessingStatement.mockRestore();
      mockGetDraftDataFromStorageDocument.mockRestore();
      mockGetSessionStore.mockRestore();
      res.mockReset();
    });

    it('should return data as {}', async () => {
      const data = {};

      const result = await OrchestrationService.get(req, h, 'Bob','GBR-34424-234234-234234', contactId);

      expect(result).toEqual(data);
      expect(mockGetDraftDataFromProcessingStatement).not.toHaveBeenCalled();
      expect(mockGetDraftDataFromStorageDocument).not.toHaveBeenCalled();
    });

  });

});

describe('saveAndValidate', () => {

  const testUser = 'Bob';

  const sampleData = {
    test: 'test',
    push: ()=>{}
  };

  let mockGetSessionStore: jest.SpyInstance;
  const mockSessionStore = {
    readAllFor: jest.fn(),
    writeAllFor: jest.fn()
  };

  const req: any = {
    app: {claims: {sub: testUser}},
    params: {redisKey: ""},
    payload: {
      consignmentDescription: "test"
    },
    query: {
      n: "next/url",
      c: "/create-processing-statement/add-consignment-details",
      saveToRedisIfErrors: true
    },
    headers: {
      accept: false
    }
  };

  const res = jest.fn();

  beforeAll(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
    mockSessionStore.readAllFor.mockResolvedValue(sampleData);
  });

  afterAll(() => {
    mockGetSessionStore.mockRestore();
    res.mockReset();
  });

  describe('Processing statement', () => {

    let mockGetDraftData: jest.SpyInstance;
    let mockUpsertDraftData: jest.SpyInstance;

    const exporterDetails: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: "original data" },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      },
    };

    const exportData = {
      exportData : {
      catches: [{
        species: "Astronesthes niger (AHR)",
        id: '2342234-1610018899',
        catchCertificateNumber: "2342234",
        totalWeightLanded: "34",
        exportWeightBeforeProcessing: "34",
        exportWeightAfterProcessing: "45",
        scientificName: "some scientific name"
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
      exportedTo: 'India'
      }};

    beforeEach(() => {
      mockGetDraftData = jest.spyOn(ProcessingStatementService, 'getDraft');
      mockUpsertDraftData = jest.spyOn(ProcessingStatementService, 'upsertDraftData');
      mockGetDraftData.mockReturnValue(exportData);
      mockUpsertDraftData.mockReturnValue(null);
    });

    afterEach(() => {
      mockGetDraftData.mockRestore();
      mockUpsertDraftData.mockRestore();
    });

    const redisKey = 'processingStatement';

    it('should call getDraft from Processing Statement Service once with the right params', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);

      expect(mockGetDraftData).toHaveBeenCalledWith(testUser, 'GBR-342423-23423-23423', contactId);
    });

    it('should call upsertDraftData for Processing Statement once with the right params', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);

      expect(mockUpsertDraftData).toHaveBeenCalledWith(
        testUser,
        "GBR-342423-23423-23423",
        {
          $set: {
            exportData: {
              consignmentDescription: "test",
              exporterDetails: {
                contactId: "a contact Id",
                accountId: "an account id",
                addressOne: "London",
                buildingNumber: "123",
                subBuildingName: "Unit 1",
                buildingName: "CJC Fish Ltd",
                streetName: "17  Old Edinburgh Road",
                county: "West Midlands",
                country: "England",
                townCity: "London",
                postcode: "SE37 6YH",
                exporterCompanyName: "Exporter Fish Ltd",
                _dynamicsAddress: { someData: "original data" },
                _dynamicsUser: {
                  firstName: "John",
                  lastName: "Doe",
                },
              },
            },
          },
        },
        contactId
      );
    });

  });

  describe('Storage Notes', () => {

    let mockGetDraftData: jest.SpyInstance;
    let mockUpsertDraftData: jest.SpyInstance;

    const exporterDetails: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: "original data" },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      },
    };

    const dataInSession = {
      test: "test",
      exportData : {
        catches: [{
          product: "Atlantic herring (HER)",
          id: '12345-' + moment.utc().unix(),
          commodityCode: "12345",
          productWeight: "45",
          dateOfUnloading: "28/01/2020",
          placeOfUnloading: "London",
          transportUnloadedFrom: "12345",
          certificateNumber: "12345",
          weightOnCC: "45",
          scientificName: "some scientific name"
        }],
        storageFacilities: [{
          facilityName: "Storage Facilities",
          facilityAddressOne: "Build and Street",
          facilityStreetName: "Street",
          facilityTownCity: "Essex",
          facilityPostcode: "ES8 7UJ",
          _facilityUpdated: false
        }],
        exporterDetails: exporterDetails,
        exportedTo: {
          officialCountryName: "some-exported-to"
        },
        facilityName: "Storage Facilities",
        facilityAddressOne: "Build and Street",
        facilityStreetName: "Street",
        facilityTownCity: "Essex",
        facilityPostcode: "ES8 7UJ",
        facilityStorage: "Chilled",
        _facilityUpdated: false,
        facilityArrivalDate: "20/11/2023",
        transportation: {
          exportedTo: {
            officialCountryName: "some-exported-to"
          }
        }
      }
    };

    beforeEach(() => {
      mockGetDraftData = jest.spyOn(StorageDocumentService, 'getDraft');
      mockUpsertDraftData = jest.spyOn(StorageDocumentService, 'upsertDraftData');
      mockGetDraftData.mockReturnValue(dataInSession);
      mockUpsertDraftData.mockReturnValue(null);
    });

    afterEach(() => {
      mockGetDraftData.mockRestore();
      mockUpsertDraftData.mockRestore();
    });

    const req: any = {
      app: {claims: {sub: testUser}},
      params: {redisKey: ""},
      payload: toFrontEndStorageDocumentExportData(dataInSession.exportData as any),
      query: {
        n: "next/url",
        c: "/test",
        saveToRedisIfErrors: true
      },
      headers: {
        accept: false
      }
    };

    const redisKey = 'storageNotes';

    it('should call getDraftData from Storage Note Service once with the right params', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);

      expect(mockGetDraftData).toHaveBeenCalledWith(testUser,'GBR-342423-23423-23423', 'contactBob');
    });

    it('should call upsertDraftData for Storage Note once with the right params', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);

      expect(mockUpsertDraftData).toHaveBeenCalledWith(testUser, "GBR-342423-23423-23423",{"$set": {"exportData": {
        catches: [{
          product: "Atlantic herring (HER)",
          id: expect.any(String),
          commodityCode: "12345",
          productWeight: "45",
          dateOfUnloading: "28/01/2020",
          placeOfUnloading: "London",
          transportUnloadedFrom: "12345",
          certificateNumber: "12345",
          weightOnCC: "45",
          scientificName: "some scientific name"
        }],
        exporterDetails: exporterDetails,
        exportedTo: {
          officialCountryName: "some-exported-to"
        },
        facilityAddressOne: "Build and Street",
        facilityApprovalNumber: undefined,
        facilityArrivalDate: "20/11/2023",
        facilityBuildingName: undefined,
        facilityBuildingNumber: undefined,
        facilityCountry: undefined,
        facilityCounty: undefined,
        facilityName: "Storage Facilities",
        facilityPostcode: "ES8 7UJ",
        facilityStorage: "Chilled",
        facilityStreetName: "Street",
        facilitySubBuildingName: undefined,
        facilityTownCity: "Essex",
      }}}, 'contactBob');
    });
  });

  describe('Anything else', () => {

    let mockGetSessionStore: jest.SpyInstance;
    const mockSessionStore = {
      readAllFor: jest.fn(),
      writeAllFor: jest.fn()
    };

    const req: any = {
      app: {claims: {sub: testUser}},
      params: {redisKey: ""},
      payload: {
        consignmentDescription: "test"
      },
      query: {
        n: "next/url",
        c: "/create-processing-statement/add-consignment-details",
        saveToRedisIfErrors: true
      },
      headers: {
        accept: false
      }
    };

    const res = jest.fn();

    beforeAll(() => {
      mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
      mockGetSessionStore.mockResolvedValue(mockSessionStore);
    });

    afterAll(() => {
      mockGetSessionStore.mockRestore();
      res.mockReset();
    });

    const redisKey = 'test';

    beforeEach(() => {
      mockSessionStore.readAllFor.mockResolvedValue({});
    });

    it('should return the data using the rest', async () => {
      req.params.redisKey = redisKey;
      const result = await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);

      expect(result).toEqual({"consignmentDescription": "test"});
    });

    it('should return call readAllFor Once with re right params', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);
      expect(mockSessionStore.readAllFor).toHaveBeenCalledTimes(1);
      expect(mockSessionStore.readAllFor).toHaveBeenCalledWith('Bob', contactId, redisKey);
    });

    it('should return call readAllFor Once with re right params with consignmentDescription', async () => {
      req.params.redisKey = redisKey;
      await OrchestrationService.saveAndValidate(req, res as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, 'Bob','GBR-342423-23423-23423', contactId);
      expect(mockSessionStore.writeAllFor).toHaveBeenCalledTimes(1);
      expect(mockSessionStore.writeAllFor).toHaveBeenCalledWith('Bob', contactId,redisKey,{"consignmentDescription": "test"});
    });

  });

});

describe('generatePdf', () => {

  describe('for processing statement', () => {
    const redisKey = processingStatement;

    const req: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891" } },
      params: { redisKey: redisKey },
      query: { n: '/create-processing-statement/processing-statements'},
      payload: {
        data: '127.0.0.1'
      },
      headers: {
        accept: false
      }
    };

    const mockData = {
      "data": {
        "catches": [
          {
            "species": "Atlantic herring (HER)",
            "id": '1234-1610018899',
            "catchCertificateNumber": "1234",
            "totalWeightLanded": "12",
            "exportWeightBeforeProcessing": "12",
            "exportWeightAfterProcessing": "12"
          }
        ],
        "validationErrors": [],
        "error": "",
        "addAnotherCatch": "No",
        "consignmentDescription": "code",
        "healthCertificateDate": "04/06/2020",
        "healthCertificateNumber": "1234",
        "personResponsibleForConsignment": "Isaac",
        "plantApprovalNumber": "1234",
        "plantName": "Plant Name",
        "plantAddressOne": "Building and Street",
        "plantAddressTwo": "Building Street name 2",
        "plantTownCity": "London",
        "plantPostcode": "WE23 2WE",
        "dateOfAcceptance": "04/06/2020"
      },
      "exporter": {
        "model": {
          "exporterCompanyName": "Exporter Fish Ltd",
          "addressOne": "Build and Street",
          "addressTwo": "Street",
          "townCity": "Essex",
          "postcode": "ES8 7UJ",
          "user_id": "",
          "journey": "processingStatement",
          "currentUri": "",
          "nextUri": ""
        }
      }
    };

    const mockPdfResponse = {
      "container": "export-certificates",
      "blobName": "_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf",
      "uri": "_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf",
      "qrUri": "http://localhost:3001/qr/export-certificates/_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf"
    };

    const res = jest.fn();
    let mockReportDocumentSubmitted: jest.SpyInstance;
    let mockLoadRequiredData: jest.SpyInstance;
    let mockGetBlockingStatus: jest.SpyInstance;
    let mockClearSessionDataForCurrentJourney: jest.SpyInstance;
    let mockInvalidateDraftCache: jest.SpyInstance;
    let mockDeleteDraftLink: jest.SpyInstance;
    let mockPostEventData: jest.SpyInstance;
    let mockGeneratePdfAndUpload: jest.SpyInstance;
    let mockCompleteDraft: jest.SpyInstance;
    let mockLoggerError: jest.SpyInstance;
    let mockValidateCompletedDocument: jest.SpyInstance;
    let mockValidateSpecies: jest.SpyInstance;
    let mockLoggerInfo: jest.SpyInstance;
    let mockIsEuCountry: jest.SpyInstance;

    beforeEach(() => {
      mockReportDocumentSubmitted = jest.spyOn(ReferenceDataService, 'reportDocumentSubmitted');
      mockLoadRequiredData = jest.spyOn(Service, 'loadRequiredData');
      mockGetBlockingStatus = jest.spyOn(SystemBlock, 'getBlockingStatus');
      mockClearSessionDataForCurrentJourney = jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney');
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
      mockDeleteDraftLink = jest.spyOn(SaveAsDraftService, 'deleteDraftLink');
      mockPostEventData = jest.spyOn(MonitoringService, 'postEventData');
      mockGeneratePdfAndUpload = jest.spyOn(pdfService, 'generatePdfAndUpload');
      mockCompleteDraft = jest.spyOn(ProcessingStatementService, 'completeDraft');
      mockLoggerError = jest.spyOn(logger, 'error');
      mockLoggerInfo = jest.spyOn(logger, "info");
      mockIsEuCountry = jest.spyOn(EuCountriesService, 'isEuCountry');
      mockIsEuCountry.mockResolvedValue(true);
      mockLoadRequiredData.mockResolvedValue(mockData);
      mockClearSessionDataForCurrentJourney.mockResolvedValue(null);
      mockInvalidateDraftCache.mockResolvedValue(null);
      mockDeleteDraftLink.mockResolvedValue(null);
      mockPostEventData.mockResolvedValue(null);
      mockGeneratePdfAndUpload.mockResolvedValue(mockPdfResponse);
      mockCompleteDraft.mockResolvedValue(null);
      mockReportDocumentSubmitted.mockResolvedValue(null);
      mockedAxios.put.mockResolvedValueOnce(null);

      mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
      mockValidateCompletedDocument.mockResolvedValue(true);

      mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
      mockValidateSpecies.mockResolvedValue(true);
    });

    afterEach(() => {
      res.mockReset();
      jest.restoreAllMocks();
    });

    it('should save a submit record to the defra validation data hub 1', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-PS-3434-3434",
            documentType: "storageDocument",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            id: 'FCC051-1610018899',
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      const expected = mockValidResponse.data.rawData;

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockGetBlockingStatus).toHaveBeenCalledWith('PS_SD_4b');
      expect(mockClearSessionDataForCurrentJourney).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
      expect(mockDeleteDraftLink).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        'Bob',
        'User successfully created a processing statement',
        'completed/processing statement/dn:GBR-3434-PS-3434-3434',
        '127.0.0.1',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'CREATE-PS'
      );
      expect(mockCompleteDraft).toHaveBeenCalledWith('GBR-3434-PS-3434-3434', '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf', 'foo@foo.com');

      expect(mockReportDocumentSubmitted).toHaveBeenCalled();
      expect(mockReportDocumentSubmitted).toHaveBeenCalledWith('/v1/sdps/data-hub/submit', expected);
      expect(mockReportDocumentSubmitted).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        uri: '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf',
        documentNumber: 'GBR-3434-PS-3434-3434'
      });
    });

    it('should set catch submission in progress and submit to catch when EU catch feature is enabled', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      const mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);
      const mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(documentNumber);
      expect(mockSubmitToCatchSystem).toHaveBeenCalledWith(documentNumber, 'submit');
    });

    it('should log and continue when setting catch submission in progress fails', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      const mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockRejectedValue(new Error('set status failed'));
      const mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(documentNumber);
      expect(mockSubmitToCatchSystem).not.toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith('[CATCH-SYSTEM-SUBMIT][GBR-3434-PS-3434-3434][ERROR][set status failed]');
    });

    it('should not submit to catch when EU catch feature is disabled', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      mockIsEuCountry.mockResolvedValue(false);
      const mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);
      const mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockSetCatchSubmissionInProgress).not.toHaveBeenCalled();
      expect(mockSubmitToCatchSystem).not.toHaveBeenCalled();
    });

    it('should log error when submitToCatchSystem fails for PS', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);
      jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockRejectedValue(new Error('submit failed'));

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('[CATCH-SYSTEM-SUBMIT][GBR-3434-PS-3434-3434][ERROR][submit failed]');
    });

    it('should gracefully handle a SUBMIT event failure', async () => {
        const userPrincipal = 'Bob';
        const documentNumber = 'GBR-3434-PS-3434-3434';
        const mockValidResponse = {
          data: {
            isValid: true,
            details: [],
            rawData: [{
              catchCertificateNumber: "FCC051",
              commodityCode: "423523432",
              createdAt: expect.any(String),
              da: "England",
              documentNumber: "GBR-3434-PS-3434-3434",
              documentType: "storageDocument",
              extended: {
                exporterCompanyName: "BONZO",
                investigation: undefined,
                preApprovedBy: undefined,
                url: undefined,
                voidedBy: undefined,
              },
              isMismatch: false,
              isOverAllocated: true,
              overAllocatedByWeight: 200,
              species: "Atlantic herring (HER)",
              id: 'FCC051-1610018899',
              status: "DRAFT",
              weightOnAllDocs: 1200,
              weightOnDoc: 200,
              weightOnFCC: 1000,
            }]
          }
        };

        mockReportDocumentSubmitted.mockRejectedValue(new Error('error'));

        mockGetBlockingStatus.mockResolvedValue(true);
        mockedAxios.post.mockResolvedValueOnce(mockValidResponse);
        mockedAxios.put.mockResolvedValueOnce({});

        const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

        expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
        expect(mockGetBlockingStatus).toHaveBeenCalledWith('PS_SD_4b');
        expect(mockClearSessionDataForCurrentJourney).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
        expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
        expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
        expect(mockDeleteDraftLink).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
        expect(mockPostEventData).toHaveBeenCalled();
        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'User successfully created a processing statement',
          'completed/processing statement/dn:GBR-3434-PS-3434-3434',
          '127.0.0.1',
          0,
          '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
          'CREATE-PS'
        );
        expect(mockCompleteDraft).toHaveBeenCalledWith('GBR-3434-PS-3434-3434', '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf', 'foo@foo.com');

        expect(result).toEqual({
          uri: '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf',
          documentNumber: 'GBR-3434-PS-3434-3434'
        });

        expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-SD-PS-DOCUMENT-SUBMIT][GBR-3434-PS-3434-3434][ERROR][Error: error]');
    });

    it('should return 400 if there are validation errors', async () => {
      mockValidateCompletedDocument.mockResolvedValue(false);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';

      const mockDatawithCatchType = {
        "data": {
          "catches": [
            {
              "species": "Atlantic herring (HER)",
              "id": '1234-1610018899',
              "catchCertificateNumber": "1234",
              "catchCertificateType": "uk",
              "totalWeightLanded": "12",
              "exportWeightBeforeProcessing": "12",
              "exportWeightAfterProcessing": "12"
            }
          ],
          "validationErrors": [],
          "error": "",
          "addAnotherCatch": "No",
          "consignmentDescription": "code",
          "healthCertificateDate": "04/06/2020",
          "healthCertificateNumber": "1234",
          "personResponsibleForConsignment": "Isaac",
          "plantApprovalNumber": "1234",
          "plantName": "Plant Name",
          "plantAddressOne": "Building and Street",
          "plantAddressTwo": "Building Street name 2",
          "plantTownCity": "London",
          "plantPostcode": "WE23 2WE",
          "dateOfAcceptance": "04/06/2020"
        },
        "exporter": {
          "model": {
            "exporterCompanyName": "Exporter Fish Ltd",
            "addressOne": "Build and Street",
            "addressTwo": "Street",
            "townCity": "Essex",
            "postcode": "ES8 7UJ",
            "user_id": "",
            "journey": "processingStatement",
            "currentUri": "",
            "nextUri": ""
          }
        }
      };


      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("1234", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-PS-3434-3434");
      expect(mockValidateSpecies).not.toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[DOCUMENT-NUMBER: GBR-3434-PS-3434-3434][PS-SD-CHECKING-ERRORS][{"message":"psAddCatchDetailsErrorUKCCInValid","key":"catches-0-catchCertificateNumber"}]');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(400);
    });

    it('should return 400 if there are species validation errors', async () => {
      mockValidateSpecies.mockResolvedValue(false);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';

      const mockDatawithCatchType = {
        "data": {
          "catches": [
            {
              "species": "Atlantic herring (HER)",
              "speciesCode": "HER",
              "id": '1234-1610018899',
              "catchCertificateNumber": "1234",
              "catchCertificateType": "uk",
              "totalWeightLanded": "12",
              "exportWeightBeforeProcessing": "12",
              "exportWeightAfterProcessing": "12"
            }
          ],
          "validationErrors": [],
          "error": "",
          "addAnotherCatch": "No",
          "consignmentDescription": "code",
          "healthCertificateDate": "04/06/2020",
          "healthCertificateNumber": "1234",
          "personResponsibleForConsignment": "Isaac",
          "plantApprovalNumber": "1234",
          "plantName": "Plant Name",
          "plantAddressOne": "Building and Street",
          "plantAddressTwo": "Building Street name 2",
          "plantTownCity": "London",
          "plantPostcode": "WE23 2WE",
          "dateOfAcceptance": "04/06/2020"
        },
        "exporter": {
          "model": {
            "exporterCompanyName": "Exporter Fish Ltd",
            "addressOne": "Build and Street",
            "addressTwo": "Street",
            "townCity": "Essex",
            "postcode": "ES8 7UJ",
            "user_id": "",
            "journey": "processingStatement",
            "currentUri": "",
            "nextUri": ""
          }
        }
      };


      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("1234", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-PS-3434-3434");
      expect(mockValidateSpecies).toHaveBeenCalledWith('1234', 'Atlantic herring (HER)', 'HER', 'Bob', '03fece4e-61e4-e911-a978-000d3a28d891', 'GBR-3434-PS-3434-3434');
      expect(mockLoggerInfo).toHaveBeenCalledWith('[DOCUMENT-NUMBER: GBR-3434-PS-3434-3434][PS-SD-CHECKING-ERRORS][{"message":"psAddCatchDetailsErrorUKCCInValid","key":"catches-0-catchCertificateNumber"}]');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(400);
    });

    it('should return 400 for report errors', async () => {
      const mockInvalidResponse = {
        data: {
          isValid: false,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-PS-3434-3434",
            documentType: "processingStatement",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      mockGetBlockingStatus.mockResolvedValue(true);

      mockedAxios.post.mockResolvedValueOnce(mockInvalidResponse);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';

      const mockDatawithCatchType = {
        "data": {
          "catches": [
            {
              "species": "Atlantic cod (COD)",
              "speciesCode": "COD",
              "id": 'GBR-DOCUMENT-NUMBER-1610018899',
              "catchCertificateNumber": "GBR-DOCUMENT-NUMBER",
              "catchCertificateType": "uk",
              "totalWeightLanded": "12",
              "exportWeightBeforeProcessing": "12",
              "exportWeightAfterProcessing": "12"
            }
          ],
          "validationErrors": [],
          "error": "",
          "addAnotherCatch": "No",
          "consignmentDescription": "code",
          "healthCertificateDate": "04/06/2020",
          "healthCertificateNumber": "1234",
          "personResponsibleForConsignment": "Isaac",
          "plantApprovalNumber": "1234",
          "plantName": "Plant Name",
          "plantAddressOne": "Building and Street",
          "plantAddressTwo": "Building Street name 2",
          "plantTownCity": "London",
          "plantPostcode": "WE23 2WE",
          "dateOfAcceptance": "04/06/2020"
        },
        "exporter": {
          "model": {
            "exporterCompanyName": "Exporter Fish Ltd",
            "addressOne": "Build and Street",
            "addressTwo": "Street",
            "townCity": "Essex",
            "postcode": "ES8 7UJ",
            "user_id": "",
            "journey": "processingStatement",
            "currentUri": "",
            "nextUri": ""
          }
        }
      };

      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-PS-3434-3434', 'processingStatement', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("GBR-DOCUMENT-NUMBER", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-PS-3434-3434");
      expect(mockValidateSpecies).toHaveBeenCalledWith('GBR-DOCUMENT-NUMBER', 'Atlantic cod (COD)', 'COD', 'Bob', '03fece4e-61e4-e911-a978-000d3a28d891', 'GBR-3434-PS-3434-3434');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockReportDocumentSubmitted).toHaveBeenCalled();
      expect(result).toEqual(400);
    });

    it('should log error if data submit fails', async () => {
      const mockInvalidResponse = {
        data: {
          isValid: false,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-PS-3434-3434",
            documentType: "processingStatement",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      mockGetBlockingStatus.mockResolvedValue(true);

      mockedAxios.post.mockResolvedValueOnce(mockInvalidResponse);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';

      const mockDatawithCatchType = {
        "data": {
          "catches": [
            {
              "species": "Atlantic cod (COD)",
              "speciesCode": "COD",
              "id": 'GBR-DOCUMENT-NUMBER-1610018899',
              "catchCertificateNumber": "GBR-DOCUMENT-NUMBER",
              "catchCertificateType": "uk",
              "totalWeightLanded": "12",
              "exportWeightBeforeProcessing": "12",
              "exportWeightAfterProcessing": "12"
            }
          ],
          "validationErrors": [],
          "error": "",
          "addAnotherCatch": "No",
          "consignmentDescription": "code",
          "healthCertificateDate": "04/06/2020",
          "healthCertificateNumber": "1234",
          "personResponsibleForConsignment": "Isaac",
          "plantApprovalNumber": "1234",
          "plantName": "Plant Name",
          "plantAddressOne": "Building and Street",
          "plantAddressTwo": "Building Street name 2",
          "plantTownCity": "London",
          "plantPostcode": "WE23 2WE",
          "dateOfAcceptance": "04/06/2020"
        },
        "exporter": {
          "model": {
            "exporterCompanyName": "Exporter Fish Ltd",
            "addressOne": "Build and Street",
            "addressTwo": "Street",
            "townCity": "Essex",
            "postcode": "ES8 7UJ",
            "user_id": "",
            "journey": "processingStatement",
            "currentUri": "",
            "nextUri": ""
          }
        }
      };

      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      mockReportDocumentSubmitted.mockRejectedValueOnce(new Error('something has gone wrong'))

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-SD-PS-DOCUMENT-SUBMIT][GBR-3434-PS-3434-3434][ERROR][Error: something has gone wrong]')
    });
  });

  describe('for storage note', () => {
    const redisKey = storageNote;

    const req: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891" } },
      params: { redisKey: redisKey },
      query: { n: '/create-processing-statement/processing-statements'},
      payload: {
        data: '127.0.0.1'
      },
      headers: {
        accept: false
      }
    };

    const mockData = {
      "data": {
        "catches": [
          {
            "species": "Atlantic herring (HER)",
            "id": '1234-1610018899',
            "catchCertificateNumber": "1234",
            "totalWeightLanded": "12",
            "exportWeightBeforeProcessing": "12",
            "exportWeightAfterProcessing": "12"
          }
        ],
        "validationErrors": [
          {}
        ],
        "transport": {
          "vehicle": "truck",
          "cmr": true,
          "exportedTo": {
            "officialCountryName": "Åland Islands",
            "isoCodeAlpha2": "AX",
            "isoCodeAlpha3": "ALA",
            "isoNumericCode": "248"
          }
        },
        "error": "",
        "addAnotherCatch": "No",
        "consignmentDescription": "code",
        "healthCertificateDate": "04/06/2020",
        "healthCertificateNumber": "1234",
        "personResponsibleForConsignment": "Isaac",
        "plantApprovalNumber": "1234",
        "plantName": "Plant Name",
        "plantAddressOne": "Building and Street",
        "plantAddressTwo": "Building Street name 2",
        "plantTownCity": "London",
        "plantPostcode": "WE23 2WE",
        "dateOfAcceptance": "04/06/2020"
      },
      "exporter": {
        "model": {
          "exporterCompanyName": "Exporter Fish Ltd",
          "addressOne": "Build and Street",
          "addressTwo": "Street",
          "townCity": "Essex",
          "postcode": "ES8 7UJ",
          "user_id": "",
          "journey": "storageNotes",
          "currentUri": "",
          "nextUri": ""
        }
      }
    };

    const mockPdfResponse = {
      "container": "export-certificates",
      "blobName": "_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf",
      "uri": "_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf",
      "qrUri": "http://localhost:3001/qr/export-certificates/_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf"
    };

    const res = jest.fn();
    let mockReportDocumentSubmitted: jest.SpyInstance;
    let mockLoadRequiredData: jest.SpyInstance;
    let mockGetBlockingStatus: jest.SpyInstance;
    let mockClearSessionDataForCurrentJourney: jest.SpyInstance;
    let mockInvalidateDraftCache: jest.SpyInstance;
    let mockDeleteDraftLink: jest.SpyInstance;
    let mockPostEventData: jest.SpyInstance;
    let mockGeneratePdfAndUpload: jest.SpyInstance;
    let mockCompleteDraft: jest.SpyInstance;
    let mockLoggerError: jest.SpyInstance;
    let mockValidateCompletedDocument: jest.SpyInstance;
    let mockValidateSpecies: jest.SpyInstance;
    let mockLoggerInfo: jest.SpyInstance;
    let mockIsEuCountry: jest.SpyInstance;

    beforeEach(() => {
      mockReportDocumentSubmitted = jest.spyOn(ReferenceDataService, 'reportDocumentSubmitted');
      mockLoadRequiredData = jest.spyOn(Service, 'loadRequiredData');
      mockGetBlockingStatus = jest.spyOn(SystemBlock, 'getBlockingStatus');
      mockClearSessionDataForCurrentJourney = jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney');
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
      mockDeleteDraftLink = jest.spyOn(SaveAsDraftService, 'deleteDraftLink');
      mockPostEventData = jest.spyOn(MonitoringService, 'postEventData');
      mockGeneratePdfAndUpload = jest.spyOn(pdfService, 'generatePdfAndUpload');
      mockCompleteDraft = jest.spyOn(StorageDocumentService, 'completeDraft');
      mockLoggerError = jest.spyOn(logger, 'error');
      mockLoggerInfo = jest.spyOn(logger, 'info');
      mockIsEuCountry = jest.spyOn(EuCountriesService, 'isEuCountry');
      mockIsEuCountry.mockResolvedValue(true);

      mockLoadRequiredData.mockResolvedValue(mockData);
      mockClearSessionDataForCurrentJourney.mockResolvedValue(null);
      mockInvalidateDraftCache.mockResolvedValue(null);
      mockDeleteDraftLink.mockResolvedValue(null);
      mockPostEventData.mockResolvedValue(null);
      mockGeneratePdfAndUpload.mockResolvedValue(mockPdfResponse);
      mockCompleteDraft.mockResolvedValue(null);
      mockReportDocumentSubmitted.mockResolvedValue(null);
      mockedAxios.put.mockResolvedValueOnce(null);

      mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
      mockValidateCompletedDocument.mockResolvedValue(true);

      mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
      mockValidateSpecies.mockResolvedValue(true);
    });

    afterEach(() => {
      res.mockReset();
      jest.restoreAllMocks();
    });

    it('should save a submit record to the defra validation data hub', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-SD-3434-3434",
            documentType: "storageDocument",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      const expected = mockValidResponse.data.rawData;

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', storageNote, '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockGetBlockingStatus).toHaveBeenCalledWith('PS_SD_4b');
      expect(mockClearSessionDataForCurrentJourney).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
      expect(mockDeleteDraftLink).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', storageNote, '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        'Bob',
        'User successfully created a storage document',
        'completed/storage document/dn:GBR-3434-SD-3434-3434',
        '127.0.0.1',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'CREATE-SD'
      );
      expect(mockCompleteDraft).toHaveBeenCalledWith('GBR-3434-SD-3434-3434', '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf', 'foo@foo.com');

      expect(mockReportDocumentSubmitted).toHaveBeenCalled();
      expect(mockReportDocumentSubmitted).toHaveBeenCalledWith('/v1/sdps/data-hub/submit', expected);
      expect(mockReportDocumentSubmitted).toHaveBeenCalledTimes(1);

      expect(mockGeneratePdfAndUpload).toHaveBeenCalledWith("export-certificates", "Storage Note", mockData.data, expect.anything(), expect.anything(), documentNumber);
      expect(result).toEqual({
        uri: '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf',
        documentNumber: 'GBR-3434-SD-3434-3434'
      });
    });

    it('should gracefully handle a SUBMIT event failure', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-SD-3434-3434",
            documentType: "storageDocument",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            id: 'FCC051-1610018899',
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      mockReportDocumentSubmitted.mockRejectedValue(new Error('error'));

      mockGetBlockingStatus.mockResolvedValue(true);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);
      mockedAxios.put.mockResolvedValueOnce({});

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', storageNote, '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockGetBlockingStatus).toHaveBeenCalledWith('PS_SD_4b');
      expect(mockClearSessionDataForCurrentJourney).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
      expect(mockDeleteDraftLink).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', storageNote, '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        'Bob',
        'User successfully created a storage document',
        'completed/storage document/dn:GBR-3434-SD-3434-3434',
        '127.0.0.1',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'CREATE-SD'
      );
      expect(mockCompleteDraft).toHaveBeenCalledWith('GBR-3434-SD-3434-3434', '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf', 'foo@foo.com');

      expect(result).toEqual({
        uri: '_755e758f-6e43-4b0c-aa73-c45b6eb8cd81.pdf',
        documentNumber: 'GBR-3434-SD-3434-3434'
      });

      expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-SD-PS-DOCUMENT-SUBMIT][GBR-3434-SD-3434-3434][ERROR][Error: error]');
    });

    it('should set catch submission in progress and submit to catch when EU catch feature is enabled for SD', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      const mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);
      const mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(documentNumber);
      expect(mockSubmitToCatchSystem).toHaveBeenCalledWith(documentNumber, 'submit');
    });

    it('should log error when submitToCatchSystem fails for SD', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      const mockValidResponse = {
        data: {
          isValid: true,
          details: [],
          rawData: []
        }
      };

      jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);
      jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockRejectedValue(new Error('submit failed'));

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce(mockValidResponse);

      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('[CATCH-SYSTEM-SUBMIT][GBR-3434-SD-3434-3434][ERROR][submit failed]');
    });

    it('should return 400 if there are validation errors', async () => {
      mockValidateCompletedDocument.mockResolvedValue(false);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';

      const mockDatawithCatchType = {
        data: {
          catches: [{
            id: 'some id',
            product: 'Atlantic cod (COD)',
            commodityCode: '0123456',
            productWeight: '10',
            dateOfUnloading: '10/10/2023',
            placeOfUnloading: 'Hull',
            transportUnloadedFrom: 'Dover',
            certificateNumber: 'GBR-DOCUMENT-NUMBER',
            weightOnCC: '100',
            scientificName: 'some scientific name',
            certificateType: 'uk'
          }],
          storageFacilities: [{
            facilityName: 'storage facility name'
          }],
          validationErrors: [],
          addAnotherProduct: "No",
          transport: {
            vehicle: 'truck',
            cmr: 'true',
            nationalityOfVehicle: 'UK',
            registrationNumber: 'registration name',
            departurePlace: 'UK',
            exportDate: '10/10/2022',
            exportedTo: {
              officialCountryName: 'some official name'
            },
          }
        },
        exporter: {
          moel: {
            exporterCompanyName: "Exporter Fish Ltd",
            addressOne: "Build and Street",
            addressTwo: "Street",
            townCity: "Essex",
            postcode: "ES8 7UJ",
            user_id: "",
            journey: "storageNotes",
            currentUri: "",
            nextUri: ""
          }
        }
      };

      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', 'storageNotes', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("GBR-DOCUMENT-NUMBER", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-SD-3434-3434");
      expect(mockValidateSpecies).not.toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[DOCUMENT-NUMBER: GBR-3434-SD-3434-3434][PS-SD-CHECKING-ERRORS][{"message":"sdAddCatchDetailsErrorUKDocumentInvalid","key":"catches-0-certificateNumber","certificateNumber":"GBR-DOCUMENT-NUMBER","product":"Atlantic cod (COD)"}]');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(400);
    });

    it('should return 400 if there are species validation errors', async () => {
      mockValidateSpecies.mockResolvedValue(false);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';

      const mockDatawithCatchType = {
        data: {
          catches: [{
            id: 'some id',
            product: 'Atlantic cod (COD)',
            commodityCode: '0123456',
            productWeight: '10',
            dateOfUnloading: '10/10/2023',
            placeOfUnloading: 'Hull',
            transportUnloadedFrom: 'Dover',
            certificateNumber: 'GBR-DOCUMENT-NUMBER',
            weightOnCC: '100',
            scientificName: 'some scientific name',
            certificateType: 'uk'
          }],
          storageFacilities: [{
            facilityName: 'storage facility name'
          }],
          validationErrors: [],
          addAnotherProduct: "No",
          transport: {
            vehicle: 'truck',
            cmr: 'true',
            nationalityOfVehicle: 'UK',
            registrationNumber: 'registration name',
            departurePlace: 'UK',
            exportDate: '10/10/2022',
            exportedTo: {
              officialCountryName: 'some official name'
            },
          }
        },
        exporter: {
          moel: {
            exporterCompanyName: "Exporter Fish Ltd",
            addressOne: "Build and Street",
            addressTwo: "Street",
            townCity: "Essex",
            postcode: "ES8 7UJ",
            user_id: "",
            journey: "storageNotes",
            currentUri: "",
            nextUri: ""
          }
        }
      };

      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', 'storageNotes', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("GBR-DOCUMENT-NUMBER", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-SD-3434-3434");
      expect(mockValidateSpecies).toHaveBeenCalledWith('GBR-DOCUMENT-NUMBER', 'Atlantic cod (COD)', null, 'Bob', '03fece4e-61e4-e911-a978-000d3a28d891', 'GBR-3434-SD-3434-3434');
      expect(mockLoggerInfo).toHaveBeenCalledWith('[DOCUMENT-NUMBER: GBR-3434-SD-3434-3434][PS-SD-CHECKING-ERRORS][{"message":"sdAddUKEntryDocumentSpeciesDoesNotExistError","key":"catches-0-certificateNumber","certificateNumber":"GBR-DOCUMENT-NUMBER","product":"Atlantic cod (COD)"}]');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(400);
    });

    it('should return 400 for report errors', async () => {
      const mockInvalidResponse = {
        data: {
          isValid: false,
          details: [],
          rawData: [{
            catchCertificateNumber: "FCC051",
            commodityCode: "423523432",
            createdAt: expect.any(String),
            da: "England",
            documentNumber: "GBR-3434-SD-3434-3434",
            documentType: "storageDocument",
            extended: {
              exporterCompanyName: "BONZO",
              investigation: undefined,
              preApprovedBy: undefined,
              url: undefined,
              voidedBy: undefined,
            },
            isMismatch: false,
            isOverAllocated: true,
            overAllocatedByWeight: 200,
            species: "Atlantic herring (HER)",
            status: "DRAFT",
            weightOnAllDocs: 1200,
            weightOnDoc: 200,
            weightOnFCC: 1000,
          }]
        }
      };

      mockGetBlockingStatus.mockResolvedValue(true);

      mockedAxios.post.mockResolvedValueOnce(mockInvalidResponse);

      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';

      const mockDatawithCatchType = {
        data: {
          catches: [{
            id: 'some id',
            product: 'Atlantic cod (COD)',
            commodityCode: '0123456',
            productWeight: '10',
            dateOfUnloading: '10/10/2023',
            placeOfUnloading: 'Hull',
            transportUnloadedFrom: 'Dover',
            certificateNumber: 'GBR-DOCUMENT-NUMBER',
            weightOnCC: '100',
            scientificName: 'some scientific name',
            certificateType: 'uk'
          }],
          facilityName: 'storage facility name',
          validationErrors: [],
          addAnotherProduct: "No",
          transport: {
            vehicle: 'truck',
            cmr: 'true',
            nationalityOfVehicle: 'UK',
            registrationNumber: 'registration name',
            departurePlace: 'UK',
            exportDate: '10/10/2022',
            exportedTo: {
              officialCountryName: 'some official name'
            },
          }
        },
        exporter: {
          moel: {
            exporterCompanyName: "Exporter Fish Ltd",
            addressOne: "Build and Street",
            addressTwo: "Street",
            townCity: "Essex",
            postcode: "ES8 7UJ",
            user_id: "",
            journey: "storageNotes",
            currentUri: "",
            nextUri: ""
          }
        }
      };

      mockLoadRequiredData.mockResolvedValue(mockDatawithCatchType);

      const result = await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockLoadRequiredData).toHaveBeenCalledWith('Bob', 'GBR-3434-SD-3434-3434', 'storageNotes', '03fece4e-61e4-e911-a978-000d3a28d891');
      expect(mockValidateCompletedDocument).toHaveBeenCalledWith("GBR-DOCUMENT-NUMBER", "Bob", "03fece4e-61e4-e911-a978-000d3a28d891", "GBR-3434-SD-3434-3434");
      expect(mockValidateSpecies).toHaveBeenCalledWith('GBR-DOCUMENT-NUMBER', 'Atlantic cod (COD)', null, 'Bob', '03fece4e-61e4-e911-a978-000d3a28d891', 'GBR-3434-SD-3434-3434');
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockReportDocumentSubmitted).toHaveBeenCalled();
      expect(result).toEqual(400);
    });
  });
});

describe('OrchestrationService', () => {
  const redisKey = 'processingStatement';
  const req: any = {
    app: { claims: { sub: "Bob" } },
    query: { c: "c" },
    params: { redisKey },
    headers: {
      accept: "text, text/html"
    }
  };
  const mockSessionStore: any = {
    readAllFor: jest.fn(),
    writeAllFor: jest.fn()
  };
  let mockGetSessionStore: jest.SpyInstance;

  beforeEach(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  })

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('back() returns valid data', async () => {
    const mockData = { data : {}};
    mockSessionStore.readAllFor = () => mockData;
    mockGetSessionStore.mockResolvedValue(mockSessionStore);

    const data = await OrchestrationService.back(req, h);

    expect(data).toEqual(mockData);
  });

  it('removeKey() returns valid response', async () => {
    const result = await OrchestrationService.removeKey(req, h);

    expect(result).toEqual({data: {}});
  });

  it('orchestration.service isPositiveNumberWithTwoDecimals() validates correctly', () => {
      let result = isPositiveNumberWithTwoDecimals('1.11');
      expect(result).toBeTruthy();

      result = isPositiveNumberWithTwoDecimals('1.1');
      expect(result).toBeTruthy();

      result = isPositiveNumberWithTwoDecimals('10');
      expect(result).toBeTruthy();

      result = isPositiveNumberWithTwoDecimals('.10');
      expect(result).toBeTruthy();

      result = isPositiveNumberWithTwoDecimals('1.13434');
      expect(result).toBeFalsy();
  });

  it('orchestration.service isInvalidLength() validates correctly', () => {
    const min = MIN_COMMODITY_CODE_LENGTH;
    const max = MAX_COMMODITY_CODE_LENGTH;

    let result = isInvalidLength('123456', min, max);
    expect(result).toBeFalsy();

    result = isInvalidLength('12345', min, max);
    expect(result).toBeTruthy();

    result = isInvalidLength('1234567890123', min, max);
    expect(result).toBeTruthy();

    result = isInvalidLength('1234567890', min, max);
    expect(result).toBeFalsy();
});

it('orchestration.service isNumbersOnly() validates correctly', () => {
  let result = isNumbersOnly('123456');
  expect(result).toBeTruthy();

  result = isNumbersOnly('+123456');
  expect(result).toBeFalsy();

  result = isNumbersOnly('12.3');
  expect(result).toBeFalsy();
});

it('orchestration.service isPsPlantNameValid() validates correctly', () => {
  let result = isPsPlantNameValid('!M&S');
  expect(result).toBeFalsy();

  result = isPsPlantNameValid('M&S');
  expect(result).toBeTruthy();

  result = isPsPlantNameValid('Marks and Spencer Group');
  expect(result).toBeTruthy();
});

});

describe('getFromMongo', () => {
  let mockGetDraftData: jest.SpyInstance;
  let mockToFrontEndProcessingStatementExportData: jest.SpyInstance;
  let mockAddTotalWeightLandedProcessingStatement: jest.SpyInstance;
  let mockIsOldProcessingPlantAddress: jest.SpyInstance;
  let mockClearOldProcessingPlantAddress: jest.SpyInstance;

  const sessionSampleExportData = {
    exportData : {
      catches: [],
      exporterDetails: {
        contactId : 'a contact Id',
        accountId  : 'an account id',
        exporterCompanyName: "Exporter Fish Ltd",
        addressOne: "London",
        addressTwo: "London",
        townCity: "London",
        postcode: "SE37 6YH",
        _dynamicsAddress: {},
        _dynamicsUser : {
          firstName: "John",
          lastName: "Doe"
        }
      },
      consignmentDescription: "Commodity code",
      healthCertificateNumber: "45645",
      healthCertificateDate: "27/10/2019",
      personResponsibleForConsignment: "Isaac",
      plantApprovalNumber: "12345",
      plantName: "Plant Name",
      plantAddressOne: "London",
      plantBuildingName: "plantBuildingName",
      plantBuildingNumber: "plantBuildingNumber",
      plantSubBuildingName: "plantSubBuildingName",
      plantStreetName: "plantStreetName",
      plantCountry: "plantCountry",
      plantCounty: "plantCounty",
      plantTownCity: "London",
      plantPostcode: "SE37 6YH",
      dateOfAcceptance: "10/02/2020",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    }
  };

  const sessionSampleExportDataWithCatches = {
    exportData : {
      catches: [{
        species: 'Atlantic cod (COD)',
        catchCertificateNumber: 'GBR-2022-CC-012345678',
        catchCertificateType: 'uk',
        scientificName: 'some-scientic-name'
      }],
      exporterDetails: {
        contactId : 'a contact Id',
        accountId  : 'an account id',
        exporterCompanyName: "Exporter Fish Ltd",
        addressOne: "London",
        addressTwo: "London",
        townCity: "London",
        postcode: "SE37 6YH",
        _dynamicsAddress: {},
        _dynamicsUser : {
          firstName: "John",
          lastName: "Doe"
        }
      },
      consignmentDescription: "Commodity code",
      healthCertificateNumber: "45645",
      healthCertificateDate: "27/10/2019",
      personResponsibleForConsignment: "Isaac",
      plantApprovalNumber: "12345",
      plantName: "Plant Name",
      plantAddressOne: "London",
      plantBuildingName: "plantBuildingName",
      plantBuildingNumber: "plantBuildingNumber",
      plantSubBuildingName: "plantSubBuildingName",
      plantStreetName: "plantStreetName",
      plantCountry: "plantCountry",
      plantCounty: "plantCounty",
      plantTownCity: "London",
      plantPostcode: "SE37 6YH",
      dateOfAcceptance: "10/02/2020",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    }
  };

  beforeAll(() => {
    mockGetDraftData = jest.spyOn(ProcessingStatementService, 'getDraft');
    mockToFrontEndProcessingStatementExportData = jest.spyOn(ProcessingStatement, 'toFrontEndProcessingStatementExportData');
    mockAddTotalWeightLandedProcessingStatement = jest.spyOn(ProcessingStatement, 'addTotalWeightLandedProcessingStatement');
    mockIsOldProcessingPlantAddress = jest.spyOn(ProcessingStatement, 'isOldProcessingPlantAddress');
    mockClearOldProcessingPlantAddress = jest.spyOn(ProcessingStatement, 'clearOldProcessingPlantAddress');

    mockGetDraftData.mockResolvedValue(sessionSampleExportData);
    mockToFrontEndProcessingStatementExportData.mockReturnValue(sessionSampleExportData.exportData);
    mockAddTotalWeightLandedProcessingStatement.mockResolvedValue(sessionSampleExportDataWithCatches.exportData.catches);
    mockClearOldProcessingPlantAddress.mockReturnValue(null);

  });

  afterAll(() => {
    mockGetDraftData.mockRestore();
    mockToFrontEndProcessingStatementExportData.mockRestore();
    mockAddTotalWeightLandedProcessingStatement.mockRestore();
    mockIsOldProcessingPlantAddress.mockRestore();
    mockClearOldProcessingPlantAddress.mockRestore();
  });

  it('should return unmodified data as it is in new format', async () => {
    mockGetDraftData.mockResolvedValue(sessionSampleExportData);

    const result = await OrchestrationService.getFromMongo('Bob','GBR-34424-234234-234234', processingStatement, contactId);
    expect(mockAddTotalWeightLandedProcessingStatement).not.toHaveBeenCalled();
    expect(result).toStrictEqual(toFrontEndProcessingStatementExportData(sessionSampleExportData.exportData as any));
  });

  it('should return old format address cleared', async () => {
    const sessionSampleExportDataNewFormat = {
      exportData : {
        plantAddressOne: "plantAddressOne",
        plantTownCity: "plantTownCity",
        plantPostcode: "plantPostcode",
      }
    }

    const result = await OrchestrationService.getFromMongo('Bob','GBR-34424-234234-234234', processingStatement, contactId);
    expect(result).toStrictEqual(toFrontEndProcessingStatementExportData(sessionSampleExportDataNewFormat.exportData as any));
  });

  it('should return the front end catch with total weight landed', async () => {
    mockGetDraftData.mockResolvedValue(sessionSampleExportDataWithCatches);

    const result = await OrchestrationService.getFromMongo('Bob','GBR-34424-234234-234234', processingStatement, contactId);
    expect(mockAddTotalWeightLandedProcessingStatement).toHaveBeenCalledWith('GBR-34424-234234-234234', 'Bob', 'contactBob', sessionSampleExportDataWithCatches.exportData.catches);
    expect(result).toStrictEqual(toFrontEndProcessingStatementExportData(sessionSampleExportDataWithCatches.exportData as any));
  })
});

describe('get verifiy remaining methods', () => {
  it('should call isPositiveWholeNumber', async () => {
    const result = Service.isPositiveWholeNumber(10);
    expect(result).toBeTruthy();
  })

  it('should call validateNumber', async () => {
    const result = Service.validateNumber('abc');
    expect(result).toBeFalsy();
  })

  it('should call validatePositiveNumber', async () => {
    const result = Service.validatePositiveNumber('eat');
    expect(result).toBeFalsy();
  })

  it('should call checkValidationErrors', async () => {
    const result = Service.checkValidationErrors([{
      message: 'psAddCatchDetailsErrorUKCCInValid',
      key: `catches-ctch-catchCertificateNumber`
    }]);
    expect(result).toBeTruthy();
  })

  it('should call getRedirectionData', async () => {
    const result = Service.getRedirectionData({headers:{accept: 'text/html'}}, 'case1', 'case2');
    expect(result).toBeTruthy();
  })

  it('should call numberAsString', async () => {
    const result = Service.numberAsString(1);
    expect(result).toStrictEqual('1');
  })

  it('should call validateCCNumberFormat', async () => {
    const result = Service.validateCCNumberFormat('number');
    expect(result).toBeTruthy();
  })

  it('should call validateUKCCNumberFormat', async () => {
    const result = Service.validateUKCCNumberFormat('number');
    expect(result).toBeFalsy();
  })

  it('should call validateUKDocumentNumberFormat', async () => {
    const result = Service.validateUKDocumentNumberFormat('number');
    expect(result).toBeFalsy();
  })

  it('should call validateNonUKCCNumberCharLimit', async () => {
    const result = Service.validateNonUKCCNumberCharLimit('number');
    expect(result).toBeTruthy();
  })

  it('should call validatePersonResponsibleForConsignmentFormat', async () => {
    const result = Service.validatePersonResponsibleForConsignmentFormat('number');
    expect(result).toBeTruthy();
  })

  it('should call isPlantApprovalNumberFormatValid', async () => {
    const result = Service.isPlantApprovalNumberFormatValid('number');
    expect(result).toBeTruthy();
  })

  it('should call isPlaceProductEntersUkValid', async () => {
    const result = Service.isPlaceProductEntersUkValid('number');
    expect(result).toBeTruthy();
  })

  it('should call validateProductDescriptions without consignmentDescription', async () => {
    const result = Service.validateProductDescriptions([
      {
        description: 'desc',
        commodityCode: 'commodityCode',
      }
    ], '');
    expect(result).toBeTruthy();
  })

  it('should call validateProductDescriptions with consignmentDescription', async () => {
    const result = Service.validateProductDescriptions(undefined, '*desc');
    expect(result).toBeTruthy();
  })

  it('should call validateExportHealthCertificateFormat', async () => {
    const result = Service.validateExportHealthCertificateFormat(45353);
    expect(result).toBeFalsy();
  })

  it('should call validateMaximumFutureDate', async () => {
    const result = Service.validateMaximumFutureDate(new Date());
    expect(result).toBeTruthy();
  })

  it('should call validateDate', async () => {
    const result = Service.validateDate(new Date());
    expect(result).toBeTruthy();
  })

  it('should call cleanDate', async () => {
    const result = Service.cleanDate(new Date());
    expect(result).toBeTruthy();
  })

  it('should call today', async () => {
    const result = Service.today();
    expect(result).toBeTruthy();
  })

  it('should call validateDateIsSameOrBefore', async () => {
    const result = Service.validateDateIsSameOrBefore("09/10/2023", "10/10/2023");
    expect(result).toBeTruthy();
  })

});

describe('checkCertificate', () => {
  it('should return the online validation report on success', async () => {
    const mockReport = { isValid: true, rawData: {}, details: {} };
    mockedAxios.post.mockResolvedValueOnce({ data: mockReport });

    const result = await OrchestrationService.checkCertificate({ catches: [] }, 'http://mock-validation-url', h);

    expect(result).toEqual(mockReport);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://mock-validation-url',
      { dataToValidate: { catches: [] } }
    );
  });

  it('should throw an error when the axios call fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      OrchestrationService.checkCertificate({ catches: [] }, 'http://mock-validation-url', h)
    ).rejects.toThrow();
  });
});

describe('checkValidationProcessingStatement', () => {
  let mockValidateCompletedDocument: jest.SpyInstance;
  let mockValidateSpecies: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
    mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
  });

  afterEach(() => {
    mockValidateCompletedDocument.mockRestore();
    mockValidateSpecies.mockRestore();
  });

  it('should push a validation error when a uk catch certificate is invalid', async () => {
    mockValidateCompletedDocument.mockResolvedValue(false);
    mockValidateSpecies.mockResolvedValue(true);

    const data: any = {
      catches: [{
        catchCertificateNumber: 'GBR-2022-CC-INVALID01',
        species: 'Atlantic Cod',
        speciesCode: 'COD',
        catchCertificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationProcessingStatement(data, 'user', 'contact', 'GBR-2022-PS-123456789');

    expect(data.validationErrors).toHaveLength(1);
    expect(data.validationErrors[0]).toMatchObject({
      message: 'psAddCatchDetailsErrorUKCCInValid',
      key: 'catches-0-catchCertificateNumber',
    });
  });

  it('should push a validation error when species validation fails for a uk certificate', async () => {
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpecies.mockResolvedValue(false);

    const data: any = {
      catches: [{
        catchCertificateNumber: 'GBR-2022-CC-123456789',
        species: 'Wrong Species',
        speciesCode: 'WRG',
        catchCertificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationProcessingStatement(data, 'user', 'contact', 'GBR-2022-PS-123456789');

    expect(data.validationErrors).toHaveLength(1);
    expect(data.validationErrors[0]).toMatchObject({
      message: 'psAddCatchDetailsErrorUKCCInValid',
      key: 'catches-0-catchCertificateNumber',
    });
  });

  it('should not push any errors when a uk certificate and species are both valid', async () => {
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpecies.mockResolvedValue(true);

    const data: any = {
      catches: [{
        catchCertificateNumber: 'GBR-2022-CC-123456789',
        species: 'Atlantic Cod',
        speciesCode: 'COD',
        catchCertificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationProcessingStatement(data, 'user', 'contact', 'GBR-2022-PS-123456789');

    expect(data.validationErrors).toHaveLength(0);
  });

  it('should not validate non-uk catch certificates', async () => {
    const data: any = {
      catches: [{
        catchCertificateNumber: 'FR-2022-CC-123',
        species: 'Atlantic Cod',
        speciesCode: 'COD',
        catchCertificateType: 'non_uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationProcessingStatement(data, 'user', 'contact', 'GBR-2022-PS-123456789');

    expect(mockValidateCompletedDocument).not.toHaveBeenCalled();
    expect(data.validationErrors).toHaveLength(0);
  });
});

describe('checkValidationStorageNotes', () => {
  let mockValidateCompletedDocument: jest.SpyInstance;
  let mockValidateSpecies: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCompletedDocument = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
    mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
  });

  afterEach(() => {
    mockValidateCompletedDocument.mockRestore();
    mockValidateSpecies.mockRestore();
  });

  it('should push sdAddCatchDetailsErrorUKDocumentInvalid when a uk document is invalid', async () => {
    mockValidateCompletedDocument.mockResolvedValue(false);

    const data: any = {
      catches: [{
        certificateNumber: 'GBR-2022-CC-INVALID01',
        product: 'Atlantic herring',
        certificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationStorageNotes(data, 'user', 'contact', 'GBR-2022-SD-123456789');

    expect(data.validationErrors).toHaveLength(1);
    expect(data.validationErrors[0]).toMatchObject({
      message: 'sdAddCatchDetailsErrorUKDocumentInvalid',
      key: 'catches-0-certificateNumber',
      certificateNumber: 'GBR-2022-CC-INVALID01',
      product: 'Atlantic herring',
    });
  });

  it('should push sdAddUKEntryDocumentSpeciesDoesNotExistError when uk document is valid but species does not match', async () => {
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpecies.mockResolvedValue(false);

    const data: any = {
      catches: [{
        certificateNumber: 'GBR-2022-CC-123456789',
        product: 'Wrong Species',
        certificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationStorageNotes(data, 'user', 'contact', 'GBR-2022-SD-123456789');

    expect(data.validationErrors).toHaveLength(1);
    expect(data.validationErrors[0]).toMatchObject({
      message: 'sdAddUKEntryDocumentSpeciesDoesNotExistError',
      key: 'catches-0-certificateNumber',
      certificateNumber: 'GBR-2022-CC-123456789',
      product: 'Wrong Species',
    });
  });

  it('should not push any errors for a valid uk document with matching species', async () => {
    mockValidateCompletedDocument.mockResolvedValue(true);
    mockValidateSpecies.mockResolvedValue(true);

    const data: any = {
      catches: [{
        certificateNumber: 'GBR-2022-CC-123456789',
        product: 'Atlantic herring',
        certificateType: 'uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationStorageNotes(data, 'user', 'contact', 'GBR-2022-SD-123456789');

    expect(data.validationErrors).toHaveLength(0);
  });

  it('should not validate non-uk certificate types', async () => {
    const data: any = {
      catches: [{
        certificateNumber: 'FR-2022-CC-123',
        product: 'Atlantic herring',
        certificateType: 'non_uk',
      }],
      validationErrors: [],
    };

    await OrchestrationService.checkValidationStorageNotes(data, 'user', 'contact', 'GBR-2022-SD-123456789');

    expect(mockValidateCompletedDocument).not.toHaveBeenCalled();
    expect(data.validationErrors).toHaveLength(0);
  });
});

describe('clearDataFromJourney', () => {
  let mockClearSessionData: jest.SpyInstance;
  let mockCompleteDraftPS: jest.SpyInstance;
  let mockCompleteDraftSD: jest.SpyInstance;

  beforeEach(() => {
    mockClearSessionData = jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney').mockResolvedValue(undefined);
    mockCompleteDraftPS = jest.spyOn(ProcessingStatementService, 'completeDraft').mockResolvedValue(undefined);
    mockCompleteDraftSD = jest.spyOn(StorageDocumentService, 'completeDraft').mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockClearSessionData.mockRestore();
    mockCompleteDraftPS.mockRestore();
    mockCompleteDraftSD.mockRestore();
  });

  it('should clear session and complete the draft for processingStatement', async () => {
    const pdf = { uri: 'https://blob.example.com/ps-doc.pdf' };
    const user = { email: 'user@example.com', principal: 'user123' };

    await OrchestrationService.clearDataFromJourney(processingStatement, 'user123', 'GBR-2022-PS-123456789', pdf, user, 'contact123');

    expect(mockClearSessionData).toHaveBeenCalledWith('user123', 'GBR-2022-PS-123456789', 'contact123');
    expect(mockCompleteDraftPS).toHaveBeenCalledWith('GBR-2022-PS-123456789', pdf.uri, user.email);
    expect(mockCompleteDraftSD).not.toHaveBeenCalled();
  });

  it('should clear session and complete the draft for storageNote', async () => {
    const pdf = { uri: 'https://blob.example.com/sd-doc.pdf' };
    const user = { email: 'user@example.com', principal: 'user123' };

    await OrchestrationService.clearDataFromJourney(storageNote, 'user123', 'GBR-2022-SD-123456789', pdf, user, 'contact123');

    expect(mockClearSessionData).toHaveBeenCalledWith('user123', 'GBR-2022-SD-123456789', 'contact123');
    expect(mockCompleteDraftSD).toHaveBeenCalledWith('GBR-2022-SD-123456789', pdf.uri, user.email);
    expect(mockCompleteDraftPS).not.toHaveBeenCalled();
  });
});

describe('back and removeKey HTML redirect paths', () => {
  const mockSessionStore: any = {
    readAllFor: jest.fn(),
    writeAllFor: jest.fn(),
  };
  let mockGetSessionStore: jest.SpyInstance;
  let mockRedirect: jest.Mock;

  const htmlReq: any = {
    app: { claims: { sub: 'Bob', contactId: 'contact123' } },
    query: { c: '/redirect-target', n: '/next-url' },
    params: { redisKey: processingStatement },
    payload: {},
    headers: { accept: 'text/html' },
  };

  beforeEach(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
    mockSessionStore.readAllFor.mockResolvedValue({ someData: 'value' });
    mockRedirect = jest.fn().mockReturnValue('redirected');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('back() should redirect when request accepts HTML', async () => {
    const htmlH = { ...h, redirect: mockRedirect } as any;

    await OrchestrationService.back(htmlReq, htmlH);

    expect(mockRedirect).toHaveBeenCalledWith('/redirect-target');
  });

  it('back() should return data when request does not accept HTML', async () => {
    const jsonReq: any = {
      ...htmlReq,
      headers: { accept: 'application/json' },
    };
    const mockData = { someData: 'value' };
    mockSessionStore.readAllFor.mockResolvedValue(mockData);

    const result = await OrchestrationService.back(jsonReq, h);

    expect(result).toEqual(mockData);
  });

  it('removeKey() should redirect when request accepts HTML', async () => {
    const htmlH = { ...h, redirect: mockRedirect } as any;
    mockSessionStore.readAllFor.mockResolvedValue({});

    await OrchestrationService.removeKey(htmlReq, htmlH);

    expect(mockRedirect).toHaveBeenCalledWith('/redirect-target');
  });

  it('removeKey() should filter empty array elements from session data', async () => {
    const jsonReq: any = {
      ...htmlReq,
      headers: { accept: 'application/json' },
      query: { c: '/redirect-target', key: 'toRemove' },
      payload: {},
    };
    mockSessionStore.readAllFor.mockResolvedValue({
      items: ['first', null, 'second', undefined, 'third'],
      toRemove: 'some-value',
    });

    const result: any = await OrchestrationService.removeKey(jsonReq, h);

    expect(result.items).toEqual(['first', 'second', 'third']);
    expect(result.toRemove).toBeUndefined();
  });

  it('removeKey() should use n query param as redirect when c is absent', async () => {
    const htmlH = { ...h, redirect: mockRedirect } as any;
    const reqWithN: any = {
      ...htmlReq,
      query: { n: '/fallback-url', key: 'someKey' },
    };
    mockSessionStore.readAllFor.mockResolvedValue({});

    await OrchestrationService.removeKey(reqWithN, htmlH);

    expect(mockRedirect).toHaveBeenCalledWith('/fallback-url');
  });
});

describe('uncovered utility functions', () => {
  it('should call validateMaximumOneDayFutureDate with a past date', () => {
    const result = Service.validateMaximumOneDayFutureDate('01/01/2020');
    expect(result).toBeTruthy();
  });

  it('should call validateMaximumOneDayFutureDate with a far future date', () => {
    const result = Service.validateMaximumOneDayFutureDate('01/01/2099');
    expect(result).toBeFalsy();
  });

  it('should call isNotExceed12Digit with a valid number', () => {
    const result = Service.isNotExceed12Digit('12345');
    expect(result).toBeTruthy();
  });

  it('should call isNotExceed12Digit with a number exceeding 12 digits', () => {
    const result = Service.isNotExceed12Digit('999999999999');
    expect(result).toBeFalsy();
  });

  it('should call isNotExceed12Digit with NaN', () => {
    const result = Service.isNotExceed12Digit('abc');
    expect(result).toBeFalsy();
  });

  it('should call isApprovalNumberValid with a valid string', () => {
    const result = Service.isApprovalNumberValid('ABC-123.45/67');
    expect(result).toBeTruthy();
  });

  it('should call isApprovalNumberValid with an invalid string', () => {
    const result = Service.isApprovalNumberValid('ABC@#$');
    expect(result).toBeFalsy();
  });

  it('should call validateTodayOrInThePast with a past date', () => {
    const result = Service.validateTodayOrInThePast('01/01/2020');
    expect(result).toBeTruthy();
  });

  it('should call validateDateBefore correctly', () => {
    const result = Service.validateDateBefore('01/01/2020', '02/01/2020');
    expect(result).toBeTruthy();
  });
});

describe('handleErrors', () => {
  it('should set errors on data and originalSessionData when errors are present', () => {
    const errors = { field: 'some error' };
    const data: any = {};
    const originalSessionData: any = {};
    const urlsObj = { currentUrl: '/test/:documentNumber/edit', nextUrl: '/next' };

    const result = OrchestrationService.handleErrors(errors, data, 'DOC-123', originalSessionData, null, urlsObj, undefined);

    expect(data.errors).toEqual(errors);
    expect(data.errorsUrl).toBe('/test/DOC-123/edit');
    expect(originalSessionData.errors).toEqual(errors);
    expect(originalSessionData.errorsUrl).toBe('/test/DOC-123/edit');
    expect(result).toBe('/test/:documentNumber/edit');
  });

  it('should use provided next url when errors are present and next is given', () => {
    const errors = { field: 'some error' };
    const data: any = {};
    const originalSessionData: any = {};
    const urlsObj = { currentUrl: '/current', nextUrl: '/next' };

    const result = OrchestrationService.handleErrors(errors, data, 'DOC-123', originalSessionData, '/custom-next', urlsObj, undefined);

    expect(result).toBe('/custom-next');
  });

  it('should set nextUrl and setOnValidationSuccess when no errors', () => {
    const data: any = { errors: { old: 'error' }, errorsUrl: '/old' };
    const originalSessionData: any = {};
    const urlsObj = { currentUrl: '/current', nextUrl: '/next' };

    const result = OrchestrationService.handleErrors({}, data, 'DOC-123', originalSessionData, null, urlsObj, 'isValid');

    expect(data.isValid).toBe(true);
    expect(data.errors).toBeUndefined();
    expect(data.errorsUrl).toBeUndefined();
    expect(result).toBe('/next');
  });

  it('should use provided next when no errors and next is present', () => {
    const data: any = {};
    const originalSessionData: any = {};
    const urlsObj = { currentUrl: '/current', nextUrl: '/next' };

    const result = OrchestrationService.handleErrors({}, data, 'DOC-123', originalSessionData, '/provided-next', urlsObj, undefined);

    expect(result).toBe('/provided-next');
  });
});

describe('getDataToSave', () => {
  it('should return originalSessionData.exportData when data has errors and saveToRedisIfErrors is false and not HTML', () => {
    const data = { errors: { field: 'error' } };
    const req: any = { headers: { accept: 'application/json' } };
    const originalSessionData = { exportData: { someField: 'value' } };

    const result = OrchestrationService.getDataToSave(false, data, req, 'test', {}, 'DOC-123', originalSessionData);

    expect(result).toEqual({ someField: 'value' });
  });

  it('should return data when saveToRedisIfErrors is true and data has errors', () => {
    const data = { errors: { field: 'error' }, consignmentDescription: 'test' };
    const req: any = { headers: { accept: 'application/json' } };
    const originalSessionData = { exportData: { someField: 'value' } };

    const result = OrchestrationService.getDataToSave(true, data, req, 'test', {}, 'DOC-123', originalSessionData);

    expect(result).toEqual(data);
  });
});

describe('loadRequiredData', () => {
  it('should load and return processing statement data', async () => {
    const mockDraftData = {
      exportData: {
        catches: [],
        consignmentDescription: 'test',
        exporterDetails: {
          contactId: 'c1',
          accountId: 'a1',
          exporterCompanyName: 'Fish Co',
          addressOne: 'Street',
          townCity: 'London',
          postcode: 'SE1 1AA',
        },
      },
    };

    const mockGetDraft = jest.spyOn(ProcessingStatementService, 'getDraft').mockResolvedValue(mockDraftData as any);

    const result: any = await Service.loadRequiredData('Bob', 'GBR-2022-PS-123456789', processingStatement, 'contact1');

    expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-2022-PS-123456789', 'contact1');
    expect(result.data).toBeDefined();
    expect(result.exporter).toBeDefined();
    expect(result.exporter.model.journey).toBe(processingStatement);

    mockGetDraft.mockRestore();
  });

  it('should load and return storage note data', async () => {
    const mockDraftData = {
      exportData: {
        catches: [],
        storageFacilities: [],
        exporterDetails: {
          contactId: 'c1',
          accountId: 'a1',
          exporterCompanyName: 'Fish Co',
          addressOne: 'Street',
          townCity: 'London',
          postcode: 'SE1 1AA',
        },
        exportedTo: {
          officialCountryName: 'France',
        },
      },
    };

    const mockGetDraft = jest.spyOn(StorageDocumentService, 'getDraft').mockResolvedValue(mockDraftData as any);

    const result: any = await Service.loadRequiredData('Bob', 'GBR-2022-SD-123456789', storageNote, 'contact1');

    expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-2022-SD-123456789', 'contact1');
    expect(result.data).toBeDefined();
    expect(result.exporter).toBeDefined();
    expect(result.exporter.model.journey).toBe(storageNote);

    mockGetDraft.mockRestore();
  });
});

describe('generatePdf additional paths', () => {
  const mockPdfResponse = {
    container: 'export-certificates',
    blobName: '_test.pdf',
    uri: '_test.pdf',
    qrUri: 'http://localhost/qr/_test.pdf',
  };

  const mockData = {
    data: {
      catches: [],
      validationErrors: [],
      error: '',
    },
    exporter: {
      model: {
        exporterCompanyName: 'Fish Ltd',
        journey: processingStatement,
      },
    },
  };

  let mockLoadRequiredData: jest.SpyInstance;
  let mockGetBlockingStatus: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    mockLoadRequiredData = jest.spyOn(Service, 'loadRequiredData').mockResolvedValue(mockData as any);
    mockGetBlockingStatus = jest.spyOn(SystemBlock, 'getBlockingStatus');
    jest.spyOn(CatchCertService, 'invalidateDraftCache').mockResolvedValue(null);
    mockLoggerError = jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney').mockResolvedValue(null);
    jest.spyOn(SaveAsDraftService, 'deleteDraftLink').mockResolvedValue(null);
    jest.spyOn(MonitoringService, 'postEventData').mockResolvedValue(null);
    jest.spyOn(pdfService, 'generatePdfAndUpload').mockResolvedValue(mockPdfResponse);
    jest.spyOn(ProcessingStatementService, 'completeDraft').mockResolvedValue(null);
    jest.spyOn(ReferenceDataService, 'reportDocumentSubmitted').mockResolvedValue(null);
    mockedAxios.put.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect when validation errors exist and request accepts HTML', async () => {
    const htmlReq: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: '123', contactId: 'c1' } },
      params: { redisKey: processingStatement },
      query: { n: '/next', c: '/check-info' },
      payload: { data: '127.0.0.1' },
      headers: { accept: 'text/html' },
    };

    const mockDataWithErrors = {
      data: {
        catches: [],
        validationErrors: [{ message: 'error', key: 'field' }],
        error: '',
      },
      exporter: { model: { journey: processingStatement } },
    };
    mockLoadRequiredData.mockResolvedValue(mockDataWithErrors);
    const mockRedirect = jest.fn().mockReturnValue('redirected');
    const htmlH: any = { redirect: mockRedirect, response: () => ({ code: (c: number) => c }) };

    await OrchestrationService.generatePdf(htmlReq, htmlH, 'Bob', 'GBR-2022-PS-123456789');

    expect(mockRedirect).toHaveBeenCalledWith('create-processing-statement/GBR-2022-PS-123456789/check-your-information');
  });

  it('should log error when getBlockingStatus throws', async () => {
    const req: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: '123', contactId: 'c1' } },
      params: { redisKey: processingStatement },
      query: { n: '/next' },
      payload: { data: '127.0.0.1' },
      headers: { accept: false },
    };

    mockGetBlockingStatus.mockRejectedValue(new Error('blocking error'));
    mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });

    await OrchestrationService.generatePdf(req, h, 'Bob', 'GBR-2022-PS-123456789');

    expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('[GETTING-BLOCKING-STATUS-PSSD][ERROR]'));
  });

  it('should redirect when validation is invalid, blocking is true, and request accepts HTML', async () => {
    const htmlReq: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: '123', contactId: 'c1' } },
      params: { redisKey: processingStatement },
      query: { n: '/next', c: '/check-info' },
      payload: { data: '127.0.0.1' },
      headers: { accept: 'text/html' },
    };

    mockGetBlockingStatus.mockResolvedValue(true);
    mockedAxios.post.mockResolvedValueOnce({ data: { isValid: false, details: ['err'], rawData: [] } });
    const mockRedirect = jest.fn().mockReturnValue('redirected');
    const htmlH: any = { redirect: mockRedirect, response: () => ({ code: (c: number) => c }) };

    await OrchestrationService.generatePdf(htmlReq, htmlH, 'Bob', 'GBR-2022-PS-123456789');

    expect(mockRedirect).toHaveBeenCalledWith('/check-info');
  });

  it('should return unsupported error for unknown redisKey', async () => {
    const req: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: '123', contactId: 'c1' } },
      params: { redisKey: 'unknownKey' },
      query: { n: '/next' },
      payload: { data: '127.0.0.1' },
      headers: { accept: false },
    };

    mockGetBlockingStatus.mockResolvedValue(false);
    mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });

    const result = await OrchestrationService.generatePdf(req, h, 'Bob', 'GBR-2022-PS-123456789');

    expect(result).toEqual({ error: 'unsupported unknownKey' });
  });
});

describe('saveAndValidate additional paths', () => {
  const testUser = 'Bob';
  let mockGetSessionStore: jest.SpyInstance;
  const mockSessionStore = {
    readAllFor: jest.fn(),
    writeAllFor: jest.fn(),
  };

  beforeEach(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect to saveAsDraftUrl when acceptsHtml is true and no errors', async () => {
    const req: any = {
      app: { claims: { sub: testUser } },
      params: { redisKey: 'catchCertificate' },
      payload: { someField: 'value' },
      query: {
        n: '/next',
        c: '/current',
        saveAsDraftUrl: '/save-as-draft',
      },
      headers: { accept: 'text/html' },
    };
    mockSessionStore.readAllFor.mockResolvedValue({});
    const mockRedirect = jest.fn().mockReturnValue('redirected');
    const htmlH: any = { redirect: mockRedirect };

    await OrchestrationService.saveAndValidate(req, htmlH, testUser, 'DOC-123', 'contact1');

    expect(mockRedirect).toHaveBeenCalledWith('/save-as-draft');
  });

  it('should redirect to next when acceptsHtml is true and errors exist', async () => {
    const req: any = {
      app: { claims: { sub: testUser } },
      params: { redisKey: 'catchCertificate' },
      payload: { someField: 'value' },
      query: {
        n: '/next',
        c: '/current',
      },
      headers: { accept: 'text/html' },
    };
    mockSessionStore.readAllFor.mockResolvedValue({});
    const mockRedirect = jest.fn().mockReturnValue('redirected');
    const htmlH: any = { redirect: mockRedirect };

    await OrchestrationService.saveAndValidate(req, htmlH, testUser, 'DOC-123', 'contact1');

    expect(mockRedirect).toHaveBeenCalledWith('/next');
  });

  it('should return originalSessionData when data has errors and saveToRedisIfErrors is false', async () => {
    const sessionData = { someField: 'original', errors: undefined };
    mockSessionStore.readAllFor.mockResolvedValue(sessionData);

    const req: any = {
      app: { claims: { sub: testUser } },
      params: { redisKey: 'catchCertificate' },
      payload: { errors: { field: 'error' } },
      query: {
        n: '/next',
        c: '/current',
        saveToRedisIfErrors: 'false',
      },
      headers: { accept: false },
    };

    const result = await OrchestrationService.saveAndValidate(req, h, testUser, 'DOC-123', 'contact1');

    expect(result).toBeDefined();
  });

  it('should call addTotalWeightLandedProcessingStatement when redisKey is processingStatement and data has catches', async () => {
    const mockGetDraft = jest.spyOn(ProcessingStatementService, 'getDraft').mockResolvedValue({
      exportData: {
        catches: [{ species: 'COD', catchCertificateNumber: '123' }],
        exporterDetails: {},
      },
    } as any);
    const mockUpsertDraft = jest.spyOn(ProcessingStatementService, 'upsertDraftData').mockResolvedValue(null);
    const mockAddTotalWeight = jest.spyOn(ProcessingStatement, 'addTotalWeightLandedProcessingStatement').mockResolvedValue([{ species: 'COD', totalWeightLanded: '100' }]);

    const req: any = {
      app: { claims: { sub: testUser } },
      params: { redisKey: processingStatement },
      payload: { catches: [{ species: 'COD' }] },
      query: {
        n: '/next',
        c: '/current',
      },
      headers: { accept: false },
    };

    await OrchestrationService.saveAndValidate(req, h, testUser, 'DOC-123', 'contact1');

    expect(mockAddTotalWeight).toHaveBeenCalledWith('DOC-123', testUser, 'contact1', expect.any(Array));

    mockGetDraft.mockRestore();
    mockUpsertDraft.mockRestore();
    mockAddTotalWeight.mockRestore();
  });
});

describe('sendBusinessContinuityEvent', () => {
  it('should log info on successful BC event', async () => {
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
    mockedAxios.put.mockResolvedValueOnce({});

    // sendBusinessContinuityEvent is private, so we test it through generatePdf
    jest.spyOn(Service, 'loadRequiredData').mockResolvedValue({
      data: { catches: [], validationErrors: [], error: '' },
      exporter: { model: { journey: processingStatement } },
    } as any);
    jest.spyOn(SystemBlock, 'getBlockingStatus').mockResolvedValue(false);
    mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });
    jest.spyOn(CatchCertService, 'invalidateDraftCache').mockResolvedValue(null);
    jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney').mockResolvedValue(null);
    jest.spyOn(SaveAsDraftService, 'deleteDraftLink').mockResolvedValue(null);
    jest.spyOn(MonitoringService, 'postEventData').mockResolvedValue(null);
    jest.spyOn(pdfService, 'generatePdfAndUpload').mockResolvedValue({ uri: 'test.pdf', container: 'c', blobName: 'b', qrUri: 'q' });
    jest.spyOn(ProcessingStatementService, 'completeDraft').mockResolvedValue(null);
    jest.spyOn(ReferenceDataService, 'reportDocumentSubmitted').mockResolvedValue(null);

    const req: any = {
      app: { claims: { sub: 'Bob', email: 'foo@foo.com', auth_time: '123', contactId: 'c1' } },
      params: { redisKey: processingStatement },
      query: { n: '/next' },
      payload: { data: '127.0.0.1' },
      headers: { accept: false },
    };

    await OrchestrationService.generatePdf(req, h, 'Bob', 'DOC-123');
    await new Promise(process.nextTick);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/certificates/DOC-123'),
      expect.objectContaining({ certNumber: 'DOC-123', status: 'COMPLETE' }),
      expect.any(Object)
    );

    jest.restoreAllMocks();
  });
});


