import * as Joi from 'joi';

const landingsTypeChangeSchema = Joi.object({
  landingsEntryOption: Joi.string().required(),
  landingsEntryConfirmation: Joi.string().required(),
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().required()
});

export default landingsTypeChangeSchema;