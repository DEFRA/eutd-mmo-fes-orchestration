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
      isoCodeAlpha2: Joi.string().allow(null).allow('').optional(),
      isoCodeAlpha3: Joi.string().allow(null).allow('').optional(),
      isoNumericCode: Joi.string().allow(null).allow('').optional()
    }).required()
  }),
  pointOfDestination: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').allow(null).optional().max(100).regex(/^[a-zA-Z0-9\-' /]+$/),
    otherwise: Joi.string().empty('').trim().required().max(100).regex(/^[a-zA-Z0-9\-' /]+$/)
  }),
  cmr: Joi.string().optional(),
  nationalityOfVehicle: Joi.string().trim().required(),
  registrationNumber: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
  freightBillNumber: Joi.string().allow('').allow(null).trim().max(60).regex(/^[a-zA-Z0-9-./]*$/).optional(),
  containerNumbers: Joi.array()
    .items(Joi.string().trim().max(50).regex(/^$|^[A-Z]{3}[UJZR]\d{7}$/).allow('').messages({
      'string.pattern.base': 'error.containerNumbers.string.pattern.base'
    }))
    .max(5)
    .optional(),
  departurePlace: Joi.when('arrival', {
    is: true,
    then: Joi.string().trim().allow('').allow(null).optional().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/),
    otherwise: Joi.string().trim().required().max(50).regex(/^[a-zA-Z0-9\-'` ]+$/)
  }),
  placeOfUnloading: Joi.when('arrival', {
    is: true,
    then: Joi.string().empty('').trim().required().max(50).regex(/^[a-zA-Z0-9\- ]+$/),
    otherwise: Joi.string().trim().allow('').allow(null).optional().max(50).regex(/^[a-zA-Z0-9\- ]+$/)
  }),
  journey: Joi.string(),
  facilityArrivalDate: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).optional(),
  exportDate: Joi.when('journey', {
    is: 'storageNotes',
    then: Joi.when('arrival', {
      is: true,
      then: Joi.date().allow('').optional(),
      otherwise: Joi.when('facilityArrivalDate', {
        is: Joi.exist(),
        then: Joi.date()
          .format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY'])
          .max(Joi.ref('exportDateTo'))
          .min(Joi.ref('facilityArrivalDate'))
          .required(),
        otherwise: Joi.date()
          .format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY'])
          .max(Joi.ref('exportDateTo'))
          .required()
      })
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
  departureCountry: Joi.when('arrival', {
    is: true,
    then: Joi.string().empty('').required(),
    otherwise: Joi.string().allow('').allow(null).optional()
  }),
  departurePort: Joi.when('arrival', {
    is: true,
    then: Joi.string().empty('').trim().required().max(50).regex(/^[a-zA-Z0-9\-"' ]+$/),
    otherwise: Joi.string().allow('').allow(null).trim().max(50).regex(/^[a-zA-Z0-9\-"' ]+$/).optional()
  }),
  departureDate: Joi.when('arrival', {
    is: true,
    then: Joi.date().format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).empty('').max('now').required(),
    otherwise: Joi.date().allow('').allow(null).format(['DD/MM/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'D/M/YYYY']).max('now').optional()
  })
})

export default truckSchema;
