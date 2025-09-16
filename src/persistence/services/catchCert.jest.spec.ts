import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as CatchCertService from './catchCert';
import * as ReferenceData from '../../../src/services/reference-data.service'
import { CatchCertModel, CatchCertificate, ExportData, DocumentStatuses } from '../schema/catchCert';
import { FailedOnlineCertificates } from '../schema/onlineValidationResult';
import { StorageDocumentModel } from '../schema/storageDoc';
import { Conservation } from '../schema/frontEndModels/conservation';
import { Product, toBackEndProduct } from '../schema/frontEndModels/species';
import { Product as Products } from '../schema/catchCert';
import * as FrontEndTransportSchema from '../schema/frontEndModels/transport';
import * as FrontEndExporterSchema from '../schema/frontEndModels/exporterDetails';
import * as FrontEndPayloadSchema from '../schema/frontEndModels/payload';
import * as FrontEndCatchCertificateSchema from '../schema/frontEndModels/catchCertificate';
import * as CommonSchema from '../schema/common';
import * as CatchCertSchema from '../schema/catchCert';
import * as Validator from '../../validators/draftCreationValidator';
import DocumentNumberService from '../../services/documentNumber.service';
import ManageCertsService from '../../services/manage-certs.service';
import SummaryErrorsService from '../../services/summaryErrors.service';
import { MockSessionStorage } from '../../../test/session_store/mock';
import { SessionStoreFactory } from '../../session_store/factory';
import { IStoreable } from '../../session_store/storeable';
import { CATCH_CERTIFICATE_KEY, DRAFT_HEADERS_KEY } from '../../session_store/constants';
import logger from '../../logger';

const CONTACT_ID = 'contactBob';

describe("catchCert - saveDraftCache", () => {
  let mockSessionStore: MockSessionStorage<IStoreable>;

  beforeEach(() => {
    mockSessionStore = new MockSessionStorage();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("save draft to session store", async () => {
    const mockWriteAllFor = jest.fn(() => Promise.resolve());
    mockSessionStore.writeAllFor = mockWriteAllFor;
    const mockGetSessionStore = jest.spyOn(
      SessionStoreFactory,
      'getSessionStore'
    );
    mockGetSessionStore.mockResolvedValue(mockSessionStore);

    const testData: any = { documentNumber: '12345' }

    await CatchCertService.saveDraftCache('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', testData);

    expect(mockGetSessionStore).toHaveBeenCalledTimes(1);
    expect(mockSessionStore.writeFor).toHaveBeenCalledTimes(1);
    expect(mockSessionStore.writeFor).toHaveBeenCalledWith('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', testData);
  });
});

describe("catchCert - invalidateDraftCache", () => {
  const contactId = 'contactBob';

  let mockSessionStore: MockSessionStorage<IStoreable>;

  beforeEach(() => {
    mockSessionStore = new MockSessionStorage();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("invalidate draft from store", async () => {
    const mockDeleteFor = jest.fn(() => Promise.resolve());
    mockSessionStore.readAllFor = mockDeleteFor;
    const mockGetSessionStore = jest.spyOn(
      SessionStoreFactory,
      "getSessionStore"
    );
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
    mockSessionStore.deleteFor = mockDeleteFor;

    await CatchCertService.invalidateDraftCache("BOB", "GBR-2020-CC-0E42C2DA5", contactId);

    expect(mockGetSessionStore).toHaveBeenCalledTimes(1);
    expect(mockDeleteFor).toHaveBeenCalledTimes(1);
  });
});

describe('catchCert - db related', () => {
  let mongoServer;
  let mockWriteAllFor;
  let mockSessionStore;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    mongoose.connect(mongoUri).catch(err => { console.log(err) });

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

  afterEach(async () => {
    jest.setTimeout(10000);
    await CatchCertModel.deleteMany({});
    await FailedOnlineCertificates.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    jest.resetAllMocks();
  });

  const defaultUser = 'Bob';
  const contactId = 'contactBob';
  const defaultUserEmail = 'bob@test.com';
  const defaultUserReference = 'User Reference';
  const defaultRequestedByAdmin = false;
  const documentType = "catchCertificate";

  const sampleDocument = (documentNumber, status, user?, draftData?, userReference?, createdAt?, exportData?, contId = contactId) => ({
    documentNumber: documentNumber,
    status: status,
    createdAt: createdAt || new Date('2020-01-16'),
    createdBy: user || defaultUser,
    draftData: draftData || {},
    exportData: exportData || undefined,
    userReference: userReference || defaultUserReference,
    contactId: contId
  });

  const sampleFailedDocument = (
    documentNumber: string,
    status?: DocumentStatuses,
    isSpeciesExists?: boolean,
    isOverusedAllCerts?: boolean,
    isOverusedThisCert?: boolean,
    isLandingExists?: boolean
  ) => ({
    documentNumber: documentNumber,
    status: status || DocumentStatuses.Blocked,
    isSpeciesExists: isSpeciesExists || false,
    isOverusedAllCerts: isOverusedAllCerts || false,
    isOverusedThisCert: isOverusedThisCert || false,
    isLandingExists: isLandingExists || true
  });

  describe('Document', () => {
    it('will return a document if a match exists', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();

      const result = await CatchCertService.getDocument('doc1', defaultUser, contactId);

      expect(result.documentNumber).toBe('doc1');
    });

    it('will return null if no document can be found cc', async () => {
      const result = await CatchCertService.getDocument('doc1', defaultUser, contactId);

      expect(result).toBeNull();
    });

    it('will return null if owner validation fails', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();

      const result = await CatchCertService.getDocument('doc1', undefined, undefined);

      expect(result).toBeNull();
    });
  });

  describe('createDraft', () => {

    let mockGetDocumentNumber;
    let mockInvalidateDraftCache;
    const documentNumber = 'test-document-number';

    beforeEach(() => {
      mockGetDocumentNumber = jest.spyOn(DocumentNumberService, 'getUniqueDocumentNumber');
      mockGetDocumentNumber.mockResolvedValue(documentNumber);

      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
      mockInvalidateDraftCache.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockGetDocumentNumber.mockRestore();
      mockInvalidateDraftCache.mockRestore();
    });


    it('will create a new draft in the system with a randomly generated document number', async () => {
      await CatchCertService.createDraft(defaultUser, defaultUserEmail, defaultRequestedByAdmin, contactId);

      const result = await CatchCertModel.find({ createdBy: defaultUser, createdByEmail: defaultUserEmail, status: 'DRAFT', documentNumber: documentNumber });

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(result.length).toBe(1);
    });

    it('will return the document number of the created draft', async () => {
      const result = await CatchCertService.createDraft(defaultUser, defaultUserEmail, defaultRequestedByAdmin, contactId);

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(result).toBe(documentNumber);
    });

  });

  describe('getAllCatchCertsForUserByYearAndMonth', () => {

    it('should not return draft or void certificates', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'COMPLETE', defaultUser, {}, 'My Completed Reference')).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA6', 'DRAFT')).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA7', 'VOID')).save();

      const result = await CatchCertService.getAllCatchCertsForUserByYearAndMonth('01-2020', defaultUser, contactId);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('GBR-2020-CC-0E42C2DA5');
      expect(result[0].userReference).toBe('My Completed Reference');
    });

    it('should not return pending certificates', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'COMPLETE', defaultUser, {}, 'My Completed Reference')).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA6', 'PENDING')).save();

      const result = await CatchCertService.getAllCatchCertsForUserByYearAndMonth('01-2020', defaultUser, contactId);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('GBR-2020-CC-0E42C2DA5');
      expect(result[0].userReference).toBe('My Completed Reference');
    });

    it('should not return locked certificates', async () => {
      await new CatchCertModel(sampleDocument('GBR-2021-CC-0E42C2DA5', 'COMPLETE', defaultUser, {}, 'My Completed Reference')).save();
      await new CatchCertModel(sampleDocument('GBR-2021-CC-0E42C2DA6', 'LOCKED')).save();
      await new CatchCertModel(sampleDocument('GBR-2021-CC-0E42C2DA7', 'COMPLETE', defaultUser, {}, 'My Completed Reference 2')).save();


      const result = await CatchCertService.getAllCatchCertsForUserByYearAndMonth('01-2020', defaultUser, contactId);

      expect(result).toHaveLength(2);
      expect(result[0].documentNumber).toBe('GBR-2021-CC-0E42C2DA5');
      expect(result[0].userReference).toBe('My Completed Reference');
      expect(result[1].documentNumber).toBe('GBR-2021-CC-0E42C2DA7');
      expect(result[1].userReference).toBe('My Completed Reference 2');

    });

    it('should return certificates in createdAt descending order', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE', defaultUser, {}, 'First', new Date('2020-01-01'))).save();
      await new CatchCertModel(sampleDocument('doc3', 'COMPLETE', defaultUser, {}, 'Third', new Date('2020-01-03'))).save();
      await new CatchCertModel(sampleDocument('doc2', 'COMPLETE', defaultUser, {}, 'Second', new Date('2020-01-02'))).save();

      const result = await CatchCertService.getAllCatchCertsForUserByYearAndMonth('01-2020', defaultUser, contactId);

      expect(result).toHaveLength(3);
      expect(result[0].documentNumber).toBe('doc3');
      expect(result[1].documentNumber).toBe('doc2');
      expect(result[2].documentNumber).toBe('doc1');
    });

    it('should return certificates for the current year and month', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE', defaultUser, {}, 'First', moment.utc().subtract(1, 'month').toISOString())).save();

      const result = await CatchCertService.getAllCatchCertsForUserByYearAndMonth('', defaultUser, contactId);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('doc1');
    });

  });

  describe('delete species', () => {
    const document = {
      documentNumber: 'GBR-2020-CC-0E42C2DA5',
      status: 'DRAFT',
      createdAt: new Date('2020-01-16'),
      createdBy: defaultUser,
      exportData: {
        products: [
          {
            speciesId: "test-species-id",
            commodityCode: "test-commoditycode-id"
          }
        ],
        transportation: {
          exportedFrom: "test",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        conservation: {
          conservationReference: "test"
        },
        landingsEntryOption: CatchCertSchema.LandingsEntryOptions.ManualEntry
      }
    };

    it("will delete a species based on a species id", async () => {
      await new CatchCertModel(document).save();

      await CatchCertService.deleteSpecies(defaultUser, "test-species-id", 'GBR-2020-CC-0E42C2DA5', contactId);

      const draft = await CatchCertModel.findOne({
        createdBy: defaultUser,
        documentNumber: 'GBR-2020-CC-0E42C2DA5',
        'status': 'DRAFT'
      });

      expect(draft?.exportData.products.length).toEqual(0)
    });

    it("will also work when passing a document number", async () => {
      await new CatchCertModel(document).save();

      await CatchCertService.deleteSpecies(defaultUser, "test-species-id", 'GBR-2020-CC-0E42C2DA5', contactId);

      const draft = await CatchCertModel.findOne({
        createdBy: defaultUser,
        'status': 'DRAFT',
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      });

      expect(draft?.exportData.products.length).toEqual(0)
    });

    it("will delete the relevant species", async () => {
      document.exportData.products.push({
        speciesId: "test-species-id-2",
        commodityCode: "test-commoditycode-id-2"
      });

      await new CatchCertModel(document).save();

      await CatchCertService.deleteSpecies(defaultUser, "test-species-id", 'GBR-2020-CC-0E42C2DA5', contactId);

      const draft = await CatchCertModel.findOne({
        documentNumber: 'GBR-2020-CC-0E42C2DA5',
        createdBy: defaultUser,
        'status': 'DRAFT'
      });

      expect(draft?.exportData.products.length).toEqual(1)
    });
  });

  describe('delete draft certificate', () => {
    let mockInvalidateDraftCache;

    beforeEach(() => {
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
      mockInvalidateDraftCache.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockInvalidateDraftCache.mockRestore();
    });

    it('should delete drafts', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', 'Bob')).save();

      await CatchCertService.deleteDraftCertificate('Bob', 'GBR-2020-CC-0E42C2DA5', contactId);

      const draft = await CatchCertModel.findOne({
        createdBy: 'Bob',
        'status': 'DRAFT'
      });

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(draft).toBeNull();
    });

    it('should delete drafts when a doc number is provided', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', 'Bob')).save();

      await CatchCertService.deleteDraftCertificate('Bob', 'GBR-2020-CC-0E42C2DA5', contactId);

      const draft = await CatchCertModel.findOne({
        createdBy: 'Bob',
        'status': 'DRAFT',
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      });

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(draft).toBeNull();
    });

    it('should not delete anything other than catchCertificate drafts', async () => {
      const draftSD = {
        documentNumber: 'GBR-2020-CC-0E42C2DA5',
        status: 'DRAFT',
        createdAt: new Date('2020-01-16'),
        createdBy: 'Bob',
        __t: 'storageDocument',
        documentUri: 'test',
        exportData: { catches: [{ certificateNumber: "aaa" }], storageFacilities: [] },
      };

      await new StorageDocumentModel(draftSD).save();

      await CatchCertService.deleteDraftCertificate('Bob', undefined, contactId);

      const certificate = await StorageDocumentModel.findOne({
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      });

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(certificate).not.toBeNull();
    });

    it('should not delete anything other than drafts', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'COMPLETE', 'Bob')).save();

      await CatchCertService.deleteDraftCertificate('Bob', undefined, contactId);

      const certificate = await CatchCertModel.findOne({
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      });

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      expect(certificate).not.toBeNull();
    });
  });

  describe('getDraftCatchCertHeadersForUser', () => {

    let mockGetAllSystemErrors;
    let mockGetDraftCache;
    let mockSaveDraftCache;
    let mockLoggerInfo;

    beforeEach(() => {
      mockGetAllSystemErrors = jest.spyOn(SummaryErrorsService, 'getAllSystemErrors');
      mockGetAllSystemErrors.mockResolvedValue([]);

      mockGetDraftCache = jest.spyOn(CatchCertService, 'getDraftCache');
      mockGetDraftCache.mockResolvedValue(null);

      mockSaveDraftCache = jest.spyOn(CatchCertService, 'saveDraftCache');
      mockSaveDraftCache.mockResolvedValue(null);

      mockLoggerInfo = jest.spyOn(logger, 'info');
    });

    afterEach(() => {
      mockGetAllSystemErrors.mockRestore();
      mockGetDraftCache.mockRestore();
      mockSaveDraftCache.mockRestore();
      mockLoggerInfo.mockRestore();
    });

    it('should return a draft if one is present', async () => {
      const expected: FrontEndCatchCertificateSchema.CatchCertificateDraft[] = [{
        "documentNumber": "GBR-2020-CC-0E42C2DA5",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference",
        "isFailed": false
      }];

      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(mockSaveDraftCache).toHaveBeenCalled();
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledWith(defaultUser, contactId, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, expected);
      expect(result).toStrictEqual(expected);
    });

    it('should return all DRAFTS for a user', async () => {
      await new CatchCertModel(sampleDocument('test1', 'DRAFT', 'Juan')).save();
      await new CatchCertModel(sampleDocument('test2', 'DRAFT', 'Juan')).save();
      await new CatchCertModel(sampleDocument('test3', 'DRAFT', 'Juan')).save();
      await new CatchCertModel(sampleDocument('test4', 'DRAFT', 'Juan')).save();

      const expected = [{
        "documentNumber": "test1",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference",
        "isFailed": false
      }, {
        "documentNumber": "test2",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference",
        "isFailed": false
      }, {
        "documentNumber": "test3",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference",
        "isFailed": false
      }, {
        "documentNumber": "test4",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference",
        "isFailed": false
      }];

      const result = await CatchCertService.getDraftCatchCertHeadersForUser('Juan', contactId);

      expect(result).toStrictEqual(expected);
    });

    it('should return no drafts if no drafts are present', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'COMPLETE')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual([]);
    });

    it('should return drafts for the specified user cc', async () => {
      const _ = undefined;
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', 'Juan', _, _, _, _, null)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA6', 'DRAFT', 'Chris', _, _, _, _, null)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA7', 'DRAFT', defaultUser, _, _, _, _, null)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA8', 'COMPLETE', defaultUser)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA9', 'DRAFT', null, _, _, _, _, contactId)).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual([
        {
          documentNumber: 'GBR-2020-CC-0E42C2DA7',
          status: 'DRAFT',
          startedAt: '16 Jan 2020',
          userReference: 'User Reference',
          isFailed: false,
        },
        {
          documentNumber: 'GBR-2020-CC-0E42C2DA9',
          status: 'DRAFT',
          startedAt: '16 Jan 2020',
          userReference: 'User Reference',
          isFailed: false,
        },
      ]);
    });

    it('should return all DRAFTS for a user with the correct user reference', async () => {
      await new CatchCertModel(sampleDocument('test1', 'DRAFT', 'Foo', {}, 'User Reference 1')).save();
      await new CatchCertModel(sampleDocument('test2', 'DRAFT', 'Foo', {}, 'User Reference 2')).save();
      await new CatchCertModel(sampleDocument('test3', 'DRAFT', 'Foo', {}, 'User Reference 3')).save();
      await new CatchCertModel(sampleDocument('test4', 'DRAFT', 'Foo', {}, 'User Reference 4')).save();

      const expected = [{
        "documentNumber": "test1",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 1",
        "isFailed": false
      },
      {
        "documentNumber": "test2",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 2",
        "isFailed": false
      },
      {
        "documentNumber": "test3",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 3",
        "isFailed": false
      },
      {
        "documentNumber": "test4",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 4",
        "isFailed": false
      }];

      const result = await CatchCertService.getDraftCatchCertHeadersForUser('Foo', contactId);

      expect(result).toStrictEqual(expected);
    });

    it('should return drafts in createdAt descending order', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'DRAFT', 'Bob', {}, 'ref1', new Date('2020-01-01'))).save();
      await new CatchCertModel(sampleDocument('doc3', 'DRAFT', 'Bob', {}, 'ref3', new Date('2020-01-03'))).save();
      await new CatchCertModel(sampleDocument('doc2', 'DRAFT', 'Bob', {}, 'ref2', new Date('2020-01-02'))).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser('Bob', contactId);

      expect(result).toHaveLength(3);
      expect(result[0].documentNumber).toBe('doc3');
      expect(result[1].documentNumber).toBe('doc2');
      expect(result[2].documentNumber).toBe('doc1');
    });

    it('should return a pending draft if one is present', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'PENDING')).save();
      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "PENDING",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": false
        }]);
    });

    it('should return a locked draft if the certificate has been locked by admin', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'LOCKED')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "LOCKED",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": false
        }]);
    });

    it('should return a failed draft if the cert has a failed online certificate', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();
      await new FailedOnlineCertificates(sampleFailedDocument('GBR-2020-CC-0E42C2DA5')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "DRAFT",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": true
        }]);
    });

    it('should return a failed draft if the cert has a failed online certificate and system errors', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();
      await new FailedOnlineCertificates(sampleFailedDocument('GBR-2020-CC-0E42C2DA5')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "DRAFT",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": true
        }]);
    });

    it('should get all system errors for this user', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();
      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);
      expect(mockGetAllSystemErrors).toHaveBeenCalledWith(defaultUser, contactId);
      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "DRAFT",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": false
        }]);
    });

    it('should return a failed draft if the cert contains system errors', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();
      mockGetAllSystemErrors.mockResolvedValue([
        {
          documentNumber: 'GBR-2020-CC-0E42C2DA5',
          error: 'SYSTEM_ERROR'
        },
        {
          documentNumber: 'GBR-2021-CC-3AA0F6753',
          error: 'SYSTEM_ERROR'
        }
      ]);

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          'documentNumber': 'GBR-2020-CC-0E42C2DA5',
          'status': 'DRAFT',
          'startedAt': '16 Jan 2020',
          'userReference': 'User Reference',
          'isFailed': true
        }]);
    });

    it('should not return a failed pending draft if the cert has a failed online certificate', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'PENDING')).save();
      await new FailedOnlineCertificates(sampleFailedDocument('GBR-2020-CC-0E42C2DA5')).save();

      const result = await CatchCertService.getDraftCatchCertHeadersForUser(defaultUser, contactId);

      expect(result).toStrictEqual(
        [{
          "documentNumber": "GBR-2020-CC-0E42C2DA5",
          "status": "PENDING",
          "startedAt": "16 Jan 2020",
          "userReference": "User Reference",
          "isFailed": false
        }]);
    });

    it('should return all DRAFTS for a user from cache', async () => {
      mockGetDraftCache.mockResolvedValue([{
        "documentNumber": "test1",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 1",
        "isFailed": false
      },
      {
        "documentNumber": "test2",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 2",
        "isFailed": false
      },
      {
        "documentNumber": "test3",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 3",
        "isFailed": false
      },
      {
        "documentNumber": "test4",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 4",
        "isFailed": false
      }]);

      const expected = [{
        "documentNumber": "test1",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 1",
        "isFailed": false
      },
      {
        "documentNumber": "test2",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 2",
        "isFailed": false
      },
      {
        "documentNumber": "test3",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 3",
        "isFailed": false
      },
      {
        "documentNumber": "test4",
        "status": "DRAFT",
        "startedAt": "16 Jan 2020",
        "userReference": "User Reference 4",
        "isFailed": false
      }];

      const result = await CatchCertService.getDraftCatchCertHeadersForUser('Foo', contactId);

      expect(mockGetDraftCache).toHaveBeenCalledWith('Foo', contactId, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`);
      expect(mockLoggerInfo).toHaveBeenCalledWith(`[GET-DRAFT-CATCH-CERTIFICATE-HEADERS-FROM-CACHE][USER-PRINCIPAL][Foo][CONTACT-ID][${contactId}]`);
      expect(mockSaveDraftCache).not.toHaveBeenCalled();
      expect(result).toStrictEqual(expected);
    });
  });

  describe('getDraftCertificateNumber', () => {
    it('should return a catch cert number for a draft', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', defaultUser)).save();

      const result = await CatchCertService.getDraftCertificateNumber(defaultUser);

      expect(result).toEqual('GBR-2020-CC-0E42C2DA5');
    });

    it('should return undefined if certificate does not exist', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', "Pete")).save();

      const result = await CatchCertService.getDraftCertificateNumber(defaultUser);

      expect(result).toBeUndefined();
    });

    it('should return the first draft if multiple drafts exist', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA8', 'COMPLETE', defaultUser)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA7', 'DRAFT', defaultUser)).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA6', 'DRAFT', defaultUser)).save();

      const result = await CatchCertService.getDraftCertificateNumber(defaultUser);

      expect(result).toEqual('GBR-2020-CC-0E42C2DA7');
    });
  });

  describe('upsertDraftData', () => {
    let mockGet;
    let mockDebug;

    beforeEach(() => {
      mockGet = jest.spyOn(CatchCertService, "getDraft");
      mockDebug = jest.spyOn(logger, "debug");
    });

    afterEach(() => {
      mockGet.mockRestore();
      mockDebug.mockRestore();
    });

    it('should update an existing certificate if one exists', async () => {
      const filter = { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'RJH-2020-CC-0E42C2DA5' };
      let records = await CatchCertModel.countDocuments(filter);

      expect(records).toBe(0);

      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();


      await CatchCertService.upsertDraftData(
        defaultUser,
        'RJH-2020-CC-0E42C2DA5',
        {
          '$set': {
            'exportData.transportation.exportedFrom': 'New York',
            'exportData.transportation.exportedTo': {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            }
          }
        },
        contactId
      );

      records = await CatchCertModel.countDocuments(filter);
      const draft = await CatchCertModel.findOne(filter, ['exportData'], { lean: true });

      expect(records).toBe(1);
      expect(draft?.exportData.transportation).toStrictEqual({
        exportedFrom: 'New York',
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });

    it('should omit any undefined values', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertDraftData(
        defaultUser, 'RJH-2020-CC-0E42C2DA5',
        {
          '$set': {
            'exportData.products': [{
              species: 'Atlantic Cod',
              speciesId: 'test-id',
              speciesCode: undefined,
              commodityCode: 'commodityCode',
              factor: 2.3,
              state: {
                code: 'FRE',
                name: undefined
              },
              presentation: {
                code: 'FIL',
                name: undefined
              },
              caughtBy: []
            }]
          }
        },
        contactId
      );

      const draft = await CatchCertModel.findOne(
        { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'RJH-2020-CC-0E42C2DA5' },
        ['exportData'],
        { lean: true }
      );

      expect(draft?.exportData.products).toStrictEqual([{
        species: 'Atlantic Cod',
        speciesId: 'test-id',
        commodityCode: 'commodityCode',
        factor: 2.3,
        state: {
          code: 'FRE'
        },
        presentation: {
          code: 'FIL'
        },
        caughtBy: []
      }]);
    });

    it('should work with doc number when certificate already exists', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();


      const filter = { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'GBR-2020-CC-0E42C2DA5' };

      await CatchCertService.upsertDraftData(
        defaultUser, 'GBR-2020-CC-0E42C2DA5',
        {
          '$set': {
            'exportData.transportation.exportedFrom': 'New York',
            'exportData.transportation.exportedTo': {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            }
          }
        },
        contactId
      );


      const draft = await CatchCertModel.findOne(filter, ['exportData'], { lean: true });

      expect(draft?.exportData.transportation).toStrictEqual({
        exportedFrom: 'New York',
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });

    it('should work when it is new certificate', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();


      const filter = { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'GBR-2020-CC-0E42C2DA5' };

      await CatchCertService.upsertDraftData(
        defaultUser, 'GBR-2020-CC-0E42C2DA5',
        {
          '$set': {
            'exportData.transportation.exportedFrom': 'New York',
            'exportData.transportation.exportedTo': {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            }
          }
        },
        contactId
      );


      const draft = await CatchCertModel.findOne(filter, ['exportData'], { lean: true });

      expect(draft?.exportData.transportation).toStrictEqual({
        exportedFrom: 'New York',
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });

    it('should be able to upsert a pending certificate', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'PENDING', 'user1')).save();

      await CatchCertService.upsertDraftData(
        'user1', 'GBR-2020-CC-0E42C2DA5',
        {
          '$set': {
            'createdBy': 'user2'
          }
        },
        contactId
      );

      const filter = { createdBy: 'user2', status: 'PENDING', documentNumber: 'GBR-2020-CC-0E42C2DA5' };
      const draft = await CatchCertModel.findOne(filter, ['createdBy'], { lean: true });

      expect(draft?.createdBy).toStrictEqual('user2');
    });

    it('should not be able to upsert a complete certificate', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'COMPLETE', 'user1')).save();

      await CatchCertService.upsertDraftData(
        'user1', 'GBR-2020-CC-0E42C2DA5',
        {
          '$set': {
            'createdBy': 'user2'
          }
        },
        contactId
      );

      const filter = { createdBy: 'user1', status: 'COMPLETE', documentNumber: 'GBR-2020-CC-0E42C2DA5' };
      const draft = await CatchCertModel.findOne(filter, ['createdBy'], { lean: true });

      expect(draft?.createdBy).toStrictEqual('user1');
    });

    it('should not create a new certificate', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertDraftData(
        defaultUser, 'GBR-2020-CC-0E42C2DA5',
        {
          '$set': {
            'exportData.transportation.exportedFrom': 'New York'
          }
        },
        contactId
      );

      const drafts = await CatchCertModel.find({}, ['exportData'], { lean: true });
      expect(drafts.length).toEqual(1);
    });

    test("upsert data if draft exists", async () => {
      const mockInvalidateDraftCache = jest.spyOn(CatchCertService, "invalidateDraftCache");
      const mockSaveDraftCache = jest.spyOn(CatchCertService, 'saveDraftCache');

      mockInvalidateDraftCache.mockResolvedValue(Promise.resolve());
      mockSaveDraftCache.mockResolvedValue(Promise.resolve());

      const returnedDoc = { document: "GBR-2020-CC-0E42C2DA5" };
      mockGet.mockResolvedValue({ documentNumber: "GBR-2020-CC-0E42C2DA5" });
      await CatchCertService.upsertDraftData(
        "BOB",
        "GBR-2020-CC-0E42C2DA5",
        returnedDoc,
        contactId
      );

      expect(mockDebug).toHaveBeenCalledWith(
        `[UPSERT-DRAFT-DATA][CONTACT-ID][contactBob][DOCUMENT-NUMBER][GBR-2020-CC-0E42C2DA5][UPDATE][${JSON.stringify(
          returnedDoc
        )}]`
      );
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(1);
    });

    test("upsert data if draft does not exist", async () => {
      const mockInvalidateDraftCache = jest.spyOn(CatchCertService, "invalidateDraftCache");
      const mockSaveDraftCache = jest.spyOn(CatchCertService, 'saveDraftCache');
      mockInvalidateDraftCache.mockResolvedValue(Promise.resolve());
      mockSaveDraftCache.mockResolvedValue(Promise.resolve());
      const returnedDoc = { document: "GBR-2020-CC-0E42C2DA5" };

      mockGet.mockResolvedValue(null);
      await CatchCertService.upsertDraftData(
        "BOB",
        "GBR-2020-CC-0E42C2DA5",
        returnedDoc,
        contactId
      );

      expect(mockDebug).toHaveBeenCalledWith(
        `[UPSERT-DRAFT-DATA][CONTACT-ID][contactBob][DOCUMENT-NUMBER][GBR-2020-CC-0E42C2DA5][UPDATE][${JSON.stringify(
          returnedDoc
        )}]`
      );
      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(0);
      expect(mockSaveDraftCache).toHaveBeenCalledTimes(0);
    });
  });

  describe('getDraftDataForCatchCertificate', () => {

    const draftData = {
      test: { message: 'test' }
    };

    describe('should return an empty object when', () => {

      it('no draft catch certificates exist', async () => {
        const result = await CatchCertService.getDraftData(defaultUser, 'test', contactId);

        expect(result).toStrictEqual({});
      });

      it('the path doesnt exist in the draft data', async () => {
        await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', defaultUser, draftData)).save();

        const result = await CatchCertService.getDraftData(defaultUser, 'test2', contactId);

        expect(result).toStrictEqual({});
      });

    });

    it('should return a result if the draft data exists', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT', defaultUser, draftData)).save();

      const result = await CatchCertService.getDraftData(defaultUser, 'test', contactId);

      expect(result).toStrictEqual(draftData.test);
    });

    it('should return a default value if one is specified and no results are found', async () => {
      const result = await CatchCertService.getDraftData(defaultUser, 'test', contactId, 'nothing');

      expect(result).toStrictEqual('nothing');
    })

  });

  describe('upsertConservation', () => {

    const payload: Conservation = {
      legislation: ['Test'],
      caughtInUKWaters: 'Y',
      conservationReference: 'Test',
      user_id: 'Bob',
      currentUri: 'Test',
      nextUri: 'Test'
    };

    it("will convert to a back end conservation model", async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertConservation(defaultUser, payload, 'RJH-2020-CC-0E42C2DA5', contactId);
      const result = await CatchCertModel.findOne({
        createdBy: 'Bob',
        documentNumber: 'RJH-2020-CC-0E42C2DA5',
        status: 'DRAFT'
      }, ['exportData'], { lean: true });
      expect(result?.exportData.conservation).toStrictEqual({ 'conservationReference': 'Test' });
    });

    it("will convert to a back end conservation model with document number", async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42CDA5', 'DRAFT')).save();
      await CatchCertService.upsertConservation(defaultUser, payload, 'GBR-2020-CC-0E42CDA5', contactId);
      const result = await CatchCertModel.findOne({
        status: 'DRAFT',
        documentNumber: 'GBR-2020-CC-0E42CDA5'
      }, ['exportData'], { lean: true });

      expect(result?.exportData.conservation).toStrictEqual({ 'conservationReference': 'Test' });
    });
  });

  describe('upsertLandingsEntryOption', () => {

    it("will upsert a landingsEntryOption to the correct document", async () => {
      await new CatchCertModel(sampleDocument('GBR-3444-5555-34444', 'DRAFT')).save();
      await CatchCertService.upsertLandingsEntryOption(defaultUser, 'GBR-3444-5555-34444', CatchCertSchema.LandingsEntryOptions.ManualEntry, contactId);

      const result = await CatchCertModel.findOne({
        createdBy: 'Bob',
        status: 'DRAFT',
        documentNumber: 'GBR-3444-5555-34444'
      }, ['exportData.landingsEntryOption'], { lean: true });

      expect(result?.exportData.landingsEntryOption).toStrictEqual('manualEntry');
    });
  });

  describe('upsertTransportDetails', () => {

    const payload: FrontEndTransportSchema.Transport = {
      vehicle: FrontEndTransportSchema.truck,
      cmr: "false",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    let mock;

    beforeAll(() => {
      mock = jest.spyOn(CatchCertService, 'getExportLocation');
      mock.mockResolvedValue({
        exportedFrom: "somewhere",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });

    afterAll(() => {
      mock.mockRestore()
    });

    it("will convert to a back end transport model", async () => {

      await new CatchCertModel(sampleDocument('GBR-3444-5555-34444', 'DRAFT')).save();


      await CatchCertService.upsertTransportDetails(defaultUser, payload, 'GBR-3444-5555-34444', contactId);

      const result = await CatchCertModel.findOne({
        createdBy: 'Bob',
        status: 'DRAFT',
        documentNumber: 'GBR-3444-5555-34444'
      }, ['exportData.transportation'], { lean: true });

      const expected = {
        departurePlace: 'here',
        nationalityOfVehicle: 'UK',
        cmr: false,
        registrationNumber: 'REG Number',
        vehicle: 'truck',
        exportedTo: {
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP",
          officialCountryName: "SPAIN",
        }
      };

      expect(result?.exportData.transportation).toStrictEqual(expected);
    });
  });

  describe('removeTranportationDetails', () => {

    it('will remove the transportation details', async () => {
      const payload: CommonSchema.Truck = {
        vehicle: FrontEndTransportSchema.truck,
      };
      const documentNumber = 'GBR-3444-5555-34444';
      const status = 'DRAFT';

      await new CatchCertModel({
        documentNumber: documentNumber,
        status: status,
        createdAt: new Date('2020-01-16'),
        createdBy: defaultUser,
        draftData: {},
        userReference: defaultUserReference,
        exportData: {
          conservation: { conservationReference: 'UK' },
          transportation: payload,
          landingsEntryOption: 'manualEntry'
        }
      }).save();

      await CatchCertService.deleteTransportDetails(defaultUser, documentNumber, contactId);

      const result = await CatchCertModel.findOne({
        createdBy: defaultUser,
        status: status,
        documentNumber: documentNumber
      }, ['exportData.transportation'], { lean: true });

      expect(result?.exportData.transportation).toBeUndefined()
    });
  });

  describe('getExportPayload', () => {
    let mockGetDraft;
    let mockMap;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockMap = jest.spyOn(FrontEndPayloadSchema, 'toFrontEndProductsLanded');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
      mockMap.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);

      expect(await CatchCertService.getExportPayload('Bob', undefined, contactId)).toEqual(null);
    });

    it('should return null if the draft has no products', async () => {
      const draft = createDraft({
        products: null,
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);

      expect(await CatchCertService.getExportPayload('Bob', undefined, contactId)).toEqual(null);
    });

    it('should map and return products if they exist', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getExportPayload('Bob', undefined, contactId);

      expect(mockMap).toHaveBeenCalledWith(draft?.exportData.products);
      expect(res).toEqual('mapped');
    });

    it('should be able to work with a document number', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      }, 'GBR-3444-42356-64834');

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getExportPayload('Bob', 'GBR-3444-42356-64834', contactId);

      expect(res).toEqual('mapped');
    });
  });

  describe('getDirectExportPayload', () => {
    let mockGetDraft;
    let mockMap;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockMap = jest.spyOn(FrontEndPayloadSchema, 'toFrontEndDirectLanding');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
      mockMap.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);

      expect(await CatchCertService.getDirectExportPayload('Bob', undefined, contactId)).toEqual(null);
    });

    it('should return null if the draft has no products', async () => {
      const draft = createDraft({
        products: null,
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);

      expect(await CatchCertService.getDirectExportPayload('Bob', undefined, contactId)).toEqual(null);
    });

    it('should map and return products if they exist', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getDirectExportPayload('Bob', undefined, contactId);

      expect(mockMap).toHaveBeenCalledWith(draft?.exportData.products);
      expect(res).toEqual('mapped');
    });

    it('should be able to work with a document number', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      }, 'GBR-3444-42356-64834');

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getDirectExportPayload('Bob', 'GBR-3444-42356-64834', contactId);

      expect(res).toEqual('mapped');
    });
  });

  describe('getExportLocation', () => {
    let mockGetDraft;
    let mockMap;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockMap = jest.spyOn(FrontEndCatchCertificateSchema, 'toFrontEndExportLocation');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
      mockMap.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);

      expect(await CatchCertService.getExportLocation('Bob', undefined, contactId)).toBeNull();
    });

    it('should return null if the draft has no transportation', async () => {
      const draft = createDraft(undefined);

      mockGetDraft.mockResolvedValue(draft);

      expect(await CatchCertService.getExportLocation('Bob', undefined, contactId)).toBeNull();
    });

    it('should map and return export location if transportation exists', async () => {
      const draft = createDraft({
        products: null,
        transportation: {
          vehicle: 'spaceship',
        },
        transportations: [{
          id: 0,
          vehicle: 'spaceship',
        }],
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getExportLocation('Bob', 'GBR-3442-2344-23444', contactId);

      expect(res).toEqual('mapped');
      expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-3442-2344-23444', contactId);
      expect(mockMap).toHaveBeenCalledWith(draft?.exportData);
    });

    it('should map and return export location when provived with a document number', async () => {
      const draft = createDraft({
        exporterDetails: null,
        products: null,
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: 'Truck',
          exportedFrom: 'Jersey',
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        transportations: [{
          id: 0,
          vehicle: 'Truck'
        }],
        exportedFrom: 'Jersey',
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getExportLocation(defaultUser, 'GBR-3444-42356-64834', contactId);
      expect(res).toStrictEqual('mapped');
      expect(mockGetDraft).toHaveBeenCalledWith(defaultUser, 'GBR-3444-42356-64834', contactId);
      expect(mockMap).toHaveBeenCalledWith(draft?.exportData);
    });
  });

  describe('getTransportDetails', () => {
    let mockGetDraft;
    let mockMap;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockMap = jest.spyOn(FrontEndTransportSchema, 'toFrontEndTransport');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
      mockMap.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);

      expect(await CatchCertService.getTransportDetails('Bob', undefined, contactId)).toBeNull();
    });

    it('should return null if the draft has no transportation', async () => {
      const draft = createDraft({
        products: null,
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);

      expect(await CatchCertService.getTransportDetails('Bob', undefined, contactId)).toBeNull();
    });

    it('should map and return transport if transportation exists', async () => {
      const draft = createDraft({
        products: null,
        transportation: {
          vehicle: 'spaceship',
        },
        transportations: [{
          id: 0,
          vehicle: 'spaceship',
        }],
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      const res = await CatchCertService.getTransportDetails('Bob', 'GBR-344-23424-23444', contactId);

      expect(res).toEqual('mapped');
      expect(mockMap).toHaveBeenCalledWith(draft?.exportData.transportation);
      expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-344-23424-23444', contactId);
    });
  });

  describe('upsertExportPayload', () => {

    const payload: FrontEndPayloadSchema.ProductsLanded = {
      items: [{
        product: {
          id: 'productId',
          commodityCode: 'commodityCode',
          commodityCodeAdmin: 'admin commodityCode',
          commodityCodeDescription: 'commodityCodeDescription',
          factor: 2.3,
          presentation: {
            code: 'FIL',
            label: 'Filletted',
            admin: 'Admin presentation'
          },
          scientificName: 'test-scientific-name',
          state: {
            code: 'FRE',
            label: 'Fresh',
            admin: 'Admin state'
          },
          species: {
            code: 'COD',
            label: 'Atlantic Cod',
            admin: 'Admin species'
          }
        },
        landings: [
          {
            model: {
              id: 'id',
              vessel: {
                pln: 'pln 1',
                vesselName: 'vessel 1',
                homePort: 'port',
                flag: 'flag',
                licenceNumber: 'license1',
                imoNumber: 'imo1',
                licenceValidTo: '3000-01-01',
                rssNumber: 'rss1',
                vesselLength: 100,
                vesselOverriddenByAdmin: true,
                vesselNotFound: false
              },
              dateLanded: '2021-01-01',
              exclusiveEconomicZones: [],
              exportWeight: 1000,
              faoArea: 'fao1',
              numberOfSubmissions: 2
            }
          }
        ]
      }]
    };

    it('should map and save the data', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertExportPayload(defaultUser, payload, 'RJH-2020-CC-0E42C2DA5', contactId);

      const cert = await CatchCertModel.findOne(
        { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'RJH-2020-CC-0E42C2DA5' },
        ['exportData'],
        { lean: true }
      );

      expect(cert?.exportData.products).toStrictEqual(FrontEndPayloadSchema.toBackEndProductsLanded(payload));
    });

    it('should map and save the data when a document number is provided', async () => {

      await new CatchCertModel(sampleDocument('GBR-3444-3444-34444', 'DRAFT')).save();


      await CatchCertService.upsertExportPayload(defaultUser, payload, 'GBR-3444-3444-34444', contactId);

      const cert = await CatchCertModel.findOne(
        { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'GBR-3444-3444-34444' },
        ['exportData'],
        { lean: true }
      );

      expect(cert?.exportData.products).toStrictEqual(FrontEndPayloadSchema.toBackEndProductsLanded(payload));
    });

  });

  describe('upsertExportLocation', () => {
    it('should update exportData.transportation', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertExportLocation(
        defaultUser,
        {
          'exportedFrom': 'Albuquerque',
          'exportedTo': {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        'RJH-2020-CC-0E42C2DA5',
        contactId
      );

      const cert = await CatchCertModel.findOne(
        { createdBy: defaultUser, status: 'DRAFT', documentNumber: 'RJH-2020-CC-0E42C2DA5' },
        ['exportData'],
        { lean: true }
      );

      expect(cert?.exportData).toStrictEqual({
        'exportedFrom': 'Albuquerque',
        'exportedTo': {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });

    it('should update exportData.transportation with a document number', async () => {
      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42CDA5', 'DRAFT')).save();
      await CatchCertService.upsertExportLocation(
        defaultUser,
        {
          'exportedFrom': 'Jersey',
          'exportedTo': {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        'GBR-2020-CC-0E42CDA5',
        contactId);
      const result = await CatchCertModel.findOne({
        createdBy: defaultUser,
        status: 'DRAFT',
        documentNumber: 'GBR-2020-CC-0E42CDA5'
      },
        ['exportData'],
        { lean: true });

      expect(result?.exportData).toStrictEqual({
        'exportedFrom': 'Jersey',
        'exportedTo': {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      });
    });
  });

  describe('getDraft', () => {

    let mockFind;
    let mockGetDraftCache;

    beforeAll(() => {
      mockFind = jest.spyOn(CatchCertModel, 'findOne');
      mockFind.mockResolvedValue(null);

      mockGetDraftCache = jest.spyOn(CatchCertService, 'getDraftCache');
    });

    afterAll(() => {
      mockFind.mockRestore();
      mockGetDraftCache.mockRestore();
    });

    it('should call the findOne mongoose method with the correct parameters', async () => {
      const conditions = { documentNumber: undefined, status: { $in: ['DRAFT', 'PENDING', 'LOCKED'] } };

      await CatchCertService.getDraft('Bob', undefined, undefined);

      expect(mockFind).toHaveBeenCalledWith(conditions);
    });

    it('should be able to fetch by documentNumber', async () => {
      const conditions = { documentNumber: 'GBR-343434-234234-2344', status: { $in: ['DRAFT', 'PENDING', 'LOCKED'] } };

      await CatchCertService.getDraft('Bob', 'GBR-343434-234234-2344', contactId);

      expect(mockFind).toHaveBeenCalledWith(conditions);
    });

    test('cache returns empty', async () => {
      mockGetDraftCache.mockResolvedValue({});
      mockFind.mockResolvedValue({ doc: 'GBR-343434-234234-2344', contactId });

      const result = await CatchCertService.getDraft(undefined, 'GBR-343434-234234-2344', undefined);

      expect(result).toBeNull();
    });

    test('cache returns object', async () => {
      mockGetDraftCache.mockResolvedValue({ doc: 'GBR-343434-234234-2344' });

      const result = await CatchCertService.getDraft('Bob', 'GBR-343434-234234-2344', contactId);

      expect(result).toEqual({ doc: 'GBR-343434-234234-2344' });
    });

    it('should return null when owner validation fails', async () => {
      mockGetDraftCache.mockResolvedValue({});
      mockFind.mockResolvedValue({ doc: 'GBR-343434-234234-2344', contactId });

      const result = await CatchCertService.getDraft('Bob', 'GBR-343434-234234-2344', contactId);

      expect(result).toEqual({ doc: 'GBR-343434-234234-2344', contactId });
    });

  });

  describe('updateCertificateStatus', () => {

    const getDocument = async (documentNumber: string) => {
      const query = { documentNumber: documentNumber };
      const projection = ['-_id', '-__t', '-__v', '-audit'];
      const options = { lean: true };

      return await CatchCertModel.findOne(query, projection, options);
    };

    let mockInvalidateDraftCache;

    beforeEach(() => {
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
    });

    afterEach(() => {
      mockInvalidateDraftCache.mockRestore();
    })

    it('should mark a draft cert as pending', async () => {
      await new CatchCertModel(sampleDocument('test', CatchCertSchema.DocumentStatuses.Draft)).save();

      const original = await getDocument('test');

      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Pending);

      const updated = await getDocument('test');

      expect(updated).toStrictEqual({
        ...original,
        status: 'PENDING'
      });
    });

    it('should mark a pending cert as complete', async () => {
      await new CatchCertModel(sampleDocument('test', CatchCertSchema.DocumentStatuses.Pending)).save();

      const original = await getDocument('test');

      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Complete);

      const updated = await getDocument('test');

      expect(updated).toStrictEqual({
        ...original,
        status: 'COMPLETE'
      });
    });

    it('should mark a pending cert as draft', async () => {
      await new CatchCertModel(sampleDocument('test', CatchCertSchema.DocumentStatuses.Pending)).save();

      const original = await getDocument('test');

      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Draft);

      const updated = await getDocument('test');

      expect(updated).toStrictEqual({
        ...original,
        status: 'DRAFT'
      });
    });

    it('should not modify a complete certificate', async () => {
      await new CatchCertModel(sampleDocument('test', CatchCertSchema.DocumentStatuses.Complete)).save();

      const original = await getDocument('test');

      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Pending);

      const updated = await getDocument('test');

      expect(updated).toStrictEqual(original);
    });

    it('should not upsert if no document is found', async () => {
      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Pending);

      const draft = await getDocument('test');

      expect(draft).toBeNull();
    });

    it('should invalidate the cache for draft documents', async () => {
      await new CatchCertModel(sampleDocument('test', CatchCertSchema.DocumentStatuses.Draft)).save();

      await CatchCertService.updateCertificateStatus(defaultUser, 'test', contactId, CatchCertSchema.DocumentStatuses.Pending);

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    });
  });

  describe('getCertificateStatus', () => {
    let mockGetDraft;

    beforeEach(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockGetDraft.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockGetDraft.mockRestore();
    });

    it('should return the status of a document', async () => {

      mockGetDraft.mockResolvedValue(sampleDocument('test', 'LOCKED'));

      const result = await CatchCertService.getCertificateStatus('Bob', 'test', contactId);

      expect(mockGetDraft).toHaveBeenCalled();
      expect(result).toBe('LOCKED');
    });

    it('should not return a status if no document is found', async () => {
      const result = await CatchCertService.getCertificateStatus('Bob', 'test', contactId);

      expect(mockGetDraft).toHaveBeenCalled();
      expect(result).toBeNull();
    });

  });

  describe('completeDraft', () => {

    let mockDate;
    let mockInvalidateDraftCache;

    beforeAll(() => {
      mockDate = jest.spyOn(Date, 'now');
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
    });

    afterAll(() => {
      mockDate.mockRestore();
      mockInvalidateDraftCache.mockRestore();
    });

    const getDraft = async (documentNumber: string) => {
      const query = { documentNumber: documentNumber };
      const projection = ['-_id', '-__t', '-__v', '-audit'];
      const options = { lean: true };

      return await CatchCertModel.findOne(query, projection, options);
    };

    it('should complete a draft certificate', async () => {
      const testDate = '2020-02-12';
      mockDate.mockReturnValue(testDate);

      await new CatchCertModel(sampleDocument('test', 'DRAFT')).save();

      await CatchCertService.completeDraft(defaultUser, 'test', 'documentUri', 'bob@bob.bob', contactId);

      const updated = await getDraft('test');

      expect(updated).toStrictEqual({
        contactId: 'contactBob',
        documentNumber: 'test',
        documentUri: 'documentUri',
        createdAt: new Date(testDate),
        createdBy: defaultUser,
        createdByEmail: 'bob@bob.bob',
        status: 'COMPLETE',
        userReference: defaultUserReference
      });
    });

    it('should complete a pending certificate', async () => {
      const testDate = '2020-02-12';
      mockDate.mockReturnValue(testDate);

      await new CatchCertModel(sampleDocument('test', 'PENDING')).save();

      await CatchCertService.completeDraft(defaultUser, 'test', 'documentUri', 'bob@bob.bob', contactId);

      const updated = await getDraft('test');

      expect(updated).toStrictEqual({
        contactId: 'contactBob',
        documentNumber: 'test',
        documentUri: 'documentUri',
        createdAt: new Date(testDate),
        createdBy: defaultUser,
        createdByEmail: 'bob@bob.bob',
        status: 'COMPLETE',
        userReference: defaultUserReference
      });
    });

    it('should do nothing to a complete certificate', async () => {
      await new CatchCertModel(sampleDocument('test', 'COMPLETE')).save();

      const original = await getDraft('test');

      await CatchCertService.completeDraft(defaultUser, 'test', 'documentUri', 'bob@bob.bob', contactId);

      const updated = await getDraft('test');

      expect(updated).toStrictEqual(original);
    });

    it('should not upsert if no document is found', async () => {
      await CatchCertService.completeDraft(defaultUser, 'test', 'documentUri', 'bob@bob.bob', contactId);

      const draft = await getDraft('test');

      expect(draft).toBeNull();
    });

    it('should invalidate the cache for draft documents', async () => {
      await CatchCertService.completeDraft(defaultUser, 'test', 'documentUri', 'bob@bob.bob', contactId);

      expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    });
  });

  describe('getSpecies', () => {
    let mockGetDraft;
    let mockMap;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
      mockMap = jest.spyOn(CatchCertSchema, 'toFrontEndSpecies');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
      mockMap.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);

      expect(await CatchCertService.getSpecies('Bob', undefined, contactId)).toBeNull();
    });

    it('should map and return products if they exist', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      });

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      expect(await CatchCertService.getSpecies('Bob', undefined, contactId)).toEqual(['mapped', 'mapped']);
    });

    it('return products if we provide a documentNumber', async () => {
      const draft = createDraft({
        products: [
          { speciesId: '1' },
          { speciesId: '2' }
        ],
        transportation: null,
        transportations: null,
        conservation: null,
        exporterDetails: null
      }, 'GBR-34344-43444-234234234');

      mockGetDraft.mockResolvedValue(draft);
      mockMap.mockReturnValue('mapped');

      expect(await CatchCertService.getSpecies('Bob', 'GBR-34344-43444-234234234', contactId)).toEqual(['mapped', 'mapped']);
    });
  });

  describe('upsertSpecies', () => {

    const payload: Product[] = [{
      species: 'species',
      id: 'id',
      speciesCode: 'speciesCode',
      state: 'state',
      stateLabel: 'state-label',
      presentation: 'presentation',
      presentationLabel: 'presentationLabel',
      commodity_code: 'commodityCode',
      user_id: 'userid'
    }];

    it('should map and save the data', async () => {
      await new CatchCertModel(sampleDocument('RJH-2020-CC-0E42C2DA5', 'DRAFT')).save();


      await CatchCertService.upsertSpecies(defaultUser, payload, 'RJH-2020-CC-0E42C2DA5', contactId);

      const result = await CatchCertModel.findOne({
        createdBy: 'Bob',
        status: 'DRAFT',
        documentNumber: 'RJH-2020-CC-0E42C2DA5',
      }, ['exportData'], { lean: true });

      const expected = [{
        ...toBackEndProduct(payload[0]),
        caughtBy: [] // mongoose will default an undefined array type to an empty array
      }];

      expect(result?.exportData.products).toStrictEqual(expected);
    });

    it('should be able to take in a document number', async () => {

      await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();

      await CatchCertService.upsertSpecies(defaultUser, payload, 'GBR-2020-CC-0E42C2DA5', contactId);

      const result = await CatchCertModel.findOne({
        createdBy: 'Bob',
        status: 'DRAFT',
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      }, ['exportData'], { lean: true });

      const expected = [{
        ...toBackEndProduct(payload[0]),
        caughtBy: [] // mongoose will default an undefined array type to an empty array
      }];

      expect(result?.exportData.products).toStrictEqual(expected);
    });

    describe('getConservation', () => {
      let mockGet;
      let mockMap;

      beforeAll(() => {
        mockGet = jest.spyOn(CatchCertService, 'getDraft');
        mockMap = jest.spyOn(CatchCertSchema, 'toFrontEndConservation');
      });

      afterAll(() => {
        mockGet.mockRestore();
        mockMap.mockRestore();
      });

      it('should return null if there is no draft', async () => {
        mockGet.mockResolvedValue(null);

        const res = await CatchCertService.getConservation(defaultUser, undefined, contactId);

        expect(res).toBeNull();
      });

      it('should return null if the draft has no conservation', async () => {
        const draft = createDraft({
          conservation: null,
          products: null,
          transportation: null,
          transportations: null,
          exporterDetails: null
        });
        mockGet.mockResolvedValue(draft);

        const res = await CatchCertService.getConservation(defaultUser, undefined, contactId);

        expect(res).toBeNull();
      });

      it('should map and return a conservation if the draft has one', async () => {
        const draft = createDraft({
          conservation: {
            conservationReference: 'test'
          },
          products: null,
          transportation: null,
          transportations: null,
          exporterDetails: null
        });
        mockGet.mockResolvedValue(draft);
        mockMap.mockReturnValue('mapped');

        const res = await CatchCertService.getConservation(defaultUser, undefined, contactId);

        expect(res).toStrictEqual('mapped');
        expect(mockMap).toHaveBeenCalledWith(draft?.exportData.conservation);
      });

      it('should map and return a conservation when given a document number', async () => {
        const draft = createDraft({
          conservation: {
            conservationReference: 'test'
          },
          products: null,
          transportation: null,
          transportations: null,
          exporterDetails: null
        },
          'GBR-3444-42356-64834');
        mockGet.mockResolvedValue(draft);
        mockMap.mockReturnValue('mapped');

        const res = await CatchCertService.getConservation(defaultUser, 'GBR-3444-42356-64834', contactId);

        expect(res).toStrictEqual('mapped');
        expect(mockGet).toHaveBeenCalledWith(defaultUser, 'GBR-3444-42356-64834', contactId);
        expect(mockMap).toHaveBeenCalledWith(draft?.exportData.conservation);
      });
    });

    describe('upsertExporterDetails', () => {

      const payload: FrontEndExporterSchema.CcExporter = {
        model: {
          contactId: 'a contact Id',
          accountId: 'an account id',
          exporterFullName: 'Bob',
          exporterCompanyName: 'Exporter Co Ltd',
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: 'Aberdeen',
          postcode: 'AB1 2XX',
          user_id: '',
          currentUri: '',
          nextUri: '',
          journey: '',
          _dynamicsAddress: { someData: 'original data' },
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe"
          }
        }
      };

      it("will convert to a back end conservation model", async () => {
        await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();

        await CatchCertService.upsertExporterDetails(defaultUser, 'GBR-2020-CC-0E42C2DA5', payload, contactId);

        const result = await CatchCertModel.findOne({
          createdBy: 'Bob',
          documentNumber: 'GBR-2020-CC-0E42C2DA5',
          status: 'DRAFT'
        }, ['exportData'], { lean: true });
        expect(result?.exportData.exporterDetails).toStrictEqual(FrontEndExporterSchema.toBackEndCcExporterDetails(payload));
      });

      it("will work with a document number", async () => {
        await new CatchCertModel(sampleDocument('GBR-2020-CC-0E42C2DA5', 'DRAFT')).save();

        await CatchCertService.upsertExporterDetails(defaultUser, 'GBR-2020-CC-0E42C2DA5', payload, contactId);

        const result = await CatchCertModel.findOne({
          createdBy: 'Bob',
          status: 'DRAFT',
          documentNumber: 'GBR-2020-CC-0E42C2DA5'
        }, ['exportData'], { lean: true });

        expect(result?.exportData.exporterDetails).toStrictEqual(FrontEndExporterSchema.toBackEndCcExporterDetails(payload));
      });
    });

    describe('getExporterDetails', () => {
      let mockGet;
      let mockMap;

      beforeAll(() => {
        mockGet = jest.spyOn(CatchCertService, 'getDraft');
        mockMap = jest.spyOn(FrontEndExporterSchema, 'toFrontEndCcExporterDetails');
      });

      afterAll(() => {
        mockGet.mockRestore();
        mockMap.mockRestore();
      });

      it("will return null if no draft is found", async () => {
        mockGet.mockResolvedValue(null);

        expect(await CatchCertService.getExporterDetails(defaultUser, undefined, contactId)).toBeNull();
      });

      it("will return null if the draft has no exporter", async () => {
        const draft = createDraft({
          products: null,
          transportation: null,
          transportations: null,
          conservation: null,
          exporterDetails: null
        });

        mockGet.mockResolvedValue(draft);

        expect(await CatchCertService.getExporterDetails(defaultUser, undefined, contactId)).toBeNull();
      });

      it("will return a mapped exporter if the draft has an exporter", async () => {
        const draft = createDraft({
          products: null,
          transportation: null,
          transportations: null,
          conservation: null,
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterFullName: 'Bob',
            exporterCompanyName: 'Exporter Co Ltd',
            addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            buildingNumber: '123',
            subBuildingName: 'Unit 1',
            buildingName: 'CJC Fish Ltd',
            streetName: '17  Old Edinburgh Road',
            county: 'West Midlands',
            country: 'England',
            townCity: 'Aberdeen',
            postcode: 'AB1 2XX',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: "John",
              lastName: "Doe"
            }
          }
        });

        mockGet.mockResolvedValue(draft);
        mockMap.mockReturnValue({ mapped: true });

        const res = await CatchCertService.getExporterDetails(defaultUser, undefined, contactId);

        expect(mockMap).toHaveBeenCalledWith(draft?.exportData.exporterDetails);
        expect(res).toStrictEqual({ mapped: true });
      });

      it("will fetch exporter details by documentNumber", async () => {
        const draft = createDraft({
          products: null,
          transportation: null,
          transportations: null,
          conservation: null,
          exporterDetails: {
            contactId: 'a contact Id',
            accountId: 'an account id',
            exporterFullName: 'Bob',
            exporterCompanyName: 'Exporter Co Ltd',
            addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            buildingNumber: '123',
            subBuildingName: 'Unit 1',
            buildingName: 'CJC Fish Ltd',
            streetName: '17  Old Edinburgh Road',
            county: 'West Midlands',
            country: 'England',
            townCity: 'Aberdeen',
            postcode: 'AB1 2XX',
            _dynamicsAddress: {},
            _dynamicsUser: {
              firstName: "John",
              lastName: "Doe"
            }
          }
        });

        mockGet.mockResolvedValue(draft);
        mockMap.mockReturnValue({ mapped: true });

        await CatchCertService.getExporterDetails(defaultUser, 'GBR-34344234-24323423-234234', contactId);

        expect(mockGet).toHaveBeenCalledWith("Bob", "GBR-34344234-24323423-234234", contactId);
      });
    });

    describe('upsertUserReference', () => {

      let mockInvalidateDraftCache;

      beforeEach(() => {
        mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
        mockInvalidateDraftCache.mockResolvedValue(undefined);
      });

      afterEach(() => {
        mockInvalidateDraftCache.mockRestore();
      });

      it("will upsert a user reference and invalidate cache", async () => {
        const documentNumber = 'doc1234';
        const userReference = 'ref1234';

        await new CatchCertModel({ documentNumber: documentNumber, status: 'DRAFT', createdBy: defaultUser }).save();
        await CatchCertService.upsertUserReference(defaultUser, documentNumber, userReference, contactId);

        const draft = await CatchCertService.getDraft(defaultUser, documentNumber, contactId);

        expect(draft).not.toBeNull();
        expect(draft.userReference).toStrictEqual(userReference);

        expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
        expect(mockInvalidateDraftCache).toHaveBeenNthCalledWith(1, defaultUser, 'doc1234', contactId);
        expect(mockInvalidateDraftCache).toHaveBeenNthCalledWith(2, defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      });

      it("will upsert a user reference and invalidate DRAFT headers for user cache", async () => {
        const documentNumber = 'doc1234';
        const userReference = 'ref1234';

        await CatchCertService.upsertUserReference(defaultUser, documentNumber, userReference, contactId);

        expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(1);
        expect(mockInvalidateDraftCache).toHaveBeenNthCalledWith(1, defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
      });

    });
  });

  describe('cloneCatchCertificate', () => {

    const originalDocNumber = 'cc1';
    const cloneDocNumber = 'cc2';
    const defaultExcludeLandings = false;
    const defaultRequestByAdmin = false;
    const voidOriginal = false;

    const original: CatchCertificate = {
      createdBy: defaultUser,
      createdByEmail: 'bob@bob',
      createdAt: '2021-01-01T00:00:00.000+00:00',
      status: DocumentStatuses.Draft,
      documentNumber: originalDocNumber,
      exportData: {
        exporterDetails: {
          accountId: 'accountId',
          exporterFullName: 'exporterFullName',
          exporterCompanyName: 'exporterCompanyName',
          buildingNumber: 'buildingNumber',
          subBuildingName: 'subBuildingName',
          buildingName: 'buildingName',
          streetName: 'streetName',
          county: 'county',
          country: 'country',
          townCity: 'townCity',
          postcode: 'postcode',
          addressOne: 'addressOne',
          _dynamicsAddress: null,
          _dynamicsUser: null
        },
        products: [],
        transportation: {
          vehicle: 'Truck'
        },
        transportations: [{
          id: 0,
          vehicle: 'Truck'
        }],
        conservation: {
          conservationReference: 'conservationReference'
        },
        landingsEntryOption: CatchCertSchema.LandingsEntryOptions.ManualEntry
      },
      userReference: 'userReference',
      requestByAdmin: false
    }

    let mockInvalidateDraftCache;
    let mockGetSpeciesByFaoCode
    let mockLoggerInfo

    beforeEach(async () => {
      jest
        .spyOn(DocumentNumberService, 'getUniqueDocumentNumber')
        .mockResolvedValue(cloneDocNumber);

      await new CatchCertModel(original).save();
      mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
      mockInvalidateDraftCache.mockResolvedValue(undefined);
      mockGetSpeciesByFaoCode = jest.spyOn(ReferenceData, "getSpeciesByFaoCode")
      mockLoggerInfo = jest.spyOn(logger, 'info');
    });

    it('will throw an error if the cc can not be found', async () => {
      const invalidDocNumber = 'cc99';

      await expect(() => CatchCertService.cloneCatchCertificate(invalidDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal))
        .rejects
        .toThrow(`Document ${invalidDocNumber} not found for user ${defaultUser}`);

      expect(mockInvalidateDraftCache).not.toHaveBeenCalled();
    });

    it('will return the document number of the newly created copy', async () => {
      const result = await CatchCertService.cloneCatchCertificate(originalDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal);

      expect(result).toBe(cloneDocNumber);
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    });

    it('will clone an existing cc', async () => {
      await CatchCertService.cloneCatchCertificate(originalDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal);

      const clone = await CatchCertService.getDocument(cloneDocNumber, defaultUser, contactId);

      expect(clone).not.toBeNull();
      expect(mockInvalidateDraftCache).toHaveBeenCalledWith(defaultUser, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    });
    it('will return the document number of newly created copy when Products array is empty', async () => {
      await CatchCertService.cloneCatchCertificate(originalDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal);
      const clone = await CatchCertService.getDocument(cloneDocNumber, defaultUser, contactId);
      expect(clone).not.toBeNull();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[GET-COPY][PRODUCT][cc1][NO-PRODUCT]`
      );
    });

    it('Will Throw an error when something goes wrong while newly creating a copy', async () => {
      const product: Products = { speciesId: 'abc' };
      await CatchCertService.updateProductScientificName(product, "abc");
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        `[GET-COPY][DOCUMENT-NUMBER][abc][PRODUCT][[object Object]][GET-FAO-CODE][undefined]`
      );

    });

    it('will return the document number of newly created copy even when scientifcName is already there in the product', async () => {
      const product: Products = { speciesId: 'abc', speciesCode: '123', scientificName: 'Existing Name' };
      await CatchCertService.updateProductScientificName(product, "abc");
      expect(mockGetSpeciesByFaoCode).not.toHaveBeenCalled();
      expect(product.scientificName).toBe('Existing Name');
    });

    it('updateProductScientificName will be called when product is present', async () => {
      const clonedCC = {
        ...original,
      }
      clonedCC.exportData.products = [{
        speciesId: 'GBR-2024-CC-42101AC39-ce16125a-27cb-4134-abd3-f2f8e8af8ade',
        species: 'Haddock (HAD)',
        speciesCode: 'HAD',
        commodityCode: '03047200',
        commodityCodeDescription: 'Frozen fillets of haddock "Melanogrammus aeglefinus"',
        state: { code: 'FRO', name: 'Frozen' },
        presentation: { code: 'FIS', name: 'Filleted and skinned' },
        factor: 2.6,
        caughtBy: []
      }]
      await new CatchCertModel(clonedCC).save();

      await CatchCertService.cloneCatchCertificate(originalDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal);

      expect(clonedCC.exportData.products).toHaveLength(1)
    });

    it('will return the document number of newly created copy when scientificName is not present in the product', async () => {
      const product: Products = { speciesId: 'abc', speciesCode: '123' };
      mockGetSpeciesByFaoCode.mockReturnValue([{ faoCode: '123', scientificName: 'New Scientific Name' }])
      await CatchCertService.updateProductScientificName(product, "abc");
      expect(mockGetSpeciesByFaoCode).toHaveBeenCalledWith('123');
      expect(product.scientificName).toBe('New Scientific Name');
    });

    it('will not link the clone with the original - changes to one do not effect the other', async () => {
      await CatchCertService.cloneCatchCertificate(originalDocNumber, defaultUser, defaultExcludeLandings, contactId, defaultRequestByAdmin, voidOriginal);

      await CatchCertService.upsertDraftData(
        defaultUser,
        originalDocNumber,
        { '$set': { 'exportData.exporterDetails.exporterFullName': 'Modified' } },
        contactId
      );

      const updated = await CatchCertService.getDocument(originalDocNumber, defaultUser, contactId);

      expect(updated.exportData.exporterDetails.exporterFullName)
        .toBe('Modified');

      const cloned = await CatchCertService.getDocument(cloneDocNumber, defaultUser, contactId);

      expect(cloned.exportData.exporterDetails.exporterFullName)
        .toBe(original.exportData.exporterDetails.exporterFullName);
    });

  });

  describe('voidCatchCertificate', () => {
    const documentNumber = 'GBR-XXXX-CC-XXXXXXXX';
    let mockVoidCertificate;

    beforeEach(() => {
      mockVoidCertificate = jest.spyOn(ManageCertsService, 'voidCertificate');
      mockVoidCertificate.mockResolvedValue(true);
    })

    it('will void the Catch Certificate matching the given document number', async () => {
      const result = await CatchCertService.voidCatchCertificate(documentNumber, defaultUser, contactId);

      expect(mockVoidCertificate).toHaveBeenCalledWith(documentNumber, defaultUser, contactId);
      expect(mockVoidCertificate).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('will throw an error if the Catch Certificate can not be void', async () => {
      mockVoidCertificate.mockResolvedValue(false);

      await expect(() => CatchCertService.voidCatchCertificate(documentNumber, defaultUser, contactId))
        .rejects
        .toThrow(`Document ${documentNumber} not be voided by user ${defaultUser}`);
    });
  });

  describe('checkDocument', () => {

    let mockUserCanCreateDraft;

    beforeEach(() => {
      mockUserCanCreateDraft = jest.spyOn(Validator, 'userCanCreateDraft');
      mockUserCanCreateDraft.mockResolvedValue(true);
    });

    afterEach(() => {
      mockUserCanCreateDraft.mockRestore();
    });

    it('will return a document if a match exists', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();

      const result = await CatchCertService.checkDocument('doc1', defaultUser, contactId, documentType);

      expect(result).toBeTruthy();
    });

    it('will return false when user has more that allowable amount of DRAFT documents', async () => {
      mockUserCanCreateDraft.mockResolvedValue(false);

      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();

      const result = await CatchCertService.checkDocument('doc1', defaultUser, contactId, documentType);

      expect(mockUserCanCreateDraft).toHaveBeenCalledWith('Bob', "catchCertificate", "contactBob");
      expect(result).toBeFalsy();
    });

    it('will return false if no document can be found', async () => {
      const result = await CatchCertService.checkDocument('doc1', defaultUser, contactId, documentType);

      expect(result).toBeFalsy();
    });

    it('will return null if owner validation fails', async () => {
      await new CatchCertModel(sampleDocument('doc1', 'COMPLETE')).save();

      const result = await CatchCertService.checkDocument('doc1', undefined, undefined, documentType);

      expect(result).toBeFalsy();
    });

  });

  describe('getDraftCache', () => {
    const cachedDoc = {
      documentNumber: "GBR-2020-CC-0E42C2DA5",
    };

    let mockSessionStore: MockSessionStorage<IStoreable>;

    beforeEach(() => {
      mockSessionStore = new MockSessionStorage();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('return cached object', async () => {
      const mockReadFor = jest.fn(() => Promise.resolve(cachedDoc));
      mockSessionStore.readFor = mockReadFor;

      const mockGetSessionStore = jest.spyOn(
        SessionStoreFactory,
        "getSessionStore"
      );
      mockGetSessionStore.mockResolvedValue(mockSessionStore);

      mockSessionStore.readFor = mockReadFor;
      const result = await CatchCertService.getDraftCache(
        "BOB",
        CONTACT_ID,
        "GBR-2020-CC-0E42C2DA5"
      );
      expect(result).toEqual(cachedDoc);
    });

    test('return undefined on empty cache', async () => {
      const mockReadFor = jest.fn(() => Promise.resolve(undefined));
      mockSessionStore.readAllFor = mockReadFor;

      const mockGetSessionStore = jest.spyOn(
        SessionStoreFactory,
        "getSessionStore"
      );
      mockGetSessionStore.mockResolvedValue(mockSessionStore);

      mockSessionStore.readFor = mockReadFor;
      const result = await CatchCertService.getDraftCache(
        "BOB",
        CONTACT_ID,
        "GBR-2020-CC-0E42C2DA5"
      );
      expect(result).toBeUndefined();
    });
  });

  const createDraft = (exportData: ExportData | undefined, documentNumber: string = 'X'): CatchCertificate => {
    return {
      documentNumber: documentNumber,
      status: 'DRAFT',
      createdAt: '',
      createdBy: '',
      createdByEmail: '',
      draftData: null,
      exportData: exportData,
      documentUri: '',
      userReference: '',
      requestByAdmin: true
    }
  };

});

describe('getLandingsEntryOption', () => {

  const userPrincipal = 'Bob';
  const contactId = 'contactBob';
  const documentNumber = 'doc123';
  let mockGetDraft;

  beforeEach(() => {
    mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
    mockGetDraft.mockResolvedValue(undefined);
  });

  it('will return undefined if there is no draft', async () => {
    const result = await CatchCertService.getLandingsEntryOption(userPrincipal, documentNumber, contactId);

    expect(result).toBeUndefined();
    expect(mockGetDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
  });

  it('will return undefined if there is no exportData', async () => {
    mockGetDraft.mockResolvedValue({
      documentNumber: documentNumber,
      status: 'DRAFT',
      createdBy: userPrincipal
    });

    const result = await CatchCertService.getLandingsEntryOption(userPrincipal, documentNumber, contactId);

    expect(result).toBeUndefined();
    expect(mockGetDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
  });

  it('will return undefined if there is no exportData.landingsEntryOption', async () => {
    mockGetDraft.mockResolvedValue({
      documentNumber: documentNumber,
      status: 'DRAFT',
      createdBy: userPrincipal,
      exportData: {
        transportation: {},
        conservation: {
          conservationReference: 'conservationReference'
        }
      }
    });

    const result = await CatchCertService.getLandingsEntryOption(userPrincipal, documentNumber, contactId);

    expect(result).toBeUndefined();
    expect(mockGetDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
  });

  it('will return the correct value if there is a exportData.landingsEntryOption', async () => {
    mockGetDraft.mockResolvedValue({
      documentNumber: documentNumber,
      status: 'DRAFT',
      createdBy: userPrincipal,
      exportData: {
        transportation: {},
        conservation: {
          conservationReference: 'conservationReference'
        },
        landingsEntryOption: CatchCertSchema.LandingsEntryOptions.ManualEntry
      }
    });

    const result = await CatchCertService.getLandingsEntryOption(userPrincipal, documentNumber, contactId);

    expect(result).toBe(CatchCertSchema.LandingsEntryOptions.ManualEntry);
    expect(mockGetDraft).toHaveBeenCalledWith(userPrincipal, documentNumber, contactId);
  });

});

describe('constructOwnerQuery', () => {
  it('will return createdBy & contactId if userPrincipal & contactId are provided', () => {
    const result = CatchCertService.constructOwnerQuery('userPrincipal', 'contactId');
    expect(result).toEqual([
      {
        createdBy: 'userPrincipal'
      },
      {
        contactId: 'contactId',
      },
      {
        'exportData.exporterDetails.contactId': 'contactId',
      },
    ]);
  });

  it('will return contactId if contactId is provided', () => {
    const result = CatchCertService.constructOwnerQuery(undefined, 'contactId');
    expect(result).toEqual([
      {
        contactId: 'contactId',
      },
      {
        'exportData.exporterDetails.contactId': 'contactId',
      },
    ]);
  });

  it('will return createdBy if contactId is not provided', () => {
    const result = CatchCertService.constructOwnerQuery(
      'userPrincipal',
      undefined
    );
    expect(result).toEqual([
      {
        createdBy: 'userPrincipal',
      },
    ]);
  });

  it('will throw exception if contactID is not provided', () => {
    expect(() =>
      CatchCertService.constructOwnerQuery(undefined, undefined)
    ).toThrow('UserPrincipal and ContactId are both undefined');
  });
});