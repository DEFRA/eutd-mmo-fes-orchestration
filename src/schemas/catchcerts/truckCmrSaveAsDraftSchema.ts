import * as Joi from 'joi';

const truckCmrSaveAsDraftSchema = Joi.object({
  cmr: Joi.string().required(),
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().trim().required(),
  dashboardUri : Joi.string().trim().required()
});


export default truckCmrSaveAsDraftSchema;