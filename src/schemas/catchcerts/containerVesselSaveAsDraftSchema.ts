const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const containerVesselSaveAsDraftSchema = Joi.object({
  vesselName: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'`() ]+$/).required(),
  flagState: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-' ]+$/).required(),
  containerNumber: Joi.string().trim().regex(/^[a-zA-Z0-9 ]*$/).max(50).required(),
  departurePlace: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/).required(),
  freightBillNumber: Joi.string().trim().max(60).regex(/^[a-zA-Z0-9\-./ ]*$/).optional(),
  departurePort: Joi.string().trim().max(50).regex(/^[a-zA-Z0-9\-']+$/).optional(),
  dashboardUri: Joi.string().trim().required(),
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

export default containerVesselSaveAsDraftSchema;

