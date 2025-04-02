import * as Joi from 'joi';
import * as moment from "moment";
import ApplicationConfig from "../../applicationConfig";
import { decimalPlacesValidator } from "../../helpers/customValidators";
import { getFAOAreaList } from '../../helpers/utils/utils';

const extendedJoi = Joi.extend(require('@hapi/joi-date'));

const directLandingsSchema = Joi.object({
  dateLanded: extendedJoi.date().max(Joi.ref('maxDate', { adjust: () => moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days').toDate() })).utc().required(),
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
  })).min(1).required()
});

export default directLandingsSchema;