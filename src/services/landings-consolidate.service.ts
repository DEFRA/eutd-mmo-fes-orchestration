import axios, { AxiosInstance } from 'axios';
import ApplicationConfig from '../applicationConfig';
import logger from '../logger';

export const updateConsolidateLandings = async (documentNumber: string, httpClient?: AxiosInstance): Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getConsolidationServiceUrl();
    logger.info(`[LANDING-CONSOLIDATION][UPDATING-FOR][DOCUMENT][${documentNumber}]`);
    const client: AxiosInstance = httpClient ?? axios.create({ baseURL: baseUrl });
    await client.post('/v1/jobs/update', { documentNumber });
  } catch (e) {
    logger.error(`[UPDATE-CONSOILDATE-LANDINGS][ERROR][${e}]`);
    throw e;
  }
};

export const voidConsolidateLandings = async (documentNumber: string, httpClient?: AxiosInstance): Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getConsolidationServiceUrl();
    logger.info(`[LANDING-CONSOLIDATION][VOIDING-FOR][DOCUMENT][${documentNumber}]`);
    const client: AxiosInstance = httpClient ?? axios.create({ baseURL: baseUrl });
    await client.post('/v1/jobs/void', { documentNumber: documentNumber });
  } catch (e) {
    logger.error(`[VOID-CONSOILDATE-LANDINGS][ERROR][${e}]`);
    throw e;
  }
};
