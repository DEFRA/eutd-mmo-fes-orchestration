import ApplicationConfig from '../applicationConfig';
import logger from "../logger";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ConversionFactor } from './interfaces/ConversionFactor';
import { LandingsRefreshData } from './interfaces';
import { Vessel } from "../persistence/schema/frontEndModels/payload";
import { v4 as uuidv4 } from  'uuid';
import { ICcQueryResult } from '../persistence/schema/onlineValidationResult';
import { GearType } from './interfaces/GearType';


export const refreshLandings = async (landingData: LandingsRefreshData, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    const client: AxiosInstance = httpClient ?? axios.create({ baseURL: baseUrl });
    const response: AxiosResponse = await client.post('/v1/landings/queue', landingData);

    return response.data;
  } catch (err) {
    logger.error(`[REFRESHING-LANDINGS][ERROR][${err}]`);
    return err;
  }
};

export const getStateByCode = async (code: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const response:AxiosResponse = await client.get('/v1/states');
    return response.data.find((state) => state.value === code);
  } catch(err) {
    logger.error('Failed to get state for code', err);
    return err;
  }
};

export const getPresentationByCode = async (code: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const response: AxiosResponse = await client.get('/v1/presentations');
    return response.data.find(pres => pres.value === code);
  } catch(err) {
    logger.error('Failed to get presentation for code', err);
    return err;
  }
};

export const getSpeciesByFaoCode = async (faoCode: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const response: AxiosResponse = await client.get(`/v1/species/${faoCode}`);
    return response.data;
  } catch(err) {
    logger.error('Failed to get species for code', err);
    return err;
  }
};

export const getSpecies = async (label: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const params: AxiosRequestConfig = {
      params: {
        searchTerm: label
      }
    };
    const response:AxiosResponse = await client.get('/v1/species/search', params);
    return response.data;
  } catch(err) {
    logger.error('Failed to get species for code', err);
    return err;
  }
};

export const getVessel = async (pln: string, name: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const params: AxiosRequestConfig = {
      params: {
        vesselPln: pln,
        vesselName: name
      }
    };
    const response: AxiosResponse = await client.get('/v1/vessels/search-exact', params);
    return response.data;
  } catch (err) {
    logger.error('Failed to get vessel for pln and name', err);
    return err;
  }
};

export const checkVesselLicense = async (vessel: Vessel, date: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const params: AxiosRequestConfig = {
      params: {
        vesselPln: vessel.pln,
        vesselName: vessel.vesselName,
        flag: vessel.flag,
        cfr: vessel.cfr,
        homePort: vessel.homePort,
        licenceNumber: vessel.licenceNumber,
        licenceValidTo: vessel.licenceValidTo,
        imo: vessel.imoNumber,
        landedDate: date
      }
    };
    const response:AxiosResponse = await client.get('/v1/vessels/hasLicense', params);
    return response.data;
  } catch(err) {
    logger.error(`Vessel ${vessel.vesselName} has no valid license`, err.message);
    throw err;
  }
};

export const searchVessel = async (searchTerm: string, date: string, httpClient?: AxiosInstance) : Promise<Vessel[]> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    const params: AxiosRequestConfig = {
      params: {
        searchTerm: searchTerm,
        landedDate: date
      }
    };
    const response:AxiosResponse = await client.get('/v1/vessels/search', params);
    return response.data;
  } catch(err) {
    logger.error('Vessel has no valid license', err.message);
    throw err;
  }
};

export const getVesselByPlnDate = async (pln: string, date: string, httpClient?: AxiosInstance) : Promise<Vessel> => {
  const vesselsFound: Vessel[] = await searchVessel(pln, date, httpClient) || [];
  if (vesselsFound && vesselsFound.length > 1) {
    logger.error(`[GET-VESSEL-BY-PLN-DATE][ERROR][Multiple vessels with same PLN Date: ${JSON.stringify(vesselsFound)?.[0]}]`);
    return;
  }

  return vesselsFound.find((v: Vessel) => v.pln === pln);
};

export type SeasonalFishPeriod = {
  fao: string,
  validFrom: string,
  validTo: string
}

export const getSeasonalFish = async (httpClient?: AxiosInstance) : Promise<SeasonalFishPeriod[]> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    const response: AxiosResponse = await client.get('/v1/seasonalFish');
    return response.data;
  } catch (e) {
    logger.error({ err:e }, `[GET-SEASONAL-FISH][ERROR]${ e }`);
    throw e
  }
};

export const getConversionFactors = async (httpClient?: AxiosInstance) : Promise<ConversionFactor[]> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    const response: AxiosResponse = await client.get('/v1/factors');
    return response.data;
  }
  catch(e) {
    logger.error(`[GET-CONVERSION-FACTORS][ERROR] ${e}`);
    throw e;
  }
};

export const reportDraftCreated = async (documentNumber: string, httpClient?: AxiosInstance) : Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    await client.post('/v1/data-hub/draft', {certificateId: documentNumber});
  }
  catch(e) {
    logger.error(`[REPORT-DRAFT-CREATED][ERROR] ${e}`);
    throw e;
  }
};

export const reportDocumentDeleted = async (documentNumber: string, httpClient?: AxiosInstance): Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    await client.post('/v1/data-hub/delete', { certificateId: documentNumber });
  } catch (e) {
    logger.error(`[REPORT-DOCUMENT-DELETED][ERROR] ${e}`);
    throw e;
  }
};

export const reportDocumentSubmitted = async (url:string, validationData: ICcQueryResult[], httpClient?: AxiosInstance): Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    const data = {
      validationData
    };

    logger.info(`[POST][REPORT-DOCUMENT-SUBMIT] ${JSON.stringify(data)}`);

    await client.post(url, data);
  } catch (e) {
    logger.error(`[REPORT-DOCUMENT-SUBMIT][ERROR] ${e}`);
    throw e;
  }
};

export const reportDocumentVoided = async (documentNumber: string, httpClient?: AxiosInstance): Promise<void> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    await client.post('/v1/data-hub/void', { certificateId: documentNumber , isFromExporter: true});
  } catch (e) {
    logger.error(`[REPORT-DOCUMENT-VOIDED][ERROR] ${e}`);
    throw e;
  }
};

export const virusDetected = async (fileName: string, content: string, documentNumber: string, httpClient?: AxiosInstance): Promise<boolean> => {

  const key = uuidv4();
  try {
    const payload = {
      fileName: fileName,
      content : Buffer.from(content).toString('base64'),
      documentNumber: documentNumber,
      key: key
    };

    logger.info(`[AV-API][VIRUS-CHECKER][CSV][${documentNumber}][CALLING-API][${key}]`);
    const client: AxiosInstance = httpClient ?? axios.create({ baseURL: ApplicationConfig.getReferenceServiceUrl() });
    const result: AxiosResponse = await client.post('/v1/virusChecker/csv', payload);

    logger.info(`[AV-API][VIRUS-CHECKER][CSV][${documentNumber}][RESPONSE][${JSON.stringify(result?.data, null, 2)}]`);

    return result?.data ? result.data.virusDetected : undefined;
  } catch (e) {
    logger.error(`[AV-API][VIRUS-CHECKER][CSV][${documentNumber}][ERROR][${key}] ${e}`);
    return undefined;
  }
};

export const addIsLegallyDue = async (documentNumber: string, httpClient?: AxiosInstance) : Promise<any> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }
    await client.post('/v1/isLegallyDue', { documentNumber });
  } catch(err) {
    logger.error('Failed to update exportData is legally due status', err);
    return err;
  }
};

export const isValidGearType = async (gearType: string, gearCategory: string, httpClient?: AxiosInstance) : Promise<boolean> => {
  try {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    let client = httpClient;
    if (!client) {
      client = axios.create({
        baseURL: baseUrl
      });
    }

    const response: AxiosResponse<GearType[]> = await client.get('/v1/gear-type/' + gearCategory);

    logger.info(`[GET-VALID-GEAR-TYPES][RESPONSE][${JSON.stringify(response?.data)}]`);
    if (!Array.isArray(response.data)) throw new Error(`unexpected response format (expected array, got ${typeof response.data})`);

    return response.data.some(item => gearType === `${item.gearName} (${item.gearCode})`);
  }
  catch(e) {
    logger.error(`[GET-VALID-GEAR-TYPES][ERROR] ${e}`);
    throw e;
  }
};
