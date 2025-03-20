import VesselValidator from "../services/vesselValidator.service";
import { validateProducts } from "./ccProductValidator";
import logger from "../logger";
import * as moment from 'moment';

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
    logger.info(`[INVALID-LANDING][INVALID-VESSEL-LICENSE]`);
    throw new Error('validation.vessel.license.invalid-date');
  }

  const seasonalFishValidationGuard = await validateProducts(exportPayload);

  if (seasonalFishValidationGuard.some(validation => (validation.result === false && validation.validator === 'seasonalFish'))) {
    logger.info(`[INVALID-LANDING][OUT-OF-SEASON-FISH]`);
    throw new Error('error.seasonalFish.invalidate');
  }
}