import * as mongoose from "mongoose";
import * as SUT from './documentOwnershipValidator';
import * as CatchCertService from '../persistence/services/catchCert';
import { MongoMemoryServer } from "mongodb-memory-server";
import { CatchCertModel, DocumentStatuses } from "../persistence/schema/catchCert";
import { ProcessingStatementModel } from "../persistence/schema/processingStatement";
import { StorageDocumentModel } from "../persistence/schema/storageDoc";
import ServiceNames from "./interfaces/service.name.enum";
import DocumentNumberService from "../services/documentNumber.service";

describe('validateDocumentOwnership', () => {

  const userId = 'Bob';
  const contactId = 'contactBob';
  const documentNumber = 'GBP-2020-CC-ABC12345';
  const statuses: DocumentStatuses[] = [DocumentStatuses.Draft];

  let getOwnerFromMongo;
  let ownerConfirmedInCache;

  beforeEach(() => {
    getOwnerFromMongo = jest.spyOn(SUT, 'getOwnerFromMongo');

    ownerConfirmedInCache = jest.spyOn(SUT, 'ownerConfirmedInCache');
    ownerConfirmedInCache.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will immediately return false if no user and contact id is provided', async () => {
    const result = await SUT.validateDocumentOwnership(undefined, documentNumber, statuses, undefined);

    expect(result).toBeUndefined();
    expect(getOwnerFromMongo).not.toHaveBeenCalled();
  });

  it('will immediately return false if no document number is provided', async () => {
    const result = await SUT.validateDocumentOwnership(userId, undefined, statuses, contactId);

    expect(result).toBeUndefined();
    expect(getOwnerFromMongo).not.toHaveBeenCalled();
  });

  describe('if the cache confirms the document owner', () => {

    it('will return true', async () => {
      ownerConfirmedInCache.mockResolvedValue(true);

      const result = await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(result).toBe(true);
    });

    it('will not query mongo', async () => {
      ownerConfirmedInCache.mockResolvedValue(true);

      await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(getOwnerFromMongo).not.toHaveBeenCalled();
    });

  });

  describe('if the cache does not confirm the document owner', () => {
    it('will transform the provided document number to uppercase and query with given status', async () => {
      getOwnerFromMongo.mockResolvedValue(false);

      const documentNumber = 'gbr-2020-Sd-aBC1234';

      await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(getOwnerFromMongo).toHaveBeenCalledWith(documentNumber.toUpperCase(), statuses, userId, contactId);
    });

    it('will return false if no document can be found', async () => {
      getOwnerFromMongo.mockResolvedValue(false);

      const result = await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(result).toBe(false);
    });

    it('will return false if the document does not belong to the given user', async () => {
      getOwnerFromMongo.mockResolvedValue(false);

      const result = await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(result).toBe(false);
    });

    it('will return true if userId belongs to a specific user', async () => {
      getOwnerFromMongo.mockResolvedValue(true);

      const result = await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(result).toBe(true);
    });

    it('will return true if contactId belongs to a specific user', async () => {
      getOwnerFromMongo.mockResolvedValue(true);

      const result = await SUT.validateDocumentOwnership(userId, documentNumber, statuses, contactId);

      expect(result).toBe(true);
    });

  });

});

describe('getOwnerFromMongo', () => {

  let mongoServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});
  });

  afterEach(async() => {
    await CatchCertModel.deleteMany({});
    await ProcessingStatementModel.deleteMany({});
    await StorageDocumentModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const sampleDocument = (documentNumber, user, status = 'DRAFT', contactId = 'contactBob') => ({
    documentNumber    : documentNumber,
    status            : status,
    createdAt         : new Date('2020-01-16'),
    createdBy         : user,
    contactId         : contactId
  });

  describe('when passed the document number for a catch certificate', () => {

    const userId = 'bob';
    const contactId = 'contactBob';
    const documentNumber = 'GBP-2020-CC-ABC12345';
    const statuses: DocumentStatuses[] = [DocumentStatuses.Draft];

    it('will return the owner of the catch cert', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeTruthy();
    });

    it('will return false if no catch cert is found', async () => {
      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeFalsy();
    });

    it('will not query completed catch certificates', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeFalsy();
    });

    it('will query completed catch certificates when given a status of COMPLETE', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Complete], userId, contactId);

      expect(result).toBeTruthy();
    });

    it('will query locked catch certificates when given a status of LOCKED', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId, 'LOCKED')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Locked], userId, contactId);

      expect(result).toBeTruthy();
    });

    it('will query draft or locked catch certificates when given a status of DRAFT and LOCKED', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId, 'LOCKED')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Draft,DocumentStatuses.Locked], userId, contactId);

      expect(result).toBeTruthy();
    });

    it('will query completed catch certificates by correct userId and contactId', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId, 'COMPLETE', contactId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Complete], userId, contactId);

      expect(result).toBeTruthy();
    });

    it('will not query processing statements or storage documents', async () => {
      await new ProcessingStatementModel(sampleDocument(documentNumber, userId)).save();
      await new StorageDocumentModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeFalsy();
    });

  });

  describe('when passed the document number for a processing statement', () => {

    const userId = 'bob';
    const contactId = 'contactBob';
    const documentNumber = 'GBP-2020-PS-ABC12345';
    const statuses: DocumentStatuses[] = [DocumentStatuses.Draft];

    it('will return the owner of the processing statement by userId', async () => {
      await new ProcessingStatementModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeDefined();
    });

    it('will return false if no processing statement is found', async () => {
      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

    it('will not query completed processing statements', async () => {
      await new ProcessingStatementModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

    it('will query completed processing statements when given a status of COMPLETE', async () => {
      await new ProcessingStatementModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Complete], userId, contactId);

      expect(result).toBeDefined();
    });

    it('will not query catch certificates or storage documents', async () => {
      await new StorageDocumentModel(sampleDocument(documentNumber, userId)).save();
      await new CatchCertModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

  });

  describe('when passed the document number for a storage document', () => {

    const userId = 'bob';
    const contactId = 'contactBob';
    const documentNumber = 'GBP-2020-SD-ABC12345';
    const statuses: DocumentStatuses[] = [DocumentStatuses.Draft];

    it('will return true if correct owner of the storage document', async () => {
      await new StorageDocumentModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeDefined();
    });

    it('will return false if no storage document is found', async () => {
      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

    it('will not query completed storage documents', async () => {
      await new StorageDocumentModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

    it('will query completed storage documents when given a status of COMPLETE', async () => {
      await new StorageDocumentModel(sampleDocument(documentNumber, userId, 'COMPLETE')).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, [DocumentStatuses.Complete], userId, contactId);

      expect(result).toBeDefined();
    });

    it('will not query catch certificates or processing statements', async () => {
      await new CatchCertModel(sampleDocument(documentNumber, userId)).save();
      await new ProcessingStatementModel(sampleDocument(documentNumber, userId)).save();

      const result = await SUT.getOwnerFromMongo(documentNumber, statuses, userId, contactId);

      expect(result).toBeNull();
    });

  });

});

describe('ownerConfirmedInCache', () => {

  const documentNumber = 'doc123';
  const contactId = 'contactBob';
  const userPrincipal = 'bob';
  const statuses: DocumentStatuses[] = [DocumentStatuses.Draft, DocumentStatuses.Blocked];

  let getServiceNameFromDocumentNumber;
  let getDraftCache;

  beforeEach(() => {
    getServiceNameFromDocumentNumber = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber');
    getServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

    getDraftCache = jest.spyOn(CatchCertService, 'getDraftCache');
    getDraftCache.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will immediately return false if the document is not a CC', async () => {
    getServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.PS);

    const result = await SUT.ownerConfirmedInCache(documentNumber, userPrincipal, statuses, contactId);

    expect(getDraftCache).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('will immediately return false if the supplied statuses to check doesnt contain the DRAFT status', async () => {
    const result = await SUT.ownerConfirmedInCache(documentNumber, userPrincipal, [DocumentStatuses.Complete], contactId);

    expect(getDraftCache).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('will return false if the cache returns null', async () => {
    const result = await SUT.ownerConfirmedInCache(documentNumber, userPrincipal, statuses, contactId);

    expect(getDraftCache).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('will return true if we find the draft in cache', async () => {
    getDraftCache.mockResolvedValue({documentNumber: documentNumber});

    const result = await SUT.ownerConfirmedInCache(documentNumber, userPrincipal, statuses, contactId);

    expect(getDraftCache).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

});

describe('validateDocumentOwner', () => {

  it('returns false if userPrincipal = undefined and contactId is wrong', () => {
    const document = {
      contactId: 'contactBob',
      exportData: {
        exporterDetails: {
          contactId: 'contactBob'
        }
      }
    } as any;

    const result = SUT.validateDocumentOwner(document, undefined, 'contactWrong');
    expect(result).toBeFalsy();
  });

  it('returns true if userPrincipal is undefined and contactId is correct', () => {
    const document = {
      contactId: 'contactBob',
      exportData: {
        exporterDetails: {
          contactId: 'contactBob'
        }
      }
    } as any;

    const result = SUT.validateDocumentOwner(document, undefined, 'contactBob');
    expect(result).toBeTruthy();
  });

  it('returns true if userPrincipal is correct and contactId is undefined', () => {
    const document = {
      createdBy: 'Bob',
      contactId: 'contactBob',
      exportData: {
        exporterDetails: {
          contactId: 'contactBob'
        }
      }
    } as any;

    const result = SUT.validateDocumentOwner(document, 'Bob', undefined);
    expect(result).toBeTruthy();
  });

  it('returns true if userPrincipal is correct and contactId is correct', () => {
    const document = {
      createdBy: 'Bob',
      contactId: 'contactBob',
      exportData: {
        exporterDetails: {
          contactId: 'contactBob'
        }
      }
    } as any;

    const result = SUT.validateDocumentOwner(document, 'Bob', 'contactBob');
    expect(result).toBeTruthy();
  });

  it('returns false if userPrincipal is undefined and contactId is undefined', () => {
    const document = {
      createdBy: 'Bob',
      contactId: 'contactBob',
      exportData: {
        exporterDetails: {
          contactId: 'contactBob',
        },
      },
    } as any;

    const result = SUT.validateDocumentOwner(document, undefined, undefined);
    expect(result).toBeFalsy();
  });

  it('returns false if document is undefined', () => {
    const result = SUT.validateDocumentOwner(undefined, 'bob', 'contactBob');
    expect(result).toBeFalsy();
  });

  // need to fix tests here
});