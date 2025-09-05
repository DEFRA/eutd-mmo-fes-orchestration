import * as Joi from "joi";

const catchCertificateTransportSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
});

export default catchCertificateTransportSchema;

export const catchCertificateTransportCmrSchema = catchCertificateTransportSchema.append({
  vehicle: Joi.string().valid("truck").required(),
  cmr: Joi.string().valid("true", "false").required(),
})