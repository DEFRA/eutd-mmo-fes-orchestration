import VesselValidator from "../services/vesselValidator.service";
import { validateProducts } from "./ccProductValidator";
import logger from "../logger";
import * as moment from 'moment';

function validateSeasonalFish(validations: {
  validator: string;
  result: any[];
  id: string;
  landingId: string;
  pln: string;
  startDate: string;
  dateLanded: string;
  species: {
      code: string;
      label: string;
  };
  weight: number;
}[]) {
	const errors = {};

  for (const i in validations) {
    validations[i].result.forEach((field: string) => {
      if (field === 'startDate') {
        errors[field] = 'error.startDate.seasonalFish.invalidate';
      } else if (field === 'dateLanded') {
        errors[field] = 'error.seasonalFish.invalidate';
      }
    });

    if (errors['startDate'] && errors['dateLanded']) {
      break;
    }
  }


	return errors;
}


export const createExportPayloadForValidation = (product, landing) => {
  landing.dateLanded = moment.utc(landing.dateLanded).format('YYYY-MM-DD');
  landing.startDate = landing.startDate ? moment.utc(landing.startDate).format('YYYY-MM-DD') : undefined;

  return [{
    product: product,
    landings: [{
        model: landing
    }]
  }];
}

export const validateLanding = async (exportPayload) => {
  try {
    await VesselValidator.checkVesselWithDate(exportPayload);
  } catch (e) {
    logger.info('[INVALID-LANDING][INVALID-VESSEL-LICENSE]');
    return {
      error: 'invalid',
      errors: {
        dateLanded: 'validation.vessel.license.invalid-date'
      }
    }
  }

  const seasonalFishValidationGuard = await validateProducts(exportPayload);

  const hasSeasonalFishError = seasonalFishValidationGuard.some(validation => (validation.result.length > 0 && validation.validator === 'seasonalFish'))
  if (hasSeasonalFishError) {
    logger.info('[INVALID-LANDING][OUT-OF-SEASON-FISH]');
    return {
      error: 'invalid',
      errors: validateSeasonalFish(seasonalFishValidationGuard)
    }
  }
}