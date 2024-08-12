import axios from 'axios';
import * as SUT from './landings-consolidate.service';
import logger from '../logger';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const documentNumber = 'test-document-number';

describe('update and void ConsolidateLandings', () => {
  let mockLogerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockLoggerError = jest.spyOn(logger, 'error');
    mockLogerInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockLogerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data for update ConsolidateLandings', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);

    await SUT.updateConsolidateLandings(documentNumber, mockedAxios);
    expect(mockLogerInfo).toHaveBeenCalledWith(
      '[LANDING-CONSOLIDATION][UPDATING-FOR][DOCUMENT][test-document-number]',
    );
    expect(axios.post).toHaveBeenCalledWith('/v1/jobs/update', { documentNumber });
  });

  it('should log and rethrow any errors for updateConsolidateLandings', async () => {
    const error = new Error('something bad has happened');

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.updateConsolidateLandings(documentNumber, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(`[UPDATE-CONSOILDATE-LANDINGS][ERROR][${error}]`);
  });

  it('returns response data for voidConsolidateLandings', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);

    await SUT.voidConsolidateLandings(documentNumber, mockedAxios);
    expect(mockLogerInfo).toHaveBeenCalledWith(
      '[LANDING-CONSOLIDATION][VOIDING-FOR][DOCUMENT][test-document-number]',
    );
    expect(axios.post).toHaveBeenCalledWith('/v1/jobs/void', { documentNumber });
  });

  it('should log and rethrow any errors for voidConsolidateLandings', async () => {
    const error = new Error('something bad has happened');

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.voidConsolidateLandings(documentNumber, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(`[VOID-CONSOILDATE-LANDINGS][ERROR][${error}]`);
  });

});


