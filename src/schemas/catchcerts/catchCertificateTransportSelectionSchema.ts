import * as Joi from "@hapi/joi";

const catchCertificateTransportSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required()
});

export default catchCertificateTransportSchema;