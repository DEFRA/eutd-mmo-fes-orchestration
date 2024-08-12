import * as Joi from 'joi';

const schema = Joi.object({
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().trim().required()
});

export default schema;