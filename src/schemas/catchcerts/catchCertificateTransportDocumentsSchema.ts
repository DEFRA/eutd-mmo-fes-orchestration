import * as Joi from "@hapi/joi";

const catchCertificateTransportDocumentsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  documents: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(50).required(),
      reference: Joi.string().trim().max(50).required()
    })
  ).min(1).required()
});

export default catchCertificateTransportDocumentsSchema;