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
      isoCodeAlpha2: Joi.string().optional(),
      isoCodeAlpha3: Joi.string().optional(),
      isoNumericCode: Joi.string().optional()
    }).required()
  }),
  flightNumber: Joi.string().trim().alphanum().max(15).required(),
  airwayBillNumber: Joi.string().allow('').trim().optional().max(50).regex(/^[a-zA-Z0-9-./]+$/),
  departurePlace: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
  containerNumber: Joi.string().trim().alphanum().max(50).required(),
  freightBillNumber: Joi.string().allow('').trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  journey: Joi.string(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max(Joi.ref('exportDateTo')).required(),
    otherwise: Joi.any()
  }),
  exportDateTo: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.date().required(),
    otherwise: Joi.any()
  })
});

export default schema;
