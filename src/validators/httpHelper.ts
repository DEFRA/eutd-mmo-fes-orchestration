import { AxiosInstance } from 'axios';

import { checkIfEntityExistsInServer, getEntityFromServer } from '../helpers/http';
import { breakDownNameAndCode } from '../helpers/name';
import {
  buildErrorForClient,
  invalidErrorMessage,
  cannotReachErrorMessage,
  BusinessError,
  SpeciesSuggestionError
} from './validationErrors';
import logger from '../logger';
import { ICountry, ICommodityCodeExtended, IPSSDCommodityCode } from '../persistence/schema/common';
import { Product } from '../persistence/schema/frontEndModels/species';
import { Species } from './interfaces/species.interface';
import { querySpecies } from '../helpers/querySpecies';

declare type pathBuilder = (name: string, code: string, scientificName: string) => string;

export const validate = async (itemWithCode: string, scientificName: string, baseURL: string,
                              propertyName: string, buildPath: pathBuilder,
                              client?: AxiosInstance) : Promise<BusinessError> => {
  try {
    const parsedItem = breakDownNameAndCode(itemWithCode);
    if (parsedItem && `${parsedItem.name} (${parsedItem.code})` === itemWithCode) {
      const path = buildPath(parsedItem.name, parsedItem.code, scientificName);
      const valid = await checkIfEntityExistsInServer(baseURL, path, client);
      if (valid) {
        return {
          isError: false,
          error: null
        };
      }
    }

    return {
      isError: true,
      error: buildErrorForClient(invalidErrorMessage(propertyName), propertyName)
    };

  } catch(e) {
    logger.error('Cannot get species name from reference service', e);
    return {
      isError: true,
      error: buildErrorForClient(cannotReachErrorMessage(propertyName), propertyName)
    };
  }
};

export const checkSpeciesNameWithSuggestions = async (userInput: string, baseURL: string, propertyName: string): Promise<BusinessError | SpeciesSuggestionError> => {
  try {
    const species: Species[] =  await getEntityFromServer(baseURL, '/v1/species');
    const result = querySpecies(userInput, species);
    if (result.length === 0 || result.length > 5) {
      return {
        isError: true,
        error: buildErrorForClient('Incorect FAO code or Species name', propertyName)
      }
    } else if (result.length <= 5) {
      // checks to make sure that even if the result length is 1 that it matches the user input otherwise it can cause issues
      if (result.length === 1 && result[0] !== userInput || result.length > 1) {
        return {
          isError: true,
          error: buildErrorForClient('Results match fewer than 5', propertyName),
          resultList: result
        }
      } else if (result.length === 1 && result[0] === userInput) {
        return {
          isError: false,
          error: null
        }
      }
    }
  } catch (e) {
    logger.error('Cannot get list of species from reference server', e);
    return {
      isError: true,
      error: buildErrorForClient(cannotReachErrorMessage(propertyName), propertyName)
    }
  }
}

export const validateSpecies = async (
  species: Product,
  baseURL: string,
  propertyName: string,
  path: string,
  client?: AxiosInstance
): Promise<BusinessError> => {
  try {
  if (species === undefined) {
    return {
      isError: true,
      error: buildErrorForClient(
        invalidErrorMessage(propertyName),
        propertyName
      ),
    };
  }
  const commodityCodes: ICommodityCodeExtended[] = await getEntityFromServer(baseURL, path, client);
  logger.debug(`[COMPARING ][${JSON.stringify(commodityCodes)}][${JSON.stringify(species)}]`)
    if (commodityCodes.some(
    (commodity: ICommodityCodeExtended) =>
      commodity.code === species.commodity_code
      && `${commodity.faoName} (${species.speciesCode})` === species.species
      && commodity.presentationLabel && commodity.presentationLabel.toLowerCase() === species.presentationLabel.toLowerCase()
      && commodity.stateLabel && commodity.stateLabel.toLowerCase() === species.stateLabel.toLowerCase()
  )) {
    return {
      isError: false,
      error: null,
    };
  }
  return {
    isError: true,
    error: buildErrorForClient(
      invalidErrorMessage(propertyName),
      propertyName
    ),
  };
  }
  catch(e) {
    logger.error('Cannot get species from reference service', e);
    return {
      isError: true,
      error: buildErrorForClient(cannotReachErrorMessage(propertyName), propertyName)
    };
  }
};

export const validateCountries = async (
  exportDestination: ICountry,
  baseURL: string,
  propertyName: string,
  client?: AxiosInstance
): Promise<BusinessError> => {
  try {
    if (exportDestination === undefined) {
      return {
        isError: true,
        error: buildErrorForClient(
          invalidErrorMessage(propertyName),
          propertyName
        ),
      };
    }

    const path = '/v1/countries';
    const countries: ICountry[] = await getEntityFromServer(baseURL, path, client);
    const isValid: boolean = countries.some((_: ICountry) =>
      _.officialCountryName === exportDestination.officialCountryName &&
      _.isoCodeAlpha2 === exportDestination.isoCodeAlpha2 &&
      _.isoCodeAlpha3 === exportDestination.isoCodeAlpha3 &&
      _.isoNumericCode === exportDestination.isoNumericCode
    );

    if (isValid) {
      return {
        isError: false,
        error: null,
      };
    }
    return {
      isError: true,
      error: buildErrorForClient(
        invalidErrorMessage(propertyName),
        propertyName
      ),
    };
  } catch (e) {
    logger.error('Cannot get country name from reference service', e);
    return {
      isError: true,
      error: buildErrorForClient(
        cannotReachErrorMessage(propertyName),
        propertyName
      ),
    };
  }
};

export const validatePSSDCommodityCode = async (
  commodityCode: string,
  baseURL: string,
  propertyName: string,
  client?: AxiosInstance
): Promise<BusinessError> => {
  try {
    if (commodityCode === undefined || commodityCode === null) {
      return {
        isError: true,
        error: buildErrorForClient(
          invalidErrorMessage(propertyName),
          propertyName
        ),
      };
    }

    const path = '/v1/commodities';
    const commodities: IPSSDCommodityCode[] = await getEntityFromServer(baseURL, path, client);
    const isValid: boolean = commodities.some((_: IPSSDCommodityCode) => _.code === commodityCode);

    if (isValid) {
      return {
        isError: false,
        error: null,
      };
    }
    return {
      isError: true,
      error: buildErrorForClient(
        invalidErrorMessage(propertyName),
        propertyName
      ),
    };
  } catch (e) {
    logger.error('Cannot get PS/SD commodity code from reference service', e);
    return {
      isError: true,
      error: buildErrorForClient(
        cannotReachErrorMessage(propertyName),
        propertyName
      ),
    };
  }
};