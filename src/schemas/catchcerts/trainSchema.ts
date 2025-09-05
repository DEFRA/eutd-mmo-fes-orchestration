const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const trainSchema = Joi.object({
  vehicle: Joi.string().optional(),
  exportedTo: Joi.any().optional(),
  railwayBillNumber: Joi.string().trim().alphanum().max(15).required(),
  departurePlace: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
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

export default trainSchema;
