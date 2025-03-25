import * as Joi from 'joi';
import * as moment from "moment";
import ApplicationConfig from "../../applicationConfig";
import { decimalPlacesValidator } from "../../helpers/customValidators";
import { getFAOAreaList } from '../../helpers/utils/utils';

const extendedJoi = Joi.extend(require('@hapi/joi-date'));

const directLandingsSchema = Joi.object({
  dateLanded: extendedJoi.date().max(Joi.ref('maxDate', { adjust : () => moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days').toDate()})).utc().required(),
  startDate: extendedJoi.date().custom((value, helpers) => {
    const startDate = helpers.original;
    const dateLanded = helpers.state.ancestors[0].dateLanded;

    if (!moment(startDate).utc().isValid()) {
      return helpers.error('date.base');
    }

    if (moment(dateLanded).utc().isBefore(moment(startDate).utc(), 'day')) {
      return helpers.error('date.max');
    }

    return value;
  }, 'Date validation').optional(),
  faoArea: Joi.string().trim().label("Catch area").valid(...getFAOAreaList()).required(),
  vessel: Joi.object().keys({
    vesselName: Joi.string().trim().label("vessel.vesselName").required()
  }).required(),
  weights: Joi.array().items(Joi.object().keys({
    speciesId: Joi.string().trim().label("speciesId").required(),
    exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required()
  })).min(1).required()
});

export default directLandingsSchema;