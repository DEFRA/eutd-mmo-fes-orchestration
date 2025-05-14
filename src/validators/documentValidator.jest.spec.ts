import * as mongoose from 'mongoose';
import * as CatchCertService from '../persistence/services/catchCert';
import * as CatchCertSchema from '../persistence/schema/catchCert';
import * as ProcessingStatementSchema from '../persistence/schema/processingStatement';
import * as StorageDocSchema from '../persistence/schema/storageDoc';
import * as SUT from './documentValidator'
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MockSessionStorage } from '../../test/session_store/mock';
import { SessionStoreFactory } from '../session_store/factory';
import { BaseModel } from '../persistence/schema/base';
import { IDraft } from '../persistence/schema/common';

describe('document validator', () => {
  const userPrincipal = 'bob';
  const contactId = 'bobContactId';
  const defaultUserReference = 'User Reference';
  const processingStatementDocumentNumber = 'GBR-2023-PS-ABCD01234';
  const storageDocumentNumber = 'GBR-2023-SD-ABCD01234';

  let mongoServer;
  let mockWriteAllFor;
  let mockSessionStore;

  const sampleDocument = (documentNumber, status, user?, draftData?, userReference?, createdAt?, exportData?, contId = contactId) => ({
    documentNumber    : documentNumber,
    status            : status,
    createdAt         : createdAt || new Date('2020-01-16'),
    createdBy         : user || userPrincipal,
    draftData         : draftData || {},
    exportData        : exportData || undefined,
    userReference     : userReference || defaultUserReference,
    contactId         : contId
  });

  let mockGetDraftCache;
  let mockSaveDraftCache;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    mongoose.connect(mongoUri).catch(err => {console.log(err)});

    mockSessionStore = new MockSessionStorage();
    mockWriteAllFor = jest.fn();
    const mockReadAllFor = jest.fn();
    const mockDeleteFor = jest.fn();
    mockSessionStore.writeAllFor = mockWriteAllFor;
    mockSessionStore.readAllFor = mockReadAllFor;
    mockSessionStore.deleteFor = mockDeleteFor;

    const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  beforeEach(() => {
    mockGetDraftCache = jest.spyOn(CatchCertService, 'getDraftCache');
    mockGetDraftCache.mockResolvedValue(null);

    mockSaveDraftCache = jest.spyOn(CatchCertService, 'saveDraftCache');
    mockSaveDraftCache.mockResolvedValue(null);
  });

  afterEach(async () => {
    await BaseModel.deleteMany({});
    mockGetDraftCache.mockRestore();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    jest.resetAllMocks();
  });

  describe('validate completed document', () => {

    it('will return true for a COMPLETE document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(true);
    });

    it('will return false for a DRAFT document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'DRAFT')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will return false for a Processing Statement document matching a COMPLETE PS document', async () => {
      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('doc1', 'COMPLETE')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will return false for a Processing Statement document matching a COMPLETE SD document', async () => {
      await new StorageDocSchema.StorageDocumentModel(sampleDocument('doc1', 'COMPLETE')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will return true for a Storage Document matching a COMPLETE a PS document', async () => {
      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('doc1', 'COMPLETE')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, storageDocumentNumber)).toBe(true);
    });

    it('will return false for a Storage Document matching a DRAFT PS document', async () => {
      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('doc1', 'DRAFT')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, storageDocumentNumber)).toBe(false);
    });

    it('will return false for a Storage Document matching a VOID PS document', async () => {
      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('doc1', 'VOID')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, storageDocumentNumber)).toBe(false);
    });

    it('will return false for a Storage Document matching a LOCKED CC document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'LOCKED')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, storageDocumentNumber)).toBe(false);
    });

    it('will return false for a LOCKED document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'LOCKED')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will return false for a VOID document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'VOID')).save();
      expect(await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will return false for a missing document', async () => {
      await new CatchCertSchema.CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();
      expect(await SUT.validateCompletedDocument('doc2', userPrincipal, contactId, processingStatementDocumentNumber)).toBe(false);
    });

    it('will check REDIS for a Processing Statement Draft cache', async () => {
      const result = await SUT.validateCompletedDocument('doc1', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(mockGetDraftCache).toHaveBeenCalledTimes(1);
      expect(mockGetDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-PS-ABCD01234');
      expect(result).toBe(false);
    });

    it('will return true for a COMPLETE document found in REDIS', async () => {
      const redisCache: IDraft = {
       "GBR-2022-CC-0": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       },
       "GBR-2022-CC-1": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-CC-0', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).not.toHaveBeenCalled();
    });

    it('will return false for a COMPLETE document not found in REDIS', async () => {
      const redisCache: IDraft = {
       "GBR-2022-CC-0": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       },
       "GBR-2022-CC-1": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-CC-3', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
      expect(mockSaveDraftCache).not.toHaveBeenCalled();
    });

    it('will return true for a COMPLETE document not found in REDIS but found in Db and write to REDIS', async () => {
      const exportData: CatchCertSchema.ExportData = {
        exporterDetails: {
          exporterFullName: 'Bob',
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        },
        products: [
          {
            species: "Atlantic cod (COD)",
            speciesId: 'GBR-2022-CC-3-0',
            speciesCode: "COD",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 101,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          },
          {
            species: "Atlantic herring (HER)",
            speciesId: 'GBR-2022-CC-3-2',
            speciesCode: "HER",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 50,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          }
        ],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "truck",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "Andorra",
            isoCodeAlpha2: "AD",
            isoCodeAlpha3: "AND",
            isoNumericCode: "020"
          },
          cmr: true
        },
        transportations: [{
          id: 0,
          vehicle: "truck"
        }],
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Andorra",
          isoCodeAlpha2: "AD",
          isoCodeAlpha3: "AND",
          isoNumericCode: "020"
        }
      };

      await new CatchCertSchema.CatchCertModel(sampleDocument('GBR-2022-CC-3', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {
       "GBR-2022-CC-0": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       },
       "GBR-2022-CC-1": {
         products: [{
           species: "Atlantic cod (COD)",
           totalWeight: 100
         }]
       }
      };

      const cachedData: IDraft = {
        ...redisCache,
        "GBR-2022-CC-3": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD",
            totalWeight: 201
          },{
            species: "Atlantic herring (HER)",
            speciesCode: "HER",
            totalWeight: 150
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-CC-3', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-PS-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE CC document not found in REDIS but found in Db and write to REDIS with different states and presentations', async () => {
      const exportData: CatchCertSchema.ExportData = {
        exporterDetails: {
          exporterFullName: 'Bob',
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        },
        products: [
          {
            species: "Atlantic cod (COD)",
            speciesId: 'GBR-2022-CC-3-0',
            speciesCode: "COD",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 101,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          },
          {
            species: "Atlantic cod (COD)",
            speciesId: 'GBR-2022-CC-3-2',
            speciesCode: "HER",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "GUT",
              name: "Gutted"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 50,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          }
        ],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "truck",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "Andorra",
            isoCodeAlpha2: "AD",
            isoCodeAlpha3: "AND",
            isoNumericCode: "020"
          },
          cmr: true
        },
        transportations: [{
          id: 0,
          vehicle: "truck"
        }],
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Andorra",
          isoCodeAlpha2: "AD",
          isoCodeAlpha3: "AND",
          isoNumericCode: "020"
        }
      };

      await new CatchCertSchema.CatchCertModel(sampleDocument('GBR-2022-CC-3', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-CC-3": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD",
            totalWeight: 351
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-CC-3', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-PS-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE CC document not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: CatchCertSchema.ExportData = {
        exporterDetails: {
          exporterFullName: 'Bob',
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        },
        products: [
          {
            species: "Atlantic cod (COD)",
            speciesId: 'GBR-2022-CC-3-0',
            speciesCode: "COD",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 101,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          },
          {
            species: "Atlantic cod (COD)",
            speciesId: 'GBR-2022-CC-3-2',
            speciesCode: "HER",
            commodityCode: "03025110",
            commodityCodeDescription: "Fresh or chilled cod \"Gadus morhua\"",
            scientificName: "Gadus morhua",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "GUT",
              name: "Gutted"
            },
            factor: 1,
            caughtBy: [
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 100,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              },
              {
                numberOfSubmissions: 1,
                vessel: "CROWDED HOUR",
                pln: "N66",
                homePort: "ANNALONG",
                flag: "GBR",
                cfr: "GBR000C18038",
                imoNumber: null,
                licenceNumber: "23422",
                licenceValidTo: "2030-12-31T00:00:00",
                licenceHolder: "MR J KEARNEY",
                id: "GBR-2022-CC-E80326103-9806927913",
                date: "2022-12-12",
                faoArea: "FAO18",
                weight: 50,
                _status: CatchCertSchema.LandingValidationStatus.Pending
              }
            ]
          }
        ],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "truck",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "Andorra",
            isoCodeAlpha2: "AD",
            isoCodeAlpha3: "AND",
            isoNumericCode: "020"
          },
          cmr: true
        },
        transportations: [{
          id: 0,
          vehicle: "truck"
        }],
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Andorra",
          isoCodeAlpha2: "AD",
          isoCodeAlpha3: "AND",
          isoNumericCode: "020"
        }
      };

      await new CatchCertSchema.CatchCertModel(sampleDocument('GBR-2022-CC-3', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-CC-3": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD",
            totalWeight: 351
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-CC-3', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Processing Statement with a single catch not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: ProcessingStatementSchema.ExportData = {
        catches: [{
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          catchCertificateNumber: "FAE99855-AE83-4E07-921D-C3652A1810B7",
          catchCertificateType: "non_uk",
          totalWeightLanded: "500",
          exportWeightBeforeProcessing: "200",
          exportWeightAfterProcessing: "100",
          id: "FAE99855-AE83-4E07-921D-C3652A1810B7-1680024210",
          scientificName: "Gadus morhua"
        }],
        plantPostcode: 'some postcode',
        exportedTo: {
          officialCountryName: 'some official name'
        }
      };

      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('GBR-2022-PS-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-PS-1": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD"
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-PS-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Processing Statement with multiple catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: ProcessingStatementSchema.ExportData = {
        catches: [{
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          catchCertificateNumber: "FAE99855-AE83-4E07-921D-C3652A1810B7",
          catchCertificateType: "non_uk",
          totalWeightLanded: "500",
          exportWeightBeforeProcessing: "200",
          exportWeightAfterProcessing: "100",
          id: "FAE99855-AE83-4E07-921D-C3652A1810B7-1680024210",
          scientificName: "Gadus morhua"
        },{
          species: "Rabbit fish	(CMO)",
          speciesCode: "CMO",
          catchCertificateNumber: "FAE99855-AE83-4E07-921D-C3652A1810B7",
          catchCertificateType: "non_uk",
          totalWeightLanded: "500",
          exportWeightBeforeProcessing: "200",
          exportWeightAfterProcessing: "100",
          id: "FAE99855-AE83-4E07-921D-C3652A1810B7-1680024210",
          scientificName: "Chimaera monstrosa"
        }],
        plantPostcode: 'some postcode',
        exportedTo: {
          officialCountryName: 'some official name'
        }
      };

      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('GBR-2022-PS-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-PS-1": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD"
          },{
            species: "Rabbit fish	(CMO)",
            speciesCode: "CMO"
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-PS-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Processing Statement with no catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: ProcessingStatementSchema.ExportData = {
        plantPostcode: 'some postcode',
        exportedTo: {
          officialCountryName: 'some official name'
        }
      };

      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('GBR-2022-PS-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-PS-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-PS-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Processing Statement with null catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: ProcessingStatementSchema.ExportData = {
        catches: undefined,
        plantPostcode: 'some postcode',
        exportedTo: {
          officialCountryName: 'some official name'
        }
      };

      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('GBR-2022-PS-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-PS-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-PS-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Processing Statement with an empty list of catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: ProcessingStatementSchema.ExportData = {
        catches: [],
        plantPostcode: 'some postcode',
        exportedTo: {
          officialCountryName: 'some official name'
        }
      };

      await new ProcessingStatementSchema.ProcessingStatementModel(sampleDocument('GBR-2022-PS-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-PS-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-PS-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Storage Document with a single catch not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: StorageDocSchema.ExportData = {
        exporterDetails: {
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        },
        catches: [{
          product: "Crocodile snake eel (AOY)",
          commodityCode: "03019210",
          certificateNumber: "123",
          productWeight: "10",
          weightOnCC: "109",
          placeOfUnloading: "Dover",
          dateOfUnloading: "17/04/2023",
          transportUnloadedFrom: "BW23",
          id: "123-1681722659",
          scientificName: "Brachysomophis crocodilinus",
          certificateType: "non_uk"
        }],
      };

      await new StorageDocSchema.StorageDocumentModel(sampleDocument('GBR-2022-SD-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-SD-1": {
          products: [{
            species: "Crocodile snake eel (AOY)"
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-SD-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Storage Document with multiple catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: StorageDocSchema.ExportData = {
        exporterDetails: {
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        },
        catches: [{
          product: "Crocodile snake eel (AOY)",
          commodityCode: "03019210",
          certificateNumber: "123",
          productWeight: "10",
          weightOnCC: "109",
          placeOfUnloading: "Dover",
          dateOfUnloading: "17/04/2023",
          transportUnloadedFrom: "BW23",
          id: "123-1681722659",
          scientificName: "Brachysomophis crocodilinus",
          certificateType: "non_uk"
        },{
          product: "Atlantic cod (COD)",
          commodityCode: "03044410",
          certificateNumber: "124",
          productWeight: "1",
          weightOnCC: "10",
          placeOfUnloading: "Hull",
          dateOfUnloading: "27/05/2023",
          transportUnloadedFrom: "BW24",
          id: "124-1681722659",
          scientificName: "Gadus morhua",
          certificateType: "non_uk"
        }],
      };

      await new StorageDocSchema.StorageDocumentModel(sampleDocument('GBR-2022-SD-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-SD-1": {
          products: [{
            species: "Crocodile snake eel (AOY)"
          },{
            species: "Atlantic cod (COD)"
          }]
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-SD-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Storage Document with no catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: StorageDocSchema.ExportData = {
        exporterDetails: {
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        }
      };

      await new StorageDocSchema.StorageDocumentModel(sampleDocument('GBR-2022-SD-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-SD-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-SD-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Storage Document with null catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: StorageDocSchema.ExportData = {
        catches: undefined,
        exporterDetails: {
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        }
      };

      await new StorageDocSchema.StorageDocumentModel(sampleDocument('GBR-2022-SD-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-SD-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-SD-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });

    it('will return true for a COMPLETE Storage Document with an empty list of catches not found in REDIS but found in Db and write to REDIS for a Storage Document', async () => {
      const exportData: StorageDocSchema.ExportData = {
        catches: [],
        exporterDetails: {
          exporterCompanyName: 'Private',
          addressOne: 'some address one',
          postcode: 'some postcode',
          _dynamicsAddress: {},
          _dynamicsUser: {}
        }
      };

      await new StorageDocSchema.StorageDocumentModel(sampleDocument('GBR-2022-SD-1', 'COMPLETE', undefined, undefined, undefined, undefined, exportData)).save();

      const redisCache: IDraft = {};

      const cachedData: IDraft = {
        "GBR-2022-SD-1": {
          products: []
        }
      };

      mockGetDraftCache.mockResolvedValue(redisCache);
      const result = await SUT.validateCompletedDocument('GBR-2022-SD-1', userPrincipal, contactId, storageDocumentNumber);
      expect(result).toBe(true);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-SD-ABCD01234', cachedData);
    });
  });

  describe('validate species', () => {

    it('will check REDIS to confirm the presence of species on completed catch certificate', async () => {
      const result = await SUT.validateSpecies('doc1', 'Atlantic cod (COD)', 'COD', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(mockGetDraftCache).toHaveBeenCalledTimes(1);
      expect(mockGetDraftCache).toHaveBeenCalledWith('bob', 'bobContactId', 'GBR-2023-PS-ABCD01234');
      expect(result).toBe(false);
    });

    it('will return false if the processing statement has no completed certificate in REDIS', async () => {
      const redisCache: IDraft = {};

      mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('doc1', 'Atlantic cod (COD)', 'COD', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return false if a completed catch certificate can not be found', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('doc1', 'Atlantic cod (COD)', 'COD', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return false if the species can not be found within the completed catch certificate', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Atlantic herring (HER)', 'HER', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return true if the species is found by species code within the completed catch certificate', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Edible Crab (brown crab) (CRE)",
            speciesCode: "CRE",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', 'CRE', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
    });

    it('will return false if the species is not found by species code within the completed catch certificate', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Atlantic cod (COD)",
            speciesCode: "COD",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', 'CRE', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return false if the species is not found by an undefined species code within the completed catch certificate', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Edible Crab (brown crab) (CRE)",
            speciesCode: "CRE",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', undefined, userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return false if the species does not have a species code', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Edible Crab (brown crab) (CRE)",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', undefined, userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('will return true if the species can be found within the completed catch certificate', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Atlantic cod (COD)', 'COD', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
    });

    it('will return true if the species can be found within the a completed catch certificate with multiple species', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          },{
            species: "Edible Crab (CRE)",
            totalWeight: 100
          },{
            species: "Atlantic herring (HER)",
            totalWeight: 100
          }
        ]
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', 'CRE', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(true);
    });

    it('will return false if the completed certificate has no products', async () => {
      const redisCache: IDraft = {
        "GBR-2022-CC-0": {
          products: []
        },
        "GBR-2022-CC-1": {
          products: [{
            species: "Atlantic cod (COD)",
            totalWeight: 100
          }]
        }
       };

       mockGetDraftCache.mockResolvedValue(redisCache);

      const result = await SUT.validateSpecies('GBR-2022-CC-0', 'Edible Crab (CRE)', 'CRE', userPrincipal, contactId, processingStatementDocumentNumber);
      expect(result).toBe(false);
    });

    it('should call getProductsCatchCertificate without products', async () => {
      const result = SUT.getProductsCatchCertificate(null);
      expect(result).toBeTruthy();
    })

    it('should call getProductsCatchCertificate with more products', async () => {
      const result = SUT.getProductsCatchCertificate([
        {
          "speciesId": "GBR-2022-CC-3-0",
          "species": "Atlantic cod (COD)",
          "speciesCode": "COD",
          "commodityCode": "03025110",
          "commodityCodeDescription": "Fresh or chilled cod \"Gadus morhua\"",
          "scientificName": "Gadus morhua",
          "state": {
            "code": "FRE",
            "name": "Fresh"
          },
          "presentation": {
            "code": "WHL",
            "name": "Whole"
          },
          "factor": 1,
          "caughtBy": [
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 100,
              "numberOfSubmissions": 1,
            },
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 101,
              "numberOfSubmissions": 1,
            }
          ]
        },
        {
          "speciesId": "GBR-2022-CC-3-2",
          "species": "Atlantic cod (COD)",
          "speciesCode": "HER",
          "commodityCode": "03025110",
          "commodityCodeDescription": "Fresh or chilled cod \"Gadus morhua\"",
          "scientificName": "Gadus morhua",
          "state": {
            "code": "FRE",
            "name": "Fresh"
          },
          "presentation": {
            "code": "GUT",
            "name": "Gutted"
          },
          "factor": 1,
          "caughtBy": [
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 100,
              "numberOfSubmissions": 1,
            },
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 50,
              "numberOfSubmissions": 1,
            }
          ]
        },
        {
          "speciesId": "GBR-2022-CC-3-2",
          "species": "Atlantic cod (COD)",
          "speciesCode": "HER",
          "commodityCode": "03025110",
          "commodityCodeDescription": "Fresh or chilled cod \"Gadus morhua\"",
          "scientificName": "Gadus morhua",
          "state": {
            "code": "FRE",
            "name": "Fresh"
          },
          "presentation": {
            "code": "GUT",
            "name": "Gutted"
          },
          "factor": 1,
          "caughtBy": [
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 100,
              "numberOfSubmissions": 1,
            },
            {
              "vessel": "CROWDED HOUR",
              "pln": "N66",
              "homePort": "ANNALONG",
              "flag": "GBR",
              "cfr": "GBR000C18038",
              "imoNumber": null,
              "licenceNumber": "23422",
              "licenceValidTo": "2030-12-31T00:00:00",
              "licenceHolder": "MR J KEARNEY",
              "id": "GBR-2022-CC-E80326103-9806927913",
              "date": "2022-12-12",
              "faoArea": "FAO18",
              "weight": 50,
              "numberOfSubmissions": 1,
            }
          ]
        }
      ]);
      expect(result).toBeTruthy();
    })

  });

});