const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const containerVesselSchema = Joi.object({
  vehicle: Joi.string().optional(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max(Joi.ref('exportDateTo')).required()
    }),
    otherwise: Joi.any()
  }),
  arrival: Joi.boolean().optional(),
  exportedTo: Joi.when('arrival', {
    is: true,
    then: Joi.any().optional(),
    otherwise: Joi.object({
      officialCountryName: Joi.string().required(),
      isoCodeAlpha2: Joi.string().allow(null).allow('').optional(),
      isoCodeAlpha3: Joi.string().allow(null).allow('').optional(),
      isoNumericCode: Joi.string().allow(null).allow('').optional()
    }).required()
  }),
  vesselName: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/),
  flagState: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-' ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-' ]+$/)
  }),
  containerNumber: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9 ]+$/).optional(),
  containerNumbers: Joi.when('arrival', {
    is: true,
    then: Joi.array()
      .items(Joi.string().trim().max(50).regex(/^[a-zA-Z0-9]+$/).allow(''))
      .max(5)
      .optional(),
    otherwise: Joi.array()
      .items(Joi.string().trim().max(50).regex(/^[a-zA-Z0-9]+$/))
      .min(1)
      .max(5)
      .required()
  }),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).required()
  }),
  freightBillNumber: Joi.string().allow('').allow(null).trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  departurePort: Joi.string().trim().allow('').allow(null).optional().max(50).regex(/^[a-zA-Z0-9\-'\s]+$/),
  placeOfUnloading: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
    otherwise: Joi.string().trim().allow('').allow(null).optional().max(50).regex(/^[a-zA-Z0-9\- ]+$/)
  }),
  journey: Joi.string(),
  departureDate: Joi.date().allow('').allow(null).format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max("now").optional(),
  exportDateTo: Joi.when('arrival', {
    is: true,
    then: Joi.date().optional(),
    otherwise: Joi.date().iso().required(),
  }),
  departureCountry: Joi.string().allow('').allow(null).optional()
});

export default containerVesselSchema;
