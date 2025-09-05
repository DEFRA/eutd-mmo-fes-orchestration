const BaseJoi = require('joi');
const Extension = require('@joi/date');
const Joi = BaseJoi.extend(Extension);

const trainSaveAsDraftSchema = Joi.object({
  railwayBillNumber: Joi.string().trim().alphanum().required(),
  departurePlace: Joi.string().trim().required(),
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

export default trainSaveAsDraftSchema;