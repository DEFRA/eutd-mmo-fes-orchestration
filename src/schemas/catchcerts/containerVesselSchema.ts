const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const containerVesselSchema = Joi.object({
  vehicle: Joi.string().optional(),
  exportedTo: Joi.any().optional(),
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
