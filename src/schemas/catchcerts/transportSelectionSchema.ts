  import * as Joi from 'joi';

const transportSelectionSchema = Joi.object({
  journey: Joi.string(),
  vehicle: Joi.string().required(),
  arrival: Joi.boolean().optional().default(false)
});

export default transportSelectionSchema;
