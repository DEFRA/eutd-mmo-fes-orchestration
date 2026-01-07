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

      expect(result).toStrictEqual(toFrontEndProcessingStatementExportData(sessionData.exportData as any));
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

    it('should submit to EU CATCH when destination is an EU country', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      // ensure exportedTo resolves to an EU country
      mockLoadRequiredData.mockResolvedValue({ data: { exportedTo: { officialCountryName: 'SPAIN' }, exporter: {} }, exporter: { model: {} } });
      const mockSubmit = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined as any);

      jest.setTimeout(20000);
      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });
      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockSubmit).not.toHaveBeenCalledWith(documentNumber, 'submit');

      mockSubmit.mockRestore();
    });

    it('should NOT submit to EU CATCH when destination is NOT an EU country', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-PS-3434-3434';
      mockLoadRequiredData.mockResolvedValue({ data: { exportedTo: { officialCountryName: 'INDIA' }, exporter: {} }, exporter: { model: {} } });
      const mockSubmit = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined as any);

      jest.setTimeout(20000);
      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });
      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockSubmit).not.toHaveBeenCalled();

      mockSubmit.mockRestore();
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

    it('should submit to EU CATCH when storage document destination is an EU country', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      // ensure exportedTo resolves to an EU country
      mockLoadRequiredData.mockResolvedValue({ data: { exportedTo: { officialCountryName: 'SPAIN' }, exporter: {} }, exporter: { model: {} } });
      const spyIsEu = jest.spyOn(require('../services/eu-countries.service'), 'isEuCountry').mockResolvedValue(true);
      const mockSubmit = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined as any);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });
      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(spyIsEu).not.toHaveBeenCalled();
      expect(mockSubmit).not.toHaveBeenCalledWith(documentNumber, 'submit');

      spyIsEu.mockRestore();
      mockSubmit.mockRestore();
    });

    it('should NOT submit to EU CATCH when storage document destination is NOT an EU country', async () => {
      const userPrincipal = 'Bob';
      const documentNumber = 'GBR-3434-SD-3434-3434';
      mockLoadRequiredData.mockResolvedValue({ data: { exportedTo: { officialCountryName: 'INDIA' }, exporter: {} }, exporter: { model: {} } });
      const mockSubmit = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined as any);

      mockGetBlockingStatus.mockResolvedValue(false);
      mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, details: [], rawData: [] } });
      await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);

      expect(mockSubmit).not.toHaveBeenCalled();

      mockSubmit.mockRestore();
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

    result = isInvalidLength('123456789012', min, max);
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

  it('should call isTransportUnloadedFromFormatValid', async () => {
    const result = Service.isTransportUnloadedFromFormatValid('number');
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

