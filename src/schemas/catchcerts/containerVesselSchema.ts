const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const containerVesselSchema = Joi.object({
  vehicle: Joi.string().optional(),
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
  vesselName: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/).required(),
  flagState: Joi.string().trim().required(),
  containerNumber: Joi.string().trim().regex(/^[a-zA-Z0-9 ]*$/).max(50).required(),
  departurePlace: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).required(),
  journey: Joi.string(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY','D/M/YYYY']).max(Joi.ref('exportDateTo')).required(),
    otherwise: Joi.any()
  }),
  exportDateTo: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.date().required(),
    otherwise: Joi.any()
  })
});

export default containerVesselSchema;
