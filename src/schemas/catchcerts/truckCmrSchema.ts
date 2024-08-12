import * as Joi from 'joi';

const truckCmrSchema = Joi.object({
  cmr: Joi.string().required(),
  journey: Joi.string(),
});


export default truckCmrSchema;
