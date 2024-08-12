  import * as Joi from 'joi';

const transportSelectionSchema = Joi.object({
  journey: Joi.string(),
  vehicle: Joi.string().required()
});

export default transportSelectionSchema;
