import * as Joi from "joi";

const catchCertificateTransportDocumentsSaveAndContinueSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  documents: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(50).empty(''),
      reference: Joi.string().trim().max(50).empty(''),
    }).and('name', 'reference')
  ).required()
});

export default catchCertificateTransportDocumentsSaveAndContinueSchema;