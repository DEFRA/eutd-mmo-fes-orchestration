import * as Joi from 'joi';
import * as moment from 'moment';
import ApplicationConfig from '../../applicationConfig';
import { decimalPlacesValidator } from '../../helpers/customValidators';
import { getFAOAreaList } from '../../helpers/utils/utils';

const extendedJoi = Joi.extend(require('@joi/date'));

const manualLandingsSchema = Joi.object({
  product: Joi.string().trim().required(),
  vessel: Joi.object().keys({
    vesselName: Joi.string().trim().label('Vessel').required(),
  }),
  dateLanded: Joi.string()
    .custom((value, helpers) => {
      const parts = value.split('-');
      if (parts.length !== 3) return helpers.error('date.base');

      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      if (!moment(isoDate, 'YYYY-MM-DD', true).isValid()) {
        return helpers.error('date.base');
      }
      const maxDate = moment().add(
        ApplicationConfig._landingLimitDaysInTheFuture,
        'days',
      );
      if (moment(value).isAfter(maxDate, 'day')) {
        return helpers.error('date.max');
      }

      return value;
    }, 'Strict YYYY-MM-DD date format')
    .required(),
  startDate: extendedJoi
    .date()
    .custom((value: string, helpers: any) => {
      const startDate = moment(
        helpers.original,
        ['YYYY-M-D', 'YYYY-MM-DD'],
        true,
      );
      const dateLanded = moment(helpers.state.ancestors[0].dateLanded);

      if (!startDate.isValid()) {
        return helpers.error('date.base');
      }

      if (dateLanded.isBefore(startDate, 'day')) {
        return helpers.error('date.max');
      }

      return value;
    }, 'Start Date Validator')
    .required()
    .messages({
      'any.required': 'error.startDate.any.required',
      'date.base': 'error.startDate.date.base',
      'date.max': 'error.startDate.date.max',
    }),
  exportWeight: Joi.number()
    .greater(0)
    .custom(decimalPlacesValidator, 'Decimal places validator')
    .label('Export weight')
    .required(),
  gearCategory: Joi.string().required().messages({
    'any.required': 'error.gearCategory.any.required',
    'string.empty': 'error.gearCategory.string.empty',
  }),
  gearType: Joi.string().required().messages({
    'any.required': 'error.gearType.any.required',
    'string.empty': 'error.gearType.string.empty',
  }),
  highSeasArea: Joi.string().valid('Yes', 'No').required().messages({
    'any.required': 'error.highSeasArea.any.required',
    'any.only': 'error.highSeasArea.any.only',
  }),
  exclusiveEconomicZones: Joi.alternatives().conditional('highSeasArea', {
    is: 'No',
    then: Joi.array().items(Joi.object()).min(1).required(),
    otherwise: Joi.array().items(Joi.object()).optional(),
  }),
  faoArea: Joi.string()
    .trim()
    .label('Catch area')
    .valid(...getFAOAreaList())
    .required(),
  rfmo: Joi.string().optional(),
});

export default manualLandingsSchema;
