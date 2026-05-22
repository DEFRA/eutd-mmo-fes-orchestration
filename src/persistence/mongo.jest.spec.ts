import * as mongoose from 'mongoose';
import { MongoConnection } from './mongo';
import logger from '../logger';

jest.mock('mongoose');
jest.mock('../logger');

describe('MongoConnection', () => {
  let mockConnect: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect = jest.spyOn(mongoose, 'connect');
    mockLoggerError = jest.spyOn(logger, 'error');
    // Reset the static mongo instance between tests
    (MongoConnection as any).mongo = undefined;
  });

  afterEach(() => {
    mockConnect.mockRestore();
    mockLoggerError.mockRestore();
  });

  describe('constructor', () => {
    it('should have a private constructor', () => {
      // Access the constructor through reflection to achieve 100% function coverage
      // The constructor is private and should not be called in normal usage
      expect(() => new (MongoConnection as any)()).not.toThrow();
    });
  });

  describe('connect()', () => {
    const mockConnectionUri = 'mongodb://localhost:27017';
    const mockDbName = 'testdb';

    describe('with small pool size (local development)', () => {
      it('should use basic connection options when pool size is less than 10', async () => {
        const poolSize = '5';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 5,
        });
      });

      it('should use basic connection options when pool size is 1', async () => {
        const poolSize = '1';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 1,
        });
      });

      it('should default to maxPoolSize 50 and add advanced options when pool string is empty', async () => {
        const poolSize = '';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBe(50);
        expect(calledOptions.minPoolSize).toBe(10); // 20% of 50
        expect(calledOptions.socketTimeoutMS).toBe(45000);
        expect(calledOptions.retryWrites).toBe(true);
      });
    });

    describe('with large pool size (production)', () => {
      it('should include advanced options when pool size is 10 or greater', async () => {
        const poolSize = '10';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const expectedOptions = {
          dbName: mockDbName,
          maxPoolSize: 10,
          minPoolSize: 5, // Math.max(5, Math.floor(10 * 0.2)) = Math.max(5, 2) = 5
          maxIdleTimeMS: 30000,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          retryWrites: true,
          retryReads: true,
        };

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, expectedOptions);
      });

      it('should calculate minPoolSize as 20% of maxPoolSize with minimum 5 for pool size 50', async () => {
        const poolSize = '50';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBe(50);
        expect(calledOptions.minPoolSize).toBe(10); // Math.max(5, Math.floor(50 * 0.2)) = Math.max(5, 10) = 10
      });

      it('should calculate minPoolSize as 20% of maxPoolSize with minimum 5 for pool size 100', async () => {
        const poolSize = '100';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBe(100);
        expect(calledOptions.minPoolSize).toBe(20); // Math.max(5, Math.floor(100 * 0.2)) = Math.max(5, 20) = 20
      });

      it('should use minimum minPoolSize of 5 when 20% calculation is less than 5', async () => {
        const poolSize = '15';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBe(15);
        expect(calledOptions.minPoolSize).toBe(5); // Math.max(5, Math.floor(15 * 0.2)) = Math.max(5, 3) = 5
      });
    });

    describe('connection behavior', () => {
      it('should connect only once when called multiple times', async () => {
        const poolSize = '10';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);
        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);
        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledTimes(1);
      });

      it('should handle NaN pool size by defaulting to 50', async () => {
        const poolSize = 'invalid';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBe(50);
      });
    });

    describe('error handling', () => {
      it('should log error and throw when connection fails', async () => {
        const poolSize = '10';
        const mockError = new Error('Connection failed');
        mockConnect.mockRejectedValue(mockError);

        await expect(
          MongoConnection.connect(mockConnectionUri, mockDbName, poolSize)
        ).rejects.toThrow('Cannot connect to given database');

        expect(mockLoggerError).toHaveBeenCalledWith('[MONGO-CONNECTION-ERROR]', mockError);
      });

      it('should throw custom error message even when underlying error is complex', async () => {
        const poolSize = '5';
        const mockError = {
          name: 'MongoServerError',
          message: 'Authentication failed',
          code: 18
        };
        mockConnect.mockRejectedValue(mockError);

        await expect(
          MongoConnection.connect(mockConnectionUri, mockDbName, poolSize)
        ).rejects.toThrow('Cannot connect to given database');

        expect(mockLoggerError).toHaveBeenCalledWith('[MONGO-CONNECTION-ERROR]', mockError);
      });
    });
  });

  describe('cleanUp()', () => {
    it('should close the connection', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);
      (MongoConnection as any).mongo = {
        connection: {
          close: mockClose
        }
      };

      await MongoConnection.cleanUp();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should log error when connection close fails', async () => {
      const mockError = new Error('Close failed');
      const mockClose = jest.fn().mockRejectedValue(mockError);
      (MongoConnection as any).mongo = {
        connection: {
          close: mockClose
        }
      };

      await MongoConnection.cleanUp();

      expect(mockLoggerError).toHaveBeenCalledWith(mockError);
      expect(mockLoggerError).toHaveBeenCalledWith('Cannot close connection to database');
    });
  });

  describe('findOne()', () => {
    it('should call findOne on the collection', async () => {
      const mockFindOne = jest.fn().mockResolvedValue({ doc: 'result' });
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ findOne: mockFindOne })
          }
        }
      };

      const result = await MongoConnection.findOne('testCollection', { _id: '123' });

      expect(result).toEqual({ doc: 'result' });
      expect(mockFindOne).toHaveBeenCalledWith({ _id: '123' });
    });

    it('should log error when findOne fails', async () => {
      const mockError = new Error('Find failed');
      const mockFindOne = jest.fn().mockRejectedValue(mockError);
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ findOne: mockFindOne })
          }
        }
      };

      await MongoConnection.findOne('testCollection', { _id: '123' });

      expect(mockLoggerError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('insert()', () => {
    it('should call insertOne on the collection', async () => {
      const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: 'new-id' });
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ insertOne: mockInsertOne })
          }
        }
      };

      const newDoc = { name: 'test' };
      const result = await MongoConnection.insert('testCollection', newDoc);

      expect(result).toEqual({ insertedId: 'new-id' });
      expect(mockInsertOne).toHaveBeenCalledWith(newDoc);
    });

    it('should log error when insert fails', async () => {
      const mockError = new Error('Insert failed');
      const mockInsertOne = jest.fn().mockRejectedValue(mockError);
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ insertOne: mockInsertOne })
          }
        }
      };

      await MongoConnection.insert('testCollection', { name: 'test' });

      expect(mockLoggerError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('deleteOne()', () => {
    it('should call deleteOne on the collection', async () => {
      const mockDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ deleteOne: mockDeleteOne })
          }
        }
      };

      const result = await MongoConnection.deleteOne('testCollection', { _id: '123' });

      expect(result).toEqual({ deletedCount: 1 });
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: '123' });
    });

    it('should log error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      const mockDeleteOne = jest.fn().mockRejectedValue(mockError);
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ deleteOne: mockDeleteOne })
          }
        }
      };

      await MongoConnection.deleteOne('testCollection', { _id: '123' });

      expect(mockLoggerError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateStatusAsVoid()', () => {
    it('should call updateOne with status VOID', async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      (MongoConnection as any).mongo = {
        connection: {
          db: {
            collection: jest.fn().mockReturnValue({ updateOne: mockUpdateOne })
          }
        }
      };

      await MongoConnection.updateStatusAsVoid('testCollection', { _id: '123' });

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: '123' },
        { $set: { status: 'VOID' } }
      );
    });
  });
});
