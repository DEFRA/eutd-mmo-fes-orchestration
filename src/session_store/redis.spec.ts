import { createClient } from 'redis';

import { RedisStorage } from "./redis";
import { buildRedisConnectionUrl } from './redisConnectionConfig';
import { IStoreable } from "./storeable";
import { CATCH_CERTIFICATE_KEY } from './constants';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

type MockRedisClient = {
  connect: jest.MockedFunction<() => Promise<void>>;
  del: jest.MockedFunction<any>;
  destroy: jest.MockedFunction<() => void>;
  get: jest.MockedFunction<any>;
  isOpen: boolean;
  on: jest.MockedFunction<any>;
  sAdd: jest.MockedFunction<any>;
  set: jest.MockedFunction<any>;
  sMembers: jest.MockedFunction<any>;
};

describe("RedisStorage", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  const mockRedis = {
    connect: jest.fn().mockResolvedValue(undefined),
    del: jest.fn(),
    destroy: jest.fn(),
    get: jest.fn(),
    isOpen: true,
    on: jest.fn(),
    sAdd: jest.fn(),
    set: jest.fn(),
    sMembers: jest.fn(),
  } as unknown as MockRedisClient;

  let storage: RedisStorage<IStoreable>;

  const CONTACT_ID = 'contactBob';

  beforeEach(() => {
    mockRedis.on.mockReturnThis();
    mockCreateClient.mockReturnValue(mockRedis as unknown as ReturnType<typeof createClient>);
    storage = new RedisStorage(mockRedis as unknown as ReturnType<typeof createClient>);
    mockRedis.del.mockResolvedValue(0);
  });

  afterEach(() => {
    storage.closeConnection();
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should create a new Redis connection if one does not exist', async () => {
      await new RedisStorage().initialize({ blah: true });
      expect(mockCreateClient).toHaveBeenCalledWith({ blah: true });
      expect(mockRedis.connect).toHaveBeenCalled();
    });

    it('should warn when attempting to start connection again if connection exists', async () => {
      const mockLogger = require('../logger').default;
      const spyWarn = jest.spyOn(mockLogger, 'warn').mockImplementation(() => {});

      // storage was constructed with mockRedis so initialize should attempt to start connection again
      await storage.initialize({ host: 'localhost' } as any);

      expect(spyWarn).toHaveBeenCalledWith('Attempt to start redis connection again!');
    });

    it('should log the redis host when a url is provided', async () => {
      const mockLogger = require('../logger').default;
      const spyInfo = jest.spyOn(mockLogger, 'info').mockImplementation(() => {});

      await new RedisStorage().initialize({ url: 'redis://myhost:6379' });

      expect(spyInfo).toHaveBeenCalledWith('Attempt to initialize redis cache connection to', 'myhost:6379');
    });
  });

  describe('cleanup', () => {
    it('should close the Redis connection', () => {
      storage.cleanUp();
      expect(mockRedis.destroy).toHaveBeenCalled();
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

    it('returns null when the key does not exist in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await storage.readAll('missing-key');

      expect(result).toBeNull();
    });

    it('handles a Buffer response from Redis', async () => {
      mockRedis.get.mockResolvedValue(Buffer.from('[{"one":1}]'));

      const result = await storage.readAll('buf-key');

      expect(result).toEqual([{one:1}]);
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

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), { EX: 120 });
    });
  });

  describe('tagByDocumentNumber', () => {
    it('should add keys for the journey to the document tag set', async () => {
      const constants = require('./constants');
      await storage.tagByDocumentNumber('BOB', CONTACT_ID, 'doc-123', constants.CATCH_CERTIFICATE_KEY);

      expect(mockRedis.sAdd).toHaveBeenCalled();
      const call = (mockRedis.sAdd as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('doc-123');
    });

    it('uses userPrincipal when contactId is null', async () => {
      (mockRedis.sAdd as jest.Mock).mockClear();

      await storage.tagByDocumentNumber('BOB', null as any, 'DOC-888', CATCH_CERTIFICATE_KEY);

      const call = (mockRedis.sAdd as jest.Mock).mock.calls[0];
      expect(call[1]).toContain('BOB:catchCertificate');
    });
  });

  describe('writeFor', () => {

    it('should write data to Redis', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

    it('should write data with no contactId and no TTL', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockRedis.set).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data));
    });

  });

  describe('writeFor with TTL', () => {
    it('should write data to Redis with EX when ttlSeconds provided and contactId present', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data, 10);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), { EX: 10 });
    });

    it('should write data to Redis with EX when ttlSeconds provided and contactId missing', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data, 20);

      expect(mockRedis.set).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data), { EX: 20 });
    });
  });

  describe('tagByDocumentNumber - 1', () => {
    it('should call sadd with expected keys for catch certificate journey', () => {
      (mockRedis.sAdd as jest.Mock).mockClear();

      storage.tagByDocumentNumber('BOB', CONTACT_ID, 'DOC-999', CATCH_CERTIFICATE_KEY);

      expect(mockRedis.sAdd).toHaveBeenCalledWith('DOC-999', [
        `${CONTACT_ID}:catchCertificate`,
        `${CONTACT_ID}:species`,
        `${CONTACT_ID}:catches`,
        `${CONTACT_ID}:catchCertificate/exporter`,
        `${CONTACT_ID}:conservation`,
        `${CONTACT_ID}:catchCertificate/export-payload`
      ]);
    });

    it('should call sadd with no keys for unknown journey', () => {
      (mockRedis.sAdd as jest.Mock).mockClear();

      storage.tagByDocumentNumber('BOB', CONTACT_ID, 'DOC-999', 'unknownJourney');

      expect(mockRedis.sAdd).not.toHaveBeenCalled();
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

    it('should write all data with no contactId and TTL', async () => {
      const data: any[] = [{ one: 1 }];

      await storage.writeAllFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data, 60);

      expect(mockRedis.set).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data), { EX: 60 });
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
      mockRedis.sMembers.mockResolvedValue(['12345', 'abcde'])
      const keys = await storage.getKeysForTag('abcde');

      expect(keys).toEqual(['12345','abcde']);
    });

    it('handles Buffer members returned by sMembers', async () => {
      mockRedis.sMembers.mockResolvedValue([Buffer.from('k1'), 'k2']);
      const keys = await storage.getKeysForTag('doc-buf');

      expect(keys).toEqual(['k1', 'k2']);
    });
  });

  describe('getDocument', () => {

    it('should return document from Redis when key exists', async () => {
      mockRedis.sMembers.mockResolvedValueOnce(["BOB:GBR-2020-CC-0E42C2DA5"]);
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
      mockRedis.sMembers.mockResolvedValueOnce([]);
      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toBeNull();
    });

    it('should handle keys that do not contain the delimiter', async () => {
      mockRedis.sMembers.mockResolvedValueOnce(["BOBINVALIDKEY"]);
      mockRedis.get.mockResolvedValueOnce('{"id":"12345"}');

      const doc = await storage.getDocument('GBR-2020-CC-0E42C2DA5');

      expect(doc).toEqual({ documentNumber: 'GBR-2020-CC-0E42C2DA5' });
      const mockLogger = require('../logger').default;
      expect(typeof mockLogger.warn).toBe('function');
    });

    it('should set userPrincipal even when stored json is falsy', async () => {
      mockRedis.sMembers.mockResolvedValueOnce(["BOB:GBR-2020-CC-0E42C2DA5"]);
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

  describe('writeFor with TTL - 1', () => {
    it('should write data with expiry when ttlSeconds provided', async () => {
      const data: any = {test: 'test'};

      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data, 60);

      expect(mockRedis.set).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data), { EX: 60 });
    });
  });

  describe('buildRedisConnectionUrl', () => {
    it('uses the connection string when TLS is disabled', () => {
      const url = buildRedisConnectionUrl({
        connectionString: 'redis://:secret@localhost:6379',
        hostName: 'managed.redis.azure.net',
        port: '10000',
        tlsEnabled: 'false',
      });

      expect(url).toBe('redis://:secret@localhost:6379');
    });

    it('overrides the host and port when TLS is enabled', () => {
      const url = buildRedisConnectionUrl({
        connectionString: 'redis://:secret@localhost:6379',
        hostName: 'managed.redis.azure.net',
        port: '10000',
        tlsEnabled: 'true',
      });

      expect(url).toBe('rediss://:secret@managed.redis.azure.net:10000');
    });

    it('treats boolean true as TLS enabled', () => {
      const url = buildRedisConnectionUrl({
        connectionString: 'redis://:secret@localhost:6379',
        hostName: 'managed.redis.azure.net',
        port: '10000',
        tlsEnabled: true,
      });

      expect(url).toBe('rediss://:secret@managed.redis.azure.net:10000');
    });

    it('treats boolean false as TLS disabled', () => {
      const url = buildRedisConnectionUrl({
        connectionString: 'redis://:secret@localhost:6379',
        hostName: 'managed.redis.azure.net',
        port: '10000',
        tlsEnabled: false,
      });

      expect(url).toBe('redis://:secret@localhost:6379');
    });

    it('builds a URL from host and port when no connection string is provided', () => {
      const url = buildRedisConnectionUrl({
        hostName: 'myhost',
        port: '6379',
        tlsEnabled: null,
      });

      expect(url).toBe('redis://myhost:6379');
    });
  });

  describe('getRedisOptions', () => {
    const ApplicationConfig = require('../applicationConfig').default;
    const originalConnectionString = ApplicationConfig._redisConnectionString;
    const originalHost = ApplicationConfig._redisHostName;
    const originalPort = ApplicationConfig._redisPort;
    const originalTlsEnabled = ApplicationConfig._redisTlsEnabled;

    afterEach(() => {
      ApplicationConfig._redisConnectionString = originalConnectionString;
      ApplicationConfig._redisHostName = originalHost;
      ApplicationConfig._redisPort = originalPort;
      ApplicationConfig._redisTlsEnabled = originalTlsEnabled;
    });

    it('returns options with tls when enabled', () => {
      ApplicationConfig._redisConnectionString = 'redis://:secret@localhost:6379';
      ApplicationConfig._redisHostName = 'host1';
      ApplicationConfig._redisPort = 1234 as any;
      ApplicationConfig._redisTlsEnabled = 'true';

      const opts = require('./redis').getRedisOptions();

      expect(opts.url).toBe('rediss://:secret@host1:1234');
    });

    it('returns options without tls when disabled', () => {
      ApplicationConfig._redisConnectionString = 'redis://:secret@host2:2222';
      ApplicationConfig._redisHostName = 'host2';
      ApplicationConfig._redisPort = 2222 as any;
      ApplicationConfig._redisTlsEnabled = 'false';

      const opts = require('./redis').getRedisOptions();

      expect(opts.url).toBe('redis://:secret@host2:2222');
    });
  });

});

