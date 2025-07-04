const BaseJoi = require('@hapi/joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

const truckSchema = Joi.object({
  vehicle: Joi.string().optional(),
  exportedTo: Joi.any().optional(),
  cmr: Joi.string().optional(),
  nationalityOfVehicle: Joi.string().trim().required(),
  registrationNumber: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
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

export default truckSchema;
