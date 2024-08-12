import SummaryErrorsService from './summaryErrors.service';
import * as Redis from '../../src/session_store/redis';
import { SessionStoreFactory } from '../session_store/factory';
import { SystemFailure, ValidationFailure } from '../persistence/schema/frontEndModels/payload';
import { SUMMARY_ERRORS_KEY, SYSTEM_ERROR_KEY } from '../session_store/constants';
import { SYSTEM_ERROR } from '../services/constants';

import logger from '../logger';
import { MockSessionStorage } from '../../test/session_store/mock';

describe('get', () => {

  const documentNumber = 'document123';
  const userPrincipal = 'Bob';
  const contactId = 'contactBob';

  let mockGetSessionStore;
  let mockSessionStore;

  beforeAll(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
  });

  beforeEach(() => {
    mockSessionStore = {
      read: jest.fn(),
      readAllFor: jest.fn().mockReturnValue(undefined)
    };

    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  it('will return error data based on the document number', async () => {
    mockSessionStore.read.mockResolvedValue({errors: ['error 1', 'error 2']});

    const result = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId);

    expect(result).toStrictEqual(['error 1', 'error 2']);
    expect(mockSessionStore.read).toHaveBeenCalledWith(`${SUMMARY_ERRORS_KEY}document123`);
  });

  it('will return null if there is no response', async () => {
    mockSessionStore.read.mockResolvedValue(null);

    const result = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId);
    expect(result).toBeNull();
  });

  it('will return null if there is no errors property', async () => {
    mockSessionStore.read.mockResolvedValue({});

    const result = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId);
    expect(result).toBeNull();
  });

  it('will return null if the error property is empty', async () => {
    mockSessionStore.read.mockResolvedValue({errors: []});

    const result = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId);
    expect(result).toBeNull();
  });

  it('will return error data including system errors', async () => {
    mockSessionStore.read.mockResolvedValue({errors: ['error 1', 'error 2']});
    mockSessionStore.readAllFor.mockResolvedValue({
      "document456": {
        "error": "SYSTEM_ERROR"
      }
    })

    const result = await SummaryErrorsService.get(userPrincipal, 'document456', contactId);
    expect(mockSessionStore.readAllFor).toHaveBeenCalledWith(userPrincipal, contactId, 'system-errors');
    expect(result).toStrictEqual(['error 1', 'error 2', { "error": "SYSTEM_ERROR" }]);
  });

  it('will return error data excluding any system errors', async () => {
    mockSessionStore.read.mockResolvedValue({errors: ['error 1', 'error 2']});
    mockSessionStore.readAllFor.mockResolvedValue({
      "document789": {
        "error": "SYSTEM_ERROR"
      }
    })

    const result = await SummaryErrorsService.get(userPrincipal, 'document456', contactId);
    expect(mockSessionStore.readAllFor).toHaveBeenCalledWith(userPrincipal, contactId, 'system-errors');
    expect(result).toStrictEqual(['error 1', 'error 2']);
  });

  it('will return only one system error', async () => {
    mockSessionStore.read.mockResolvedValue({errors: []});
    mockSessionStore.readAllFor.mockResolvedValue({
      "document789": {
        "error": "SYSTEM_ERROR"
      }
    })

    const result = await SummaryErrorsService.get(userPrincipal, 'document789', contactId);
    expect(mockSessionStore.readAllFor).toHaveBeenCalledWith(userPrincipal, contactId, 'system-errors');
    expect(result).toStrictEqual([{ "error": "SYSTEM_ERROR" }]);
  });

});

describe('get all system errors', () => {
  const mockSessionStore = new MockSessionStorage();
  let mockGetSessionStore;
  const mockReadAllFor = jest.fn();
  mockSessionStore.readAllFor = mockReadAllFor;
  const contactId = 'contactBob';

  beforeAll(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
  });

  beforeEach(() => {
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  it('will return a system error of all documents based on user', async () => {
    mockReadAllFor.mockResolvedValue({'GBR-2021-CC-46090A382': {'error': 'SYSTEM_ERROR'}});

    const result = await SummaryErrorsService.getAllSystemErrors('userPrincipal', contactId);

    expect(result).toStrictEqual([{"documentNumber": "GBR-2021-CC-46090A382", "error": "SYSTEM_ERROR"}]);
    expect(mockReadAllFor).toHaveBeenCalledWith('userPrincipal', contactId, 'system-errors');
  });

  it('will return all the system errors of all documents based on user', async () => {
    mockReadAllFor.mockResolvedValue({'GBR-2021-CC-46090A382': {'error': 'SYSTEM_ERROR'}, 'GBR-2021-CC-460901233': {'error': 'SYSTEM_ERROR'}});

    const result = await SummaryErrorsService.getAllSystemErrors('userPrincipal', contactId);

    expect(result).toStrictEqual([{"documentNumber": "GBR-2021-CC-46090A382", "error": "SYSTEM_ERROR"}, {"documentNumber": "GBR-2021-CC-460901233", "error": "SYSTEM_ERROR"}]);
    expect(mockReadAllFor).toHaveBeenCalledWith('userPrincipal', contactId, 'system-errors');
  });

  it('will return null if there is no response in the system errors', async () => {
    mockReadAllFor.mockResolvedValue({});

    const result = await SummaryErrorsService.getAllSystemErrors('userPrincipal', contactId);

    expect(result).toStrictEqual([]);
  });
});

describe('save errors to redis', () => {

  const sampleErrorList : ValidationFailure[] = [{
    "state": "ALI",
    "species": "LBE",
    "presentation": "WHL",
    "date": new Date("2020-11-23T00:00:00.000Z"),
    "vessel": "WIRON 5",
    "rules": [
      "noDataSubmitted"
    ]
  }];
  const documentNumber = 'aDocumentNumber';


  let mockGetSessionStore;
  const mockSessionStore = {
    writeAll: jest.fn()
  };

  beforeAll(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterAll(() => {
    mockGetSessionStore.mockRestore();
  });

  it('should call writeAll with the right parameters', async () => {
    const expectedPayload = {
      errors : sampleErrorList
    };
    await SummaryErrorsService.saveErrors(documentNumber, sampleErrorList);
    expect(mockSessionStore.writeAll).toHaveBeenCalledWith(`${SUMMARY_ERRORS_KEY}${documentNumber}`,expectedPayload);
  });

});

describe('save system errors to redis', () => {

  const userPrincipal = 'auserPrincipal';
  const contactId = 'contactBob';
  const documentNumber = 'aDocumentNumber';
  const systemError: SystemFailure = {
    error: SYSTEM_ERROR
  }

  const redisOptions = {
    option: 'some-options'
  }
  const mockSessionStore = {
    readAllFor: jest.fn().mockResolvedValue(undefined),
    writeAllFor: jest.fn().mockResolvedValue(undefined)
  };

  let mockGetSessionStore;
  let mockGetRedisOptions;
  let mockLogger;

  beforeEach(() => {
    mockLogger = jest.spyOn(logger, 'info');
    mockGetRedisOptions = jest.spyOn(Redis, 'getRedisOptions');
    mockGetRedisOptions.mockReturnValue(redisOptions);
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterEach(() => {
    mockGetSessionStore.mockRestore();
    mockGetRedisOptions.mockRestore();
    mockLogger.mockRestore();
  });

  it('should log info when saving system error', async () => {
    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId);
    expect(mockLogger).toHaveBeenNthCalledWith(1, '[CREATE-EXPORT-CERTIFICATE][aDocumentNumber][SAVE-SYSTEM-ERROR]');
    expect(mockLogger).toHaveBeenNthCalledWith(2, '[CREATE-EXPORT-CERTIFICATE][aDocumentNumber][SAVED-SYSTEM-ERROR]');
  });

  it('should read from session store', async () => {
    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId);

    expect(mockGetRedisOptions).toHaveBeenCalled();
    expect(mockGetSessionStore).toHaveBeenCalledWith(redisOptions);
  });

  it('should read all system errors for this user', async () => {
    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId);

    expect(mockSessionStore.readAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY);
  });

  it('should write new system errors for this user', async () => {
    const expected = {
      [documentNumber]: systemError
    };
    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId);

    expect(mockSessionStore.writeAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY, expected);
  });

  it('should add new system errors to pre-existing system errors for this user', async () => {
    const currentSystemError = {
      "GBR-2021-CC-6CD4A41A6": systemError
    }

    const mockExistingSystemErrorSessionStore = {
      readAllFor: jest.fn().mockResolvedValue(currentSystemError),
      writeAllFor: jest.fn().mockResolvedValue(undefined)
    }

    mockGetSessionStore.mockResolvedValue(mockExistingSystemErrorSessionStore);

    const expected = {
      [documentNumber]: systemError,
      "GBR-2021-CC-6CD4A41A6": {
        "error":"SYSTEM_ERROR"
      }
    };

    await SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId);

    expect(mockExistingSystemErrorSessionStore.writeAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY, expected);
  });

  it('should throw an error if any things goes wrong whilst talking with redis', async () => {
    const error: Error = new Error('something went wrong');

    mockGetSessionStore.mockRejectedValue(error);

    await expect(() => SummaryErrorsService.saveSystemError(userPrincipal, documentNumber, systemError, contactId))
      .rejects.toThrow('something went wrong');

    expect(mockLogger).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][aDocumentNumber][SAVE-SYSTEM-ERROR]');
    expect(mockLogger).toHaveBeenCalledTimes(1);
  });
});

describe('clear errors from redis', () => {
  const documentNumber = 'my doc number';
  const redisErrorKey = `${SUMMARY_ERRORS_KEY}${documentNumber}`;

  let mockLogger;
  let mockGetSessionStore;

  const mockSessionStore = {
    removeTag: jest.fn()
  };

  beforeAll(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
    mockLogger = jest.spyOn(logger, 'info');
    mockLogger.mockReturnValue(null);
  });

  afterAll(() => {
    mockGetSessionStore.mockRestore();
  });

  it('should call redis api with the right argument', async () => {
    await SummaryErrorsService.clearErrors(documentNumber);
    expect(mockSessionStore.removeTag).toHaveBeenCalledWith(redisErrorKey);
  });

  it('should log that remove tag is executed', async () => {
    await SummaryErrorsService.clearErrors(documentNumber);
    expect(mockLogger).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SUMMARY-ERRORS][CLEAR-ERRORS]`);
  });
});

describe('clear system errors from redis', () => {

  const userPrincipal = 'auserPrincipal';
  const contactId = 'contactBob';
  const documentNumber = 'aDocumentNumber';
  const systemError: SystemFailure = {
    error: SYSTEM_ERROR
  }

  const redisOptions = {
    option: 'some-options'
  }
  const mockSessionStore = {
    readAllFor: jest.fn().mockResolvedValue({
      [documentNumber]: systemError
    }),
    writeAllFor: jest.fn().mockResolvedValue(undefined)
  };

  let mockGetSessionStore;
  let mockGetRedisOptions;
  let mockLogger;

  beforeEach(() => {
    mockLogger = jest.spyOn(logger, 'info');
    mockGetRedisOptions = jest.spyOn(Redis, 'getRedisOptions');
    mockGetRedisOptions.mockReturnValue(redisOptions);
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterEach(() => {
    mockGetSessionStore.mockRestore();
    mockGetRedisOptions.mockRestore();
    mockLogger.mockRestore();
  });

  it('should log info when clearing a system error', async () => {
    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockLogger).toHaveBeenNthCalledWith(1, '[CLEAR-SYSTEM-ERROR][aDocumentNumber]');
    expect(mockLogger).toHaveBeenNthCalledWith(2, '[CLEAR-SYSTEM-ERROR][aDocumentNumber][SUCCESS]');
  });

  it('should read from session store', async () => {
    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockGetRedisOptions).toHaveBeenCalled();
    expect(mockGetSessionStore).toHaveBeenCalledWith(redisOptions);
  });

  it('should read all system errors for this user', async () => {
    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockSessionStore.readAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY);
  });

  it('should write new system errors for this user', async () => {
    const expected = {};
    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockSessionStore.writeAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY, expected);
  });

  it('should remove system errors for given document number and keep pre-existing system errors for this user', async () => {
    const currentSystemError = {
      [documentNumber]: systemError,
      "GBR-2021-CC-6CD4A41A6": systemError
    }

    const mockExistingSystemErrorSessionStore = {
      readAllFor: jest.fn().mockResolvedValue(currentSystemError),
      writeAllFor: jest.fn().mockResolvedValue(undefined)
    }

    mockGetSessionStore.mockResolvedValue(mockExistingSystemErrorSessionStore);

    const expected = {
      "GBR-2021-CC-6CD4A41A6": systemError
    };

    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockExistingSystemErrorSessionStore.writeAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY, expected);
  });

  it('should remove system errors for given document number', async () => {
    const expected = {};
    const mockNoSystemErrorSessionStore = {
      readAllFor: jest.fn().mockResolvedValue(undefined),
      writeAllFor: jest.fn().mockResolvedValue(undefined)
    }

    mockGetSessionStore.mockResolvedValue(mockNoSystemErrorSessionStore);

    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    expect(mockNoSystemErrorSessionStore.writeAllFor).toHaveBeenCalledWith(userPrincipal, contactId, SYSTEM_ERROR_KEY, expected);
  });

  it('should throw an error if any things goes wrong whilst talking with redis', async () => {
    const error: Error = new Error('something went wrong');

    mockGetSessionStore.mockRejectedValue(error);

    await expect(() => SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId))
      .rejects.toThrow('something went wrong');

    expect(mockLogger).toHaveBeenCalledWith('[CLEAR-SYSTEM-ERROR][aDocumentNumber]');
    expect(mockLogger).toHaveBeenCalledTimes(1);
  });
});