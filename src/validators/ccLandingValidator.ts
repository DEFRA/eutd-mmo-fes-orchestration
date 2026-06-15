import * as Joi from 'joi';
import VesselValidator from "../services/vesselValidator.service";
import { validateProducts } from "./ccProductValidator";
import logger from "../logger";
import * as moment from 'moment';
import { ProductLanded } from "../persistence/schema/frontEndModels/payload";
import { isValidGearType } from "../services/reference-data.service";

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
  const errors: any = {};

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

export const validateAggregateExportWeight = async (input: any, existingLandingWeight?: number) => {
  const createAggregateError = (): Joi.ValidationError => {
    return new Joi.ValidationError('ccAddLandingTotalExportWeightLessThan', [
      {
        message: 'ccAddLandingTotalExportWeightLessThan',
        path: ['exportWeight'],
        type: 'any.invalid',
        context: { label: 'exportWeight', key: 'exportWeight' }
      }
    ], null);
  };
  // If called from route payload validator with raw request value
  if (input?.totalCombinedExportWeight !== undefined && input?.exportWeight !== undefined) {
    try {
       const oldWeight = existingLandingWeight || 0;
       const adjustedTotal = Number(input.totalCombinedExportWeight) - oldWeight + Number(input.exportWeight);
        if (!Number.isNaN(adjustedTotal) && adjustedTotal >= 10000000) {
        return [createAggregateError()];
          }
      return [];
    } catch (e) {
      logger.error(`[VALIDATE-LANDING][AGGREGATE-WEIGHT-ERROR][${e?.stack ?? e}]`);
      return [];
    }
  }
  // Default: no aggregate errors for other input shapes
  return [];
}

export const validateLanding = async (exportPayload: ProductLanded[]) => {
  const errors: any = {};
  try {
    await VesselValidator.checkVesselWithDate(exportPayload);
  } catch (e: Error) {
    logger.error({
      requestId: 'validateLanding',
      data: { error: e?.stack ?? e?.cause?.stack ?? e }
    }, '[INVALID-LANDING][INVALID-VESSEL-LICENSE]');

    const fields: Array<'dateLanded' | 'startDate'> = Array.isArray(e?.fields)
      ? e.fields
      : [e?.field === 'startDate' ? 'startDate' : 'dateLanded'];

    fields.forEach((field) => {
      errors[field] = field === 'startDate'
        ? 'error.startDate.vesselPln.any.invalid'
        : 'validation.vessel.license.invalid-date';
    });
  }
  const seasonalFishValidationGuard = await validateProducts(exportPayload);
  const hasSeasonalFishError = seasonalFishValidationGuard.some(validation => (validation.result.length > 0 && validation.validator === 'seasonalFish'))
  if (hasSeasonalFishError) {
    logger.info('[INVALID-LANDING][OUT-OF-SEASON-FISH]');
    Object.assign(errors, validateSeasonalFish(seasonalFishValidationGuard));
  }
  const gearValidityChecks: Promise<boolean>[] = exportPayload
    .reduce((acc: any[], x) => acc.concat(x.landings || []), [])
    .filter(x => x.model.gearCategory)
    .map(x => isValidGearType(x.model.gearType, x.model.gearCategory));

  const gearValidityResponses = await Promise.allSettled(gearValidityChecks);
  const failed = gearValidityResponses.filter(x => x.status === 'rejected' || !x.value);
  if (failed.length > 0) {
    errors.gearType = 'error.gearType.invalid';
  }
  if (Object.keys(errors).length > 0) {
    return { error: 'invalid', errors };
  }
}
