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
      otherwise: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max(Joi.ref('exportDateTo')).optional()
    }),
    otherwise: Joi.any()
  }),
  arrival: Joi.boolean().optional(),
  exportedTo: Joi.when('arrival', {
    is: true,
    then: Joi.any().optional(),
    otherwise: Joi.object({
      officialCountryName: Joi.string().optional(),
      isoCodeAlpha2: Joi.string().allow(null).allow('').optional(),
      isoCodeAlpha3: Joi.string().allow(null).allow('').optional(),
      isoNumericCode: Joi.string().allow(null).allow('').optional()
    }).optional()
  }),
  pointOfDestination: Joi.string().trim().allow('').allow(null).optional().max(100).regex(/^[a-zA-Z0-9\-' /]+$/),
  vesselName: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/),
    otherwise: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/)
  }),
  flagState: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-' ]+$/),
    otherwise: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-' ]+$/)
  }),
  containerNumber: Joi.string().trim().optional().max(50).regex(/^[a-zA-Z0-9 ]+$/).optional(),
  containerNumbers: Joi.when('arrival', {
    is: true,
    then: Joi.array()
      .items(
        Joi.string().trim().allow('')
      )
      .max(10)
      .optional(),
    otherwise: Joi.any()
  }),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().trim().allow('').max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).optional()
  }),
  freightBillNumber: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  departurePort: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'\s]+$/),
  journey: Joi.string(),
  departureDate: Joi.date().allow('').format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY','D/M/YYYY']).optional(),
  exportDateTo: Joi.when('arrival', {
    is: true,
    then: Joi.date().optional(),
    otherwise: Joi.date().iso().optional(),
  }),
  departureCountry: Joi.string().allow('').optional()
});

export default containerVesselSchema;
