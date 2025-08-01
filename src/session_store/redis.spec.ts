import { RedisStorage, getRedisOptions } from "./redis";
import { IStoreable } from "./storeable";
import Redis from 'ioredis';

jest.mock('ioredis', () => ({
  default: jest.fn(() => ({
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    disconnect: jest.fn(),
    smembers: jest.fn(),
  }))
}));

describe("RedisStorage", () => {

  const mockRedis = new Redis(getRedisOptions()) as jest.Mocked<Redis>;
  let storage: RedisStorage<IStoreable>;

  const CONTACT_ID = 'contactBob';

  beforeEach(() => {
    storage = new RedisStorage(mockRedis);
    mockRedis.del.mockResolvedValue(0);
  });

  afterEach(() => {
    storage.closeConnection();
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should create a new Redis connection if one does not exist', async () => {
      await new RedisStorage().initialize({ blah: true });
      expect(Redis).toHaveBeenCalledWith({ blah: true });
    });
  });

  describe('cleanup', () => {
    it('should close the Redis connection', () => {
      storage.cleanUp();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('should read data from Redis and parse the response', async () => {
      const data = {test: 'test'};

      mockRedis.get.mockResolvedValue('{"test":"test"}');

      const result = await storage.read('a:b');

      expect(result).toStrictEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('a:b');
    });
  });

  describe('readAll', () => {
    it('reads array data from Redis and parses the response', async () => {
      mockRedis.get.mockResolvedValue('[{"one":1},{"two":2}]');

      const result = await storage.readAll('blah');

      expect(result).toEqual([{one:1},{two:2}]);
    });
  });

  describe('readFor', () => {

    it('should read from Redis and parse the response', async () => {
      const data = {test: 'test'};

      mockRedis.get.mockResolvedValue('{"test":"test"}');

      const result = await storage.readFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5');

      expect(result).toStrictEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`);
    });

  });

  describe('readAllFor', () => {
    it('should read array data from Redis for contact ID', async () => {
      mockRedis.get.mockResolvedValue('[{"one":1},{"two":2}]');

      const result = await storage.readAllFor('user', '12345', 'abcde');

      expect(mockRedis.get).toHaveBeenCalledWith('12345:abcde');
      expect(result).toEqual([{one:1},{two:2}]);
    });

    it('should read array data from Redis for principal name when contact ID is missing', async () => {
      mockRedis.get.mockResolvedValue('[{"one":1},{"two":2}]');

      const result = await storage.readAllFor('user', '', 'abcde');

      expect(mockRedis.get).toHaveBeenCalledWith('user:abcde');
      expect(result).toEqual([{one:1},{two:2}]);
    });


    it('should read array data from Redis for principal name when contact ID yields no results', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.get.mockResolvedValue('[{"one":1},{"two":2}]');

      const result = await storage.readAllFor('user', '12345', 'abcde');

      expect(mockRedis.get).toHaveBeenNthCalledWith(1, '12345:abcde');
      expect(mockRedis.get).toHaveBeenNthCalledWith(2, 'user:abcde');
      expect(result).toEqual([{one:1},{two:2}]);
    });
  });

  describe('deleteFor', () => {

    it('should delete any item stored against a user & document number', async () => {
      await storage.deleteFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5');

      expect(mockRedis.del).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5');
    });

  });

  describe('writeFor', () => {

    it('should write data to Redis', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

  });

  describe('writeAll', () => {
    it('should write array data to Redis as JSON', async () => {
      await storage.writeAll('12345', [{ one: 1 } as any, { two: 2}]);
      expect(mockRedis.set).toHaveBeenCalledWith('12345', '[{"one":1},{"two":2}]')
    });
  });

  describe('writeAllFor', () => {

    it('should write all data to Redis', async () => {
      const data: any = {test: 'test'};

      await storage.writeAllFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

    it('should write all data to Redis with no contact details', async () => {
      const data: any = {test: 'test'};

      await storage.writeAllFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data));
    });

  });

  describe('removeTag', () => {
    it('deletes key from Redis', () => {
      storage.removeTag('abcde');

      expect(mockRedis.del).toHaveBeenCalledWith('abcde');
    });
  });

  describe('keysForTag', () => {
    it('retrieves keys from Redis', async () => {
      mockRedis.smembers.mockResolvedValue(['12345', 'abcde'])
      const keys = await storage.getKeysForTag('abcde');

      expect(keys).toEqual(['12345','abcde']);
    });
  });

  describe('getDocument', () => {

    it('should return document from Redis when key exists', async () => {
      mockRedis.smembers.mockResolvedValueOnce(["BOB:GBR-2020-CC-0E42C2DA5"]);
      mockRedis.get.mockResolvedValueOnce('{"id":"12345"}')
      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toEqual({
        "GBR-2020-CC-0E42C2DA5": {
          id: "12345"
        },
        documentNumber: "GBR-2020-CC-0E42C2DA5",
        userPrincipal: "BOB",
      });
    });

    it('should return null from Redis when key does not exist', async () => {
      mockRedis.smembers.mockResolvedValueOnce([]);
      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toBeNull();
    });

  });

});
