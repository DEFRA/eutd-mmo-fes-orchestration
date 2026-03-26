import { RedisStorage, getRedisOptions } from "./redis";
import { IStoreable } from "./storeable";
import Redis from 'ioredis';
import { CATCH_CERTIFICATE_KEY } from './constants';

jest.mock('ioredis', () => ({
  default: jest.fn(() => ({
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    sadd: jest.fn(),
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

    it('should warn when attempting to start connection again if connection exists', async () => {
      const mockLogger = require('../logger').default;
      const spyWarn = jest.spyOn(mockLogger, 'warn').mockImplementation(() => {});

      // storage was constructed with mockRedis so initialize should attempt to start connection again
      await storage.initialize({ host: 'localhost' } as any);

      expect(spyWarn).toHaveBeenCalledWith('Attempt to start redis connection again!');
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

  describe('deleteFor - contact and user', () => {
    it('deletes both contact and user keys when contactId present', async () => {
      mockRedis.del.mockResolvedValue(1 as any);
      await storage.deleteFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5');

      expect(mockRedis.del).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`);
      expect(mockRedis.del).toHaveBeenCalledWith(`BOB:GBR-2020-CC-0E42C2DA5`);
    });
  });

  describe('writeAllFor with TTL', () => {
    it('should write array data to Redis with expiry when ttlSeconds provided', async () => {
      const data: any[] = [{ one: 1 } as any, { two: 2 }];

      await storage.writeAllFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data, 120);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), 'EX', 120);
    });
  });

  describe('tagByDocumentNumber', () => {
    it('should add keys for the journey to the document tag set', async () => {
      const constants = require('./constants');
      await storage.tagByDocumentNumber('BOB', CONTACT_ID, 'doc-123', constants.CATCH_CERTIFICATE_KEY);

      expect(mockRedis.sadd).toHaveBeenCalled();
      const call = (mockRedis.sadd as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('doc-123');
    });
  });

  describe('writeFor', () => {

    it('should write data to Redis', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

  });

  describe('writeFor with TTL', () => {
    it('should write data to Redis with EX when ttlSeconds provided and contactId present', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data, 10);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), 'EX', 10);
    });

    it('should write data to Redis with EX when ttlSeconds provided and contactId missing', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data, 20);

      expect(mockRedis.set).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data), 'EX', 20);
    });
  });

  describe('tagByDocumentNumber', () => {
    it('should call sadd with expected keys for catch certificate journey', () => {
      // ensure mock has sadd
      (mockRedis as any).sadd = jest.fn();

      storage.tagByDocumentNumber('BOB', CONTACT_ID, 'DOC-999', CATCH_CERTIFICATE_KEY);

      // current implementation calls sadd with the documentNumber even when keys are empty
      expect((mockRedis as any).sadd).toHaveBeenCalledWith('DOC-999');
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

    it('should handle keys that do not contain the delimiter', async () => {
      mockRedis.smembers.mockResolvedValueOnce(["BOBINVALIDKEY"]);
      mockRedis.get.mockResolvedValueOnce('{"id":"12345"}');

      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toEqual({ documentNumber: 'GBR-2020-CC-0E42C2DA5' });
      const mockLogger = require('../logger').default;
      expect(typeof mockLogger.warn).toBe('function');
    });

    it('should set userPrincipal even when stored json is falsy', async () => {
      mockRedis.smembers.mockResolvedValueOnce(["BOB:GBR-2020-CC-0E42C2DA5"]);
      mockRedis.get.mockResolvedValueOnce(null as any);
      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toEqual({ documentNumber: 'GBR-2020-CC-0E42C2DA5', userPrincipal: 'BOB' });
    });

  });

  describe('readFor fallback', () => {
    it('falls back to userPrincipal when contactId returns no data', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.get.mockResolvedValueOnce('{"test":"test"}');

      const result = await storage.readFor('user', 'contact', 'key');

      expect(mockRedis.get).toHaveBeenNthCalledWith(1, 'contact:key');
      expect(mockRedis.get).toHaveBeenNthCalledWith(2, 'user:key');
      expect(result).toStrictEqual({ test: 'test' });
    });
  });

  describe('writeFor with TTL', () => {
    it('should write data with expiry when ttlSeconds provided', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data, 60);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), 'EX', 60);
    });
  });

  describe('getRedisOptions', () => {
    const ApplicationConfig = require('../applicationConfig').default;
    const originalHost = ApplicationConfig._redisHostName;
    const originalPort = ApplicationConfig._redisPort;
    const originalPassword = ApplicationConfig._redisPassword;
    const originalTlsEnabled = ApplicationConfig._redisTlsEnabled;
    const originalTlsHost = ApplicationConfig._redisTlsHostName;

    afterEach(() => {
      ApplicationConfig._redisHostName = originalHost;
      ApplicationConfig._redisPort = originalPort;
      ApplicationConfig._redisPassword = originalPassword;
      ApplicationConfig._redisTlsEnabled = originalTlsEnabled;
      ApplicationConfig._redisTlsHostName = originalTlsHost;
    });

    it('returns options with tls when enabled', () => {
      ApplicationConfig._redisHostName = 'host1';
      ApplicationConfig._redisPort = 1234 as any;
      ApplicationConfig._redisPassword = 'pwd';
      ApplicationConfig._redisTlsEnabled = 'true';
      ApplicationConfig._redisTlsHostName = 'tls-host';

      const opts = require('./redis').getRedisOptions();

      expect(opts.host).toBe('host1');
      expect(opts.port).toBe(1234);
      expect(opts.password).toBe('pwd');
      expect(opts.tls).toBeDefined();
      expect(opts.tls.host).toBe('tls-host');
    });

    it('returns options without tls when disabled', () => {
      ApplicationConfig._redisHostName = 'host2';
      ApplicationConfig._redisPort = 2222 as any;
      ApplicationConfig._redisPassword = undefined as any;
      ApplicationConfig._redisTlsEnabled = 'false';

      const opts = require('./redis').getRedisOptions();

      expect(opts.host).toBe('host2');
      expect(opts.port).toBe(2222);
      expect(opts.password).toBeUndefined();
      expect(opts.tls).toBeUndefined();
    });
  });

});

