import * as Joi from 'joi';

const documentDeleteSchema = Joi.object({
  documentDelete: Joi.string().required()
});

export default documentDeleteSchema;
