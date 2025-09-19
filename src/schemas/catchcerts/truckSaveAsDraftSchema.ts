const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const truckSaveAsDraftSchema = Joi.object({
  vehicle: Joi.string().optional(),
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
  cmr: Joi.string().optional(),
  nationalityOfVehicle: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional(),
    otherwise: Joi.string().trim().optional()
  }),
  registrationNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
    otherwise: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\- ]+$/)
  }),
  freightBillNumber: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
    otherwise: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/)
  }),
  journey: Joi.string(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max(Joi.ref('exportDateTo')).optional()
    }),
    otherwise: Joi.any()
  }),
  exportDateTo: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.date().optional()
    }),
    otherwise: Joi.any()
  }),
  departureCountry: Joi.string().allow('').optional(),
  departurePort: Joi.string().allow('').trim().max(50).regex(/^[a-zA-Z0-9\-"' ]+$/).optional(),
  departureDate: Joi.date().allow('').format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).optional()
})

export default truckSaveAsDraftSchema;
