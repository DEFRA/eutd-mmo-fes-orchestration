const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const containerVesselSchema = Joi.object({
  vehicle: Joi.string().optional(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY','D/M/YYYY']).max(Joi.ref('exportDateTo')).required(),
    otherwise: Joi.any()
  }),
  arrival: Joi.boolean().optional(),
  exportedTo: Joi.when('arrival', {
    is: true,
    then: Joi.any().optional(),
    otherwise: Joi.object({
      officialCountryName: Joi.string().required(),
      isoCodeAlpha2: Joi.string().optional(),
      isoCodeAlpha3: Joi.string().optional(),
      isoNumericCode: Joi.string().optional()
    }).required()
  }),
  vesselName: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/)
  }),
  flagState: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-' ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-' ]+$/)
  }),
  containerNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9 ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9 ]+$/)
  }),
  containerNumbers: Joi.when('arrival', {
    is: true,
    then: Joi.array()
      .items(
        Joi.string().trim().max(50).regex(/^[a-zA-Z0-9]+$/).allow('')
      )
      .max(5)
      .optional(),
    otherwise: Joi.any()
  }),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).required()
  }),
  freightBillNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(60).regex(/^[a-zA-Z0-9\-./ ]+$/),
    otherwise: Joi.string().trim().required().max(60).regex(/^[a-zA-Z0-9\-./ ]+$/)
  }),
  departurePort: Joi.string().trim().optional().max(50).regex(/^[a-zA-Z0-9\-']+$/),
  journey: Joi.string(),
  departureDate: Joi.date().allow('').format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY','D/M/YYYY']).optional(),
  exportDateTo: Joi.when('arrival', {
    is: true,
    then: Joi.date().optional(),
    otherwise: Joi.date().iso().required(), // Allow ISO format
  }),
});

export default containerVesselSchema;
