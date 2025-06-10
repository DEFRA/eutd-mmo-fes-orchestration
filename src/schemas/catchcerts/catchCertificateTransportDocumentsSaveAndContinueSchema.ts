import * as Joi from "@hapi/joi";

const catchCertificateTransportDocumentsSaveAndContinueSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  documents: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(50).required(),
      reference: Joi.string().trim().max(50).required()
    })
  ).required()
});

export default catchCertificateTransportDocumentsSaveAndContinueSchema;