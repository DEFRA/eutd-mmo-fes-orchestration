const mockRedisInitialize = jest.fn().mockResolvedValue(undefined);
const mockMemoryInitialize = jest.fn().mockResolvedValue(undefined);

jest.mock('./redis', () => ({
  RedisStorage: jest.fn().mockImplementation(() => ({
    initialize: mockRedisInitialize
  }))
}));

jest.mock('./memory', () => ({
  MemoryStorage: jest.fn().mockImplementation(() => ({
    store: {},
    initialize: mockMemoryInitialize
  }))
}));

import { SessionStoreFactory } from "./factory";
import { RedisStorage } from './redis';
import { MemoryStorage } from './memory';

describe("SessionStoreFactory", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    (SessionStoreFactory as any).sessionStore = undefined;
    mockRedisInitialize.mockClear();
    mockMemoryInitialize.mockClear();
    (RedisStorage as unknown as jest.Mock).mockClear();
    (MemoryStorage as unknown as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("getSessionStore()", () => {
    it("should initialize MemoryStorage in test environment", async () => {
      process.env.NODE_ENV = 'test';

      const result = await SessionStoreFactory.getSessionStore(null);

      expect(MemoryStorage).toHaveBeenCalledTimes(1);
      expect(mockMemoryInitialize).toHaveBeenCalledWith();
      expect(result).toEqual({ store: {}, initialize: mockMemoryInitialize });
    });

    it("should initialize RedisStorage with options outside test environment", async () => {
      process.env.NODE_ENV = 'development';
      const options = { host: 'localhost', port: 6379 };

      await SessionStoreFactory.getSessionStore(options);

      expect(RedisStorage).toHaveBeenCalledTimes(1);
      expect(mockRedisInitialize).toHaveBeenCalledWith(options);
    });

    it("should not reinitialize when session store already exists", async () => {
      process.env.NODE_ENV = 'development';
      const options = { host: 'localhost', port: 6379 };

      await SessionStoreFactory.getSessionStore(options);
      await SessionStoreFactory.getSessionStore({ host: 'otherhost', port: 6380 });

      expect(RedisStorage).toHaveBeenCalledTimes(1);
      expect(mockRedisInitialize).toHaveBeenCalledTimes(1);
    });
  });
});
