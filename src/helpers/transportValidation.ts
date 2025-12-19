import logger from '../logger';
import ApplicationConfig from '../applicationConfig';
import axios from 'axios';
import { buildErrorForClient, CannotReachError } from '../validators/validationErrors';

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
