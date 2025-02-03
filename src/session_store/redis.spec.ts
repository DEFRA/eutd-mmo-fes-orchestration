import { RedisStorage, getRedisOptions } from "./redis";
import { IStoreable } from "./storeable";
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  class Redis {
    del() {
      return null
    }

    get() {
      return JSON.stringify({test: 'test'})
    }

    set() {
      return null
    }

    disconnect() {

    }
  }

  return {
    default: Redis
  }
});

describe("redis", () => {

  const mockRedis = new Redis(getRedisOptions())

  const mockGet = jest.spyOn(mockRedis, 'get')
  const mockSet = jest.spyOn(mockRedis, 'set')
  const mockDel = jest.spyOn(mockRedis, 'del')

  let storage: RedisStorage<IStoreable>;

  const CONTACT_ID = 'contactBob';

  beforeEach(() => {

    storage = new RedisStorage(mockRedis);
    mockDel.mockResolvedValue(0)
  });

  afterEach(() => {
    storage.closeConnection();
    mockDel.mockReset();
    mockGet.mockReset();
    mockDel.mockReset();
  });

  describe('readFor', () => {

    it('will read from redis', async () => {
      const data = {test: 'test'};

      await storage.initialize(getRedisOptions());

      const result = await storage.readFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5');

      expect(result).toStrictEqual(data);
      expect(mockGet).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`);
    });

  });

  describe('deleteFor', () => {

    it('will delete any item stored against a user & document number', async () => {
      await storage.initialize(getRedisOptions());
      await storage.deleteFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5');

      expect(mockDel).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5');
    });

  });

  describe('writeFor', () => {

    it('will write data to redis', async () => {
      const data: any = {test: 'test'};

      await storage.initialize(getRedisOptions());
      await storage.writeFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockSet).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

  });

  describe('writeAllFor', () => {

    it('will write all data to redis', async () => {
      const data: any = {test: 'test'};

      await storage.initialize(getRedisOptions());
      await storage.writeAllFor('BOB', CONTACT_ID, 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockSet).toHaveBeenCalledWith(`${CONTACT_ID}:GBR-2020-CC-0E42C2DA5`, JSON.stringify(data));
    });

    it('will write all data to redis with no contact details', async () => {
      const data: any = {test: 'test'};

      await storage.initialize(getRedisOptions());
      await storage.writeAllFor('BOB', '', 'GBR-2020-CC-0E42C2DA5', data);

      expect(mockSet).toHaveBeenCalledWith('BOB:GBR-2020-CC-0E42C2DA5', JSON.stringify(data));
    });

  });

});
