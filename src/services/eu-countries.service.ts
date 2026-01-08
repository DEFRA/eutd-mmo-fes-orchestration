import ApplicationConfig from '../applicationConfig';
import axios from 'axios';
import logger from '../logger';

let cached: string[] | null = null;

const loadFromReference = async (): Promise<string[]> => {
  try {
    const refUrl = ApplicationConfig.getReferenceServiceUrl();
    const url = `${refUrl}/v1/eu-member-states`;
    const res = await axios.get(url);
    const parsed = res?.data;
    if (Array.isArray(parsed)) {
      const mapped = parsed
        .map((c: any) => {
          const raw = (typeof c === 'string') ? c :'';
          return raw ? raw.toString().trim().toUpperCase() : '';
        })
        .filter((s: string) => s && s.length > 0);

      // dedupe while preserving insertion order
      return Array.from(new Set(mapped));
    }
    return [];
  } catch (e) {
    logger.error(`[EU-COUNTRIES][LOAD-ERROR][${e?.stack || e}]`);
    return [];
  }
};

export const getEuCountries = async (): Promise<string[]> => {
  if (cached) return cached;
  cached = await loadFromReference();
  return cached;
};

export const isEuCountry = async (country: any): Promise<boolean> => {
  if (!country) return false;
  const countries = await getEuCountries();
  if (!countries || countries.length === 0) return false;

  const name = (typeof country === 'string') ? country : country?.officialCountryName;
  if (!name) return false;

  return countries.includes(name.toUpperCase());
};

export default { getEuCountries, isEuCountry };

// Test helper to reset in-memory cache between tests
export const clearCache = () => { cached = null; };

