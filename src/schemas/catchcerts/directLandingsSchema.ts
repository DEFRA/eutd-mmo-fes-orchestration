import * as Joi from 'joi';
import * as moment from "moment";
import ApplicationConfig from "../../applicationConfig";
import { decimalPlacesValidator } from "../../helpers/customValidators";
import { getFAOAreaList } from '../../helpers/utils/utils';
import { logger } from '@azure/event-hubs';

const extendedJoi = Joi.extend(require('@joi/date'));

const directLandingsSchema = Joi.object({
  dateLanded: Joi.string()
    .custom((value, helpers) => {
      const parts = value.split('-');
      // check array parts are note empty.
      if (parts.length !== 3 || parts.some(part => part.trim() === ''))
        return helpers.error('directLanding.date.base');

      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      if (!moment(isoDate, "YYYY-MM-DD", true).isValid()) {
        return helpers.error('directLanding.date.invalid');
      }
      const maxDate = moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days');
      if (moment(value).isAfter(maxDate, 'day')) {
        return helpers.error('date.max');
      }

      return value;
    }, 'Strict YYYY-MM-DD date format')
    .required(),
  startDate: extendedJoi.date().custom((value: string, helpers: any) => {
    const parts = helpers.original.split('-');

    if (parts.length !== 3)
      return helpers.error('date.base');

    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const startDate = `${year}-${month}-${day}`;

    if (!moment(startDate, "YYYY-MM-DD", true).isValid()) {
      return helpers.error('date.base');
    }
    const dateLanded = moment(helpers.state.ancestors[0].dateLanded);
    if (dateLanded.isBefore(startDate, 'day')) {
      logger.error(`Start date ${startDate} is after date landed ${dateLanded.format('YYYY-MM-DD')}`);
      return helpers.error('date.max');
    }
    return value;
  }, 'Start Date Validator').required(),
  faoArea: Joi.string().trim().label("Catch area").valid(...getFAOAreaList()).required(),
  vessel: Joi.object().keys({
    vesselName: Joi.string().trim().label("vessel.vesselName").required()
  }).required(),
  weights: Joi.array().items(Joi.object().keys({
    speciesId: Joi.string().trim().label("speciesId").required(),
    exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required()
  })).min(1).custom((weights: any[], helpers: any) => {
    const totalWeight = weights.reduce((sum: number, w: any) => sum + (w.exportWeight || 0), 0);
    if (totalWeight > 99999999999.99) {
      return helpers.error('array.totalWeightExceeded');
    }
    return weights;
  }, 'Total weight validator').required(),
  gearCategory: Joi.custom((value: string, helpers: any) => {
    const gearCategory = helpers.original;
    const gearType = helpers.state.ancestors[0].gearType;
    if (!gearCategory && gearType) {
      return helpers.error('string.empty');
    }
    return value;
  }, 'Gear Category Validator').required(),
  gearType: Joi.custom((value: string, helpers: any) => {
    const gearType = helpers.original;
    const gearCategory = helpers.state.ancestors[0].gearCategory;
    if (gearCategory && !gearType) {
      return helpers.error('string.empty');
    }
    return value;
  }, 'Gear Type Validator').required(),
  highSeasArea: Joi.string().required(),
  exclusiveEconomicZones: Joi.alternatives().conditional('highSeasArea', {
    is: 'No',
    then: Joi.array().items(Joi.object()).min(1).required(),
    otherwise: Joi.array().items(Joi.object()).optional()
  }),
  rfmo: Joi.string().optional(),
});

export default directLandingsSchema;