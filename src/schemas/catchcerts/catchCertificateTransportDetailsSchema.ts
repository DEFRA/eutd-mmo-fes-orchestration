import * as Joi from "@hapi/joi";

const catchCertificateTransportDetailsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  nationalityOfVehicle: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.string().trim().required(),
    otherwise: Joi.any()
  }),
  registrationNumber: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
    otherwise: Joi.any()
  }),
  flightNumber: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.string().trim().alphanum().max(15).required(),
    otherwise: Joi.any()
  }),
  containerNumber: Joi.when('vehicle', {
    is: Joi.valid('plane', 'containerVessel'),
    then: Joi.string().trim().alphanum().max(50).required(),
    otherwise: Joi.any()
  }),
  railwayBillNumber: Joi.when('vehicle', {
    is: 'train',
    then: Joi.string().trim().alphanum().max(15).required(),
    otherwise: Joi.any()
  }),
  vesselName: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/).required(),
    otherwise: Joi.any()
  }),
  flagState: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.string().trim().required(),
    otherwise: Joi.any()
  }),
  departurePlace: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
  freightBillNumber: Joi.string().trim().optional().max(60)
});

export default catchCertificateTransportDetailsSchema;