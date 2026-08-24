import axios, { AxiosInstance } from 'axios';
import logger from '../logger';
export const createHttpClient = (baseUrl: string) : AxiosInstance => {
  return axios.create({
    baseURL: baseUrl
  });
}

export const checkIfEntityExistsInServer = async (baseUrl: string, path: string, httpClient?: AxiosInstance) : Promise<boolean> => {
  const entity = await getEntityFromServer(baseUrl, path, httpClient);
  return Object.keys(entity).length > 0;
}

export const getEntityFromServer = async (
  baseUrl: string,
  path: string,
  httpClient?: AxiosInstance
): Promise<any> => {
  try {
    if (!httpClient) {
      httpClient = axios.create({
        baseURL: baseUrl,
      });
    }
    const response = await httpClient.get(path);
    if (Object.hasOwn(response, 'data')) {
      return response.data;
    }
    return null;
  } catch (e) {
    logger.error('getEntityFromServer error', e);
  }
};

