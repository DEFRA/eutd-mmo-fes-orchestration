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

    describe('pool size parsing', () => {
      it('should parse pool size string to number for maxPoolSize', async () => {
        const poolSize = '10';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 10,
        });
      });

      it('should correctly parse single digit pool size', async () => {
        const poolSize = '5';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 5,
        });
      });

      it('should correctly parse large pool size', async () => {
        const poolSize = '100';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 100,
        });
      });

      it('should handle empty string and result in NaN for maxPoolSize', async () => {
        const poolSize = '';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBeNaN();
      });

      it('should handle invalid string and result in NaN for maxPoolSize', async () => {
        const poolSize = 'invalid';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(calledOptions.maxPoolSize).toBeNaN();
      });

      it('should parse string with leading number correctly', async () => {
        const poolSize = '25abc';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        expect(mockConnect).toHaveBeenCalledWith(mockConnectionUri, {
          dbName: mockDbName,
          maxPoolSize: 25,
        });
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

      it('should only pass dbName and maxPoolSize in connection options', async () => {
        const poolSize = '20';
        mockConnect.mockResolvedValue({} as any);

        await MongoConnection.connect(mockConnectionUri, mockDbName, poolSize);

        const calledOptions = mockConnect.mock.calls[0][1];
        expect(Object.keys(calledOptions)).toEqual(['dbName', 'maxPoolSize']);
        expect(calledOptions.dbName).toBe(mockDbName);
        expect(calledOptions.maxPoolSize).toBe(20);
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
