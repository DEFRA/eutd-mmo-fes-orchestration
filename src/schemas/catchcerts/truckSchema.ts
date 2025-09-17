const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const truckSchema = Joi.object({
  vehicle: Joi.string().optional(),
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
  cmr: Joi.string().optional(),
  nationalityOfVehicle: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional(),
    otherwise: Joi.string().trim().required()
  }),
  registrationNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/)
  }),
  freightBillNumber: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/)
  }),
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
  departureDate: Joi.date().allow('').format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).optional()
})

export default truckSchema;
