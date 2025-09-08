const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const trainSchema = Joi.object({
  vehicle: Joi.string().optional(),
  arrival: Joi.boolean().optional(),
  exportedTo: Joi.any().optional(),
  railwayBillNumber: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').alphanum().max(15).optional(),
    otherwise: Joi.string().trim().alphanum().max(15).required()
  }),
  freightBillNumber: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/)
  }),
  journey: Joi.string(),
  exportDate: Joi.when('arrival', {
    is: true,
    then: Joi.date().allow('').optional(),
    otherwise: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY','D/M/YYYY']).max(Joi.ref('exportDateTo')).required()
  }),
  exportDateTo: Joi.when('arrival', {
    is: true,
    then: Joi.date().allow('').optional(),
    otherwise: Joi.date().required()
  }),
  departureCountry: Joi.any().allow('').optional(),
  departurePort: Joi.string().trim().allow('').optional(),
  depatureDate: Joi.date().allow('').optional()
});

export default trainSchema;
