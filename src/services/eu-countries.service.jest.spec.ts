import axios from 'axios';
import logger from '../logger';
import * as EuCountries from './eu-countries.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('eu-countries.service', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    EuCountries.clearCache();
  });

  it('returns upper-cased deduped country list and caches result', async () => {
    const payload = [
      'Austria',
      'Belgium',
      'Spain',
      'Spain',
      '  spain  '
    ];

    mockedAxios.get.mockResolvedValue({ data: payload });

    const first = await EuCountries.getEuCountries();
    expect(first).toEqual(['AUSTRIA', 'BELGIUM', 'SPAIN']);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const second = await EuCountries.getEuCountries();
    expect(second).toBe(first);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('isEuCountry returns true for string and object inputs (case-insensitive)', async () => {
    const payload = ['Spain', 'France'];
    mockedAxios.get.mockResolvedValue({ data: payload });

    const ok1 = await EuCountries.isEuCountry('Spain');
    expect(ok1).toBe(true);

    const ok2 = await EuCountries.isEuCountry({ officialCountryName: 'france' });
    expect(ok2).toBe(true);

    const no = await EuCountries.isEuCountry('NotACountry');
    expect(no).toBe(false);
  });

  it('handles non-array responses gracefully', async () => {
    mockedAxios.get.mockResolvedValue({ data: null });
    const list = await EuCountries.getEuCountries();
    expect(list).toEqual([]);

    const ok = await EuCountries.isEuCountry('Spain');
    expect(ok).toBe(false);
  });

  it('logs and returns empty array when axios throws', async () => {
    const err = new Error('boom');
    mockedAxios.get.mockRejectedValue(err);
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    const list = await EuCountries.getEuCountries();
    expect(list).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('maps non-string array items to empty and trims raw strings', async () => {
    mockedAxios.get.mockResolvedValue({ data: [' spain ', 123, null, 'FRANCE'] } as any);
    const list = await EuCountries.getEuCountries();
    expect(list).toEqual(['SPAIN', 'FRANCE']);
  });

  it('isEuCountry returns false for object without officialCountryName', async () => {
    mockedAxios.get.mockResolvedValue({ data: ['SPAIN'] } as any);
    const ok = await EuCountries.isEuCountry({ someProp: 'x' } as any);
    expect(ok).toBe(false);
  });
});
