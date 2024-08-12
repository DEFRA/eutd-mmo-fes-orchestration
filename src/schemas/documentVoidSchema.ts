import * as Joi from 'joi';

const documentVoidSchema = Joi.object({
  documentVoid: Joi.string().required()
});

export default documentVoidSchema;
