import * as Joi from 'joi';

const transportSelectionSaveAsDraftSchema = Joi.object({
  vehicle: Joi.string().required(),
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().trim().required(),
  dashboardUri : Joi.string().trim().required()
});

export default transportSelectionSaveAsDraftSchema;