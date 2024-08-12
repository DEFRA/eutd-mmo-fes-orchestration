import { userCanCreateDraft } from './draftCreationValidator';
import ApplicationConfig from "../applicationConfig";
import {MongoMemoryServer} from "mongodb-memory-server";
import * as mongoose from "mongoose";
import {CatchCertModel} from "../persistence/schema/catchCert";
import {ProcessingStatementModel} from "../persistence/schema/processingStatement";
import {StorageDocumentModel} from "../persistence/schema/storageDoc";

describe('A draft creation validator', () => {
  let mongoServer;
  const contactId = 'contactBob';

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});
  });

  afterEach(async () => {
    await CatchCertModel.deleteMany({});
    await ProcessingStatementModel.deleteMany({});
    await StorageDocumentModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const sampleDocument = (documentNumber, status, user) => ({
    documentNumber    : documentNumber,
    status            : status,
    createdAt         : new Date('2020-01-16'),
    createdBy         : user
  });

  describe('It will pass validation', () => {

    beforeAll(() => {
      ApplicationConfig._maximumConcurrentDrafts = 3;
    });

    it('When a user has not exceeded the maximum number of concurrent draft catch certificates', async () => {
      const userId = "34734428328423752384238423";

      await new CatchCertModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new CatchCertModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId, "catchCertificate", contactId);

      expect(result).toBe(true);
    });

    it('When a user has not exceeded the maximum number of concurrent draft processing statement certificates', async () => {
      const userId = "34734428328423752384238423";

      await new ProcessingStatementModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new ProcessingStatementModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"processingStatement", contactId);

      expect(result).toBe(true);
    });

    it('When a user has not exceeded the maximum number of concurrent draft storage document certificates', async () => {
      const userId = "34734428328423752384238423";

      await new StorageDocumentModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new StorageDocumentModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"storageDocument", contactId);

      expect(result).toBe(true);
    });

    it('When a user has not exceeded the maximum number of concurrent draft storage notes', async () => {
      const userId = "34734428328423752384238423";

      await new StorageDocumentModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new StorageDocumentModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId, "storageNotes", contactId);

      expect(result).toBe(true);
    });
  });

  describe('It will fail validation', () => {
    beforeAll(() => {
      ApplicationConfig._maximumConcurrentDrafts = 2;
    });

    it('When a user has reached the maximum number of concurrent catch certificate drafts', async () => {
      const userId = "34734428328423752384238423";

      await new CatchCertModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new CatchCertModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"catchCertificate", contactId);

      expect(result).toBe(false);
    });
    it('When a user has exceeded the maximum number of concurrent catch certificate drafts', async () => {
      const userId = "34734428328423752384238423";

      await new CatchCertModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new CatchCertModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();
      await new CatchCertModel(sampleDocument('RRR-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"catchCertificate", contactId);

      expect(result).toBe(false);
    });

    it('When a user has reached the maximum number of concurrent processing statements drafts', async () => {
      const userId = "34734428328423752384238423";

      await new ProcessingStatementModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new ProcessingStatementModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"processingStatement", contactId);

      expect(result).toBe(false);
    });
    it('When a user has exceeded the maximum number of concurrent processing statements drafts', async () => {
      const userId = "34734428328423752384238423";

      await new ProcessingStatementModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new ProcessingStatementModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();
      await new ProcessingStatementModel(sampleDocument('RRR-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"processingStatement", contactId);

      expect(result).toBe(false);
    });

    it('When a user has reached the maximum number of concurrent storage document drafts', async () => {
      const userId = "34734428328423752384238423";

      await new StorageDocumentModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new StorageDocumentModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"storageDocument", contactId);

      expect(result).toBe(false);
    });
    it('When a user has exceeded the maximum number of concurrent storage document drafts', async () => {
      const userId = "34734428328423752384238423";

      await new StorageDocumentModel(sampleDocument('MRZ-2020-02-5555-2343','DRAFT',userId)).save();
      await new StorageDocumentModel(sampleDocument('IT-2020-02-3432-2134','DRAFT',userId)).save();
      await new StorageDocumentModel(sampleDocument('RRR-2020-02-3432-2134','DRAFT',userId)).save();

      const result = await userCanCreateDraft(userId,"storageDocument", contactId);

      expect(result).toBe(false);
    });
  });
});
