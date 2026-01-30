import * as Joi from "joi";

const catchCertificateTransportDetailsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  nationalityOfVehicle: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().required().messages({
        'any.required': 'error.nationalityOfVehicle.any.required',
        'string.empty': 'error.nationalityOfVehicle.string.empty',
      }),
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
  containerNumbers: Joi.alternatives().conditional('vehicle', {
    switch: [
      {
        is: 'truck',
        then: Joi.array()
          .items(Joi.string().trim().max(150).regex(/^[A-Z]{3}[UJZR]\d{7}$/i).allow(''))
          .max(5)
          .optional(),
      },
      {
        is: 'train',
        then: Joi.array()
          .items(Joi.string().trim().max(150).regex(/^[A-Z]{4}\d{7}$/i).allow(''))
          .max(5)
          .optional(),
      },
    ],
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
    is: 'plane',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9 ]+$/).required().messages({
        'any.required': 'error.containerNumber.plane.any.required',
        'string.empty': 'error.containerNumber.plane.string.empty',
        'string.pattern.base': 'error.containerNumber.plane.string.pattern.base',
      }),
    }),
    otherwise: Joi.when('vehicle', {
      is: 'containerVessel',
      then: Joi.when('$query.draft', {
        is: true,
        then: Joi.any(),
        otherwise: Joi.string().trim().max(50).regex(/^[A-Z]{3}[UJZR]\d{7}$/).required().messages({
          'any.required': 'error.containerNumber.containerVessel.any.required',
          'string.empty': 'error.containerNumber.containerVessel.string.empty',
          'string.pattern.base': 'error.containerNumber.string.pattern.base'
        }),
      }),
      otherwise: Joi.forbidden(),
    }),
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
