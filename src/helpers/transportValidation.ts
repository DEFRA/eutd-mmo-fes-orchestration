import logger from '../logger';
import ApplicationConfig from '../applicationConfig';
import axios from 'axios';
import { buildErrorForClient, CannotReachError } from '../validators/validationErrors';

const CONTAINER_NUMBER_REGEX = /^[A-Z]{3}[UJZR]\d{7}$/;

export function validateContainerNumbers(
  containerNumbers: string[] | undefined
): CannotReachError[] {
  const validationErrors: CannotReachError[] = [];

  if (!containerNumbers || containerNumbers.length === 0) {
    return validationErrors;
  }

  // Filter out empty strings
  const nonEmptyContainers = containerNumbers.filter(c => c?.trim());

  if (nonEmptyContainers.length === 0) {
    return validationErrors;
  }

  // Validate each container number
  nonEmptyContainers.forEach((containerNumber, index) => {
    const trimmed = containerNumber.trim();
    if (!CONTAINER_NUMBER_REGEX.test(trimmed)) {
      logger.error(`[TRANSPORT-VALIDATE][ERROR][INVALID-CONTAINER-NUMBER][${trimmed}]`);
      validationErrors.push(
        buildErrorForClient('sdShippingContainerInvalidFormat', `containerNumbers.${index}`)
      );
    }
  });

  return validationErrors;
}

export async function validateTruckNationality(
  vehicle: string,
  nationalityOfVehicle: string | undefined,
  isDraft: boolean = false
): Promise<CannotReachError[]> {
  const countryValidationErrors: CannotReachError[] = [];

  if (vehicle !== 'truck' || !nationalityOfVehicle || isDraft) {
    return countryValidationErrors;
  }

  try {
    const refUrl = ApplicationConfig.getReferenceServiceUrl();
    const { data: countries } = await axios.get(`${refUrl}/v1/countries`);
    const matchedCountry = countries.find((c: any) => 
      c.officialCountryName === nationalityOfVehicle
    );
    
    if (!matchedCountry) {
      logger.error(`[TRANSPORT-VALIDATE][ERROR][INVALID-COUNTRY][${nationalityOfVehicle}]`);
      countryValidationErrors.push(
        buildErrorForClient('error.nationalityOfVehicle.any.invalid', 'nationalityOfVehicle')
      );
    }
  } catch (err) {
    logger.error(`[TRANSPORT-VALIDATE][ERROR][CANNOT-REACH-REFERENCE-SERVICE]`, err);
    countryValidationErrors.push(
      buildErrorForClient('error.nationalityOfVehicle.any.invalid', 'nationalityOfVehicle')
    );
  }

  return countryValidationErrors;
}
