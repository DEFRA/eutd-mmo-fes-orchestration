import VesselValidator from "../services/vesselValidator.service";
import { validateProducts } from "./ccProductValidator";
import logger from "../logger";
import * as moment from 'moment';
import { ProductLanded } from "../persistence/schema/frontEndModels/payload";
import { isValidGearType } from "../services/reference-data.service";
import ExportPayloadService from "../services/export-payload.service";

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

export const validateAggregateExportWeight = async (exportPayload: ProductLanded[], opts?: { userPrincipal?: string, documentNumber?: string, contactId?: string }) => {
  if (!(opts?.userPrincipal && opts?.documentNumber && opts?.contactId)) {
    logger.info('[AGGREGATE-WEIGHT][SKIPPED][MISSING-OPTS]');
    return null;
  }

  try {
    const currentExportPayload = await ExportPayloadService.get(opts.userPrincipal, opts.documentNumber, opts.contactId);
    let currentTotal = 0;
    if (currentExportPayload?.items) {
      currentExportPayload.items.forEach((item: any) => {
        if (item.landings && item.landings.length > 0) {
          item.landings.forEach((l: any) => {
            const w = Number(l.model?.exportWeight) || 0;
            currentTotal += w;
          });
        }
      });
    }

    const newWeightsTotal = exportPayload
      .flatMap(x => x.landings)
      .reduce((acc, l: any) => acc + (Number(l.model?.exportWeight) || 0), 0);

    let originalWeightsToSubtract = 0;
    if (currentExportPayload?.items) {
      exportPayload.flatMap(x => x.landings).forEach((l: any) => {
        const id = l.model?.id;
        if (id) {
          currentExportPayload.items.forEach((item: any) => {
            if (item.landings && item.landings.length > 0) {
              const found = item.landings.find((el: any) => el.model?.id === id);
              if (found) {
                originalWeightsToSubtract += Number(found.model?.exportWeight) || 0;
              }
            }
          });
        }
      });
    }

    const adjustedTotal = currentTotal - originalWeightsToSubtract + newWeightsTotal;
    logger.info(`[AGGREGATE-WEIGHT][CURRENT:${currentTotal}][SUBTRACT:${originalWeightsToSubtract}][NEW:${newWeightsTotal}][ADJUSTED:${adjustedTotal}]`);
    if (adjustedTotal >= 10000000) {
      return {
        error: 'invalid',
        errors: {
          exportWeight: 'ccAddLandingTotalExportWeightLessThan'
        }
      };
    }

    return null;
  } catch (e) {
    logger.error(`[VALIDATE-LANDING][AGGREGATE-WEIGHT-ERROR][${e?.stack ?? e}]`);
    return null;
  }
}

export const validateLanding = async (exportPayload: ProductLanded[], opts?: { userPrincipal?: string, documentNumber?: string, contactId?: string }) => {
  const errors: any = {};
  try {
    await VesselValidator.checkVesselWithDate(exportPayload);
  } catch (e) {
    logger.info('[INVALID-LANDING][INVALID-VESSEL-LICENSE]');
    errors.dateLanded = 'validation.vessel.license.invalid-date';
  }
   const aggregateResult = await validateAggregateExportWeight(exportPayload, opts);
    if (aggregateResult?.errors) {
      Object.assign(errors, aggregateResult.errors);
    }
  const seasonalFishValidationGuard = await validateProducts(exportPayload);
  const hasSeasonalFishError = seasonalFishValidationGuard.some(validation => (validation.result.length > 0 && validation.validator === 'seasonalFish'))
  if (hasSeasonalFishError) {
    logger.info('[INVALID-LANDING][OUT-OF-SEASON-FISH]');
    Object.assign(errors, validateSeasonalFish(seasonalFishValidationGuard));
  } 
  const gearValidityChecks: Promise<boolean>[] = exportPayload
    .flatMap(x => x.landings)
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