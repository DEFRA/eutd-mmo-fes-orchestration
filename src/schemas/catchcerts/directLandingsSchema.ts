import * as Joi from 'joi';
import * as moment from "moment";
import ApplicationConfig from "../../applicationConfig";
import { decimalPlacesValidator } from "../../helpers/customValidators";
import { getFAOAreaList } from '../../helpers/utils/utils';

const extendedJoi = Joi.extend(require('@joi/date'));

const directLandingsSchema = Joi.object({
  dateLanded: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        return helpers.error('date.base');
      }
      const maxDate = moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days');
      if (moment(value).isAfter(maxDate, 'day')) {
        return helpers.error('date.max');
      }
      return value;
    }, 'Strict YYYY-MM-DD date format'),
  startDate: extendedJoi.date().custom((value: string, helpers: any) => {
    const startDate = moment(helpers.original, ["YYYY-M-D", "YYYY-MM-DD"], true);
    const dateLanded = moment(helpers.state.ancestors[0].dateLanded);
    if (!startDate.isValid()) {
      return helpers.error('date.base');
    }
    if (dateLanded.isBefore(startDate, 'day')) {
      return helpers.error('date.max');
    }
    return value;
  }, 'Start Date Validator').optional(),
  faoArea: Joi.string().trim().label("Catch area").valid(...getFAOAreaList()).required(),
  vessel: Joi.object().keys({
    vesselName: Joi.string().trim().label("vessel.vesselName").required()
  }).required(),
  weights: Joi.array().items(Joi.object().keys({
    speciesId: Joi.string().trim().label("speciesId").required(),
    exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required()
  })).min(1).required(),
  gearCategory: Joi.custom((value: string, helpers: any) => {
    const gearCategory = helpers.original;
    const gearType = helpers.state.ancestors[0].gearType;
    if (!gearCategory && gearType) {
      return helpers.error('string.empty');
    }        
    return value;
  }, 'Gear Category Validator').optional(),
  gearType: Joi.custom((value: string, helpers: any) => {
    const gearType = helpers.original;
    const gearCategory = helpers.state.ancestors[0].gearCategory;
    if (gearCategory && !gearType) {
      return helpers.error('string.empty');
    }
    return value;
  }, 'Gear Type Validator').optional(),
  highSeasArea: Joi.string().optional(),
  exclusiveEconomicZones: Joi.array().items(Joi.object()).optional(),
  rfmo: Joi.string().optional(),
});

export default directLandingsSchema;