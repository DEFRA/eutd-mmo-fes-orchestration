import * as Joi from "joi";

const catchCertificateTransportDetailsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  nationalityOfVehicle: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  registrationNumber: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\- ]+$/).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  flightNumber: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().alphanum().max(15).required(),
     }),
    otherwise: Joi.forbidden(),
  }),
  containerNumber: Joi.when('vehicle', {
    is: Joi.valid('plane', 'containerVessel'),
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().alphanum().max(50).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  railwayBillNumber: Joi.when('vehicle', {
    is: 'train',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().alphanum().max(15).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  vesselName: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/).required(),
    }),
    otherwise: Joi.forbidden()
  }),
  flagState: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().required(),
    }),
    otherwise: Joi.forbidden()
  }),
  departurePlace: Joi.when('$query.draft', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).required(),
  }),
  freightBillNumber: Joi.when('$query.draft', {
    is: true,
    then: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/),
    otherwise: Joi.string().trim().max(60).regex(/^[a-zA-Z0-9-./]+$/)
  }),
  documents: Joi.array().optional()
});

export default catchCertificateTransportDetailsSchema;