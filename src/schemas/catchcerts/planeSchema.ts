const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const schema = Joi.object({
  vehicle: Joi.string().optional(),
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
  airwayBillNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9-./]+$/),
    otherwise: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9-./]+$/)
  }),
  flightNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').alphanum().max(15).optional(),
    otherwise: Joi.string().trim().alphanum().max(15).required()
  }),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/)
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
      .max(5)
      .required()
  }),
  freightBillNumber: Joi.string().allow('').allow(null).trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  journey: Joi.string(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max(Joi.ref('exportDateTo')).required()
    }),
    otherwise: Joi.any()
  }),
  exportDateTo: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.date().required()
    }),
    otherwise: Joi.any()
  }),
  departureCountry: Joi.string().allow('').optional(),
  departurePort: Joi.string().allow('').trim().max(50).regex(/^[a-zA-Z0-9\-"' ]+$/).optional(),
  departureDate: Joi.date().allow('').format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max("now").optional()
});

export default schema;