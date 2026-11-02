import { MemoryStorage } from './memory'
import { IStoreable } from './storeable'

describe("MemoryStorage", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const CONTACT_ID = 'contactBob';
  const memoryStorage: MemoryStorage<IStoreable> = new MemoryStorage<IStoreable>();

  afterEach(() => {
    memoryStorage.cleanUp();
  })

  describe("readAll()", () => {

    it("should return a blank array if the key is not in store", async () => {
      const result = await memoryStorage.readAll("a-simple-key");
      expect(result).toEqual([]);
    });

    it("should return the value if the key is in store", async () => {
      const mockData = [{
        _marker: jest.fn()
      }];
      const mockKey = "a-key";

      await memoryStorage.writeAll(mockKey, mockData);
      const result = await memoryStorage.readAll(mockKey);
      expect(result).toEqual(mockData);
    });

  });

  describe("read()", () => {

    it("should return a null value if the key is not in store", async () => {
      const result = await memoryStorage.read("a-simple-key");
      expect(result).toBeNull();
    });

    it("should return the value if the key is in store", async () => {
      const mockData = [{
        _marker: jest.fn()
      }];
      const mockKey = "a-key";

      await memoryStorage.writeAll(mockKey, mockData);
      const result = await memoryStorage.read(mockKey);
      expect(result).toEqual(mockData);
    });

  });

  describe("readFor()", () => {
    it("should return undefined if the key is not in store", async () => {
      const result = await memoryStorage.readFor(USER_ID, "a-simple-key");
      expect(result).toBeUndefined();
    });

    it("should return the value if the key is in store", async () => {
      const mockData: any = {test: 'test'};
      const mockKey = "a-key";

      await memoryStorage.writeFor(USER_ID,CONTACT_ID, mockKey, mockData);
      const result = await memoryStorage.readFor(USER_ID, mockKey);

      expect(result).toEqual(mockData);
    });
  });

  describe("writeFor()", () => {

    it("should write the value to the store", async () => {
      const mockData: any = {test: 'test'};
      const mockKey = "a-key";

      await memoryStorage.writeFor(USER_ID, CONTACT_ID, mockKey, mockData);
      const result = await memoryStorage.readFor(USER_ID, mockKey);

      expect(result).toEqual(mockData);
    });

  });

  describe("readAllFor()", () => {
    it("should return a blank array if the key is not in store", async () => {
      const result = await memoryStorage.readAllFor(USER_ID,"a-simple-key");
      expect(result).toEqual([]);
    });

    it("should return the value if the key is in store", async () => {
      const mockData = [{
        _marker: jest.fn()
      }];
      const mockKey = "a-key";

      await memoryStorage.writeAllFor(USER_ID, CONTACT_ID, mockKey, mockData);
      const result = await memoryStorage.readAllFor(USER_ID, mockKey);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("tagging and keys", () => {
    it('should create an empty tag for a document number and retrieve keys', async () => {
      await memoryStorage.tagByDocumentNumber(USER_ID, 'DOC-123', 'journey');
      const keys = await memoryStorage.getKeysForTag('DOC-123');

      expect(keys).toEqual([]);
    });

    it('should remove a tag and return undefined for keys afterwards', async () => {
      await memoryStorage.tagByDocumentNumber(USER_ID, 'DOC-456', 'journey');
      await memoryStorage.removeTag('DOC-456');

      const keys = await memoryStorage.getKeysForTag('DOC-456');
      expect(keys).toBeUndefined();
    });

    it('getDocument should return null by default', async () => {
      const doc = await memoryStorage.getDocument('SOME-DOC');
      expect(doc).toBeNull();
    });
  });

  describe("promise based API", () => {
    it("should return promises from every data access method", async () => {
      const results = [
        memoryStorage.readAll("key"),
        memoryStorage.read("key"),
        memoryStorage.readFor(USER_ID, "key"),
        memoryStorage.readAllFor(USER_ID, "key"),
        memoryStorage.writeAll("key", []),
        memoryStorage.deleteFor(USER_ID, "key"),
        memoryStorage.tagByDocumentNumber(USER_ID, "DOC-1", "journey"),
        memoryStorage.getKeysForTag("DOC-1"),
        memoryStorage.removeTag("DOC-1"),
        memoryStorage.getDocument("DOC-1"),
      ];

      results.forEach(result => expect(result).toBeInstanceOf(Promise));
      await Promise.all(results);
    });

    it("should resolve writeAll and deleteFor with undefined", async () => {
      await expect(memoryStorage.writeAll("key", [])).resolves.toBeUndefined();
      await expect(memoryStorage.deleteFor(USER_ID, "key")).resolves.toBeUndefined();
    });
  });

  describe("deleteFor", () => {
    test("should return blank after delete", async () => {
      const mockData = [
        {
          _marker: jest.fn(),
        },
      ];
      const mockKey = "a-key";

      await memoryStorage.writeAllFor(USER_ID, CONTACT_ID, mockKey, mockData);
      await memoryStorage.deleteFor(USER_ID, mockKey);
      const result = await memoryStorage.readAllFor(USER_ID,"a-simple-key");
      expect(result).toEqual([]);
    });
  });

});
