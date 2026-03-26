import * as Joi from "joi";
import { validateNoEmoji, createEmojiAwarePatternValidator } from '../../validators/emojiValidator';

const catchCertificateTransportDetailsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  nationalityOfVehicle: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().required().messages({
        'any.required': 'error.nationalityOfVehicle.any.required',
        'string.empty': 'error.nationalityOfVehicle.string.empty',
      }),
    }),
    otherwise: Joi.forbidden(),
  }),
  registrationNumber: Joi.when('vehicle', {
    is: 'truck',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().max(50).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\- ]+$/)).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  containerNumbers: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.array()
      .items(
        Joi.string()
          .trim()
          .custom((value, helpers) => {
            if (!value) return value;
            if (/\s/.test(value.trim())) {
              return helpers.error('string.multipleContainersNotAllowed');
            }
            if (!/^[a-zA-Z0-9]+$/.test(value)) {
              return helpers.error('string.pattern.base');
            }
            return value;
          })
          .messages({
            'string.pattern.base': 'ccAddTransportationDetailsContainerIdentificationNumberOnlyNumLettersError',
            'string.multipleContainersNotAllowed': 'ccAddTransportationDetailsPlaneContainerMultipleNotAllowedError',
          })
      )
      .min(1)
      .max(10)
      .required()
      .messages({
        'plane.array.min': 'commonAddTransportationDetailsPlaneContainerNumberLabelError',
        'any.required': 'commonAddTransportationDetailsPlaneContainerNumberLabelError'
      }),
    otherwise: Joi.when('vehicle', {
      is: 'containerVessel',
      then: Joi.array()
        .items(
          Joi.string()
            .trim()
            .regex(/^$|^[A-Z]{3}[UJZR]\d{7}$/)
            .messages({
              'string.pattern.base': 'ccShippingContainerNumberPatternError',
            })
        )
        .min(1)
        .max(10)
        .required()
        .messages({
          'container-vessel.array.min': 'ccContainerVesselContainerNumberLabelError',
          'any.required': 'ccContainerVesselContainerNumberLabelError'
        }),
      otherwise: Joi.when('vehicle', {
        is: Joi.valid('truck', 'train'),
        then: Joi.array()
          .items(
            Joi.string()
              .trim()
              .allow('')
              .regex(/^$|^[A-Z]{3}[UJZR]\d{7}$/)
              .messages({
                'string.pattern.base': 'error.containerNumbers.string.pattern.base',
              })
          )
          .max(10)
          .optional(),
        otherwise: Joi.forbidden(),
      }),
    }),
  }),
  containerIdentificationNumber: Joi.when('vehicle', {
    is: Joi.valid('truck', 'train'),
    then: Joi.string().allow('', null).trim().regex(/^$|^[A-Z]{3}[UJZR]\d{7}$/).messages({
      'string.pattern.base': 'error.containerIdentificationNumber.string.pattern.base'
    }),
    otherwise: Joi.forbidden(),
  }),
  flightNumber: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().custom(validateNoEmoji).alphanum().max(15).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  airwayBillNumber: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().allow('').max(50).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9-./]+$/)).optional()
    }),
    otherwise: Joi.forbidden(),
  }),
  containerNumber: Joi.when('vehicle', {
    is: 'plane',
    then: Joi.any().optional(),
    otherwise: Joi.when('vehicle', {
      is: 'containerVessel',
      then: Joi.any().optional(),
      otherwise: Joi.forbidden(),
    }),
  }),
  railwayBillNumber: Joi.when('vehicle', {
    is: 'train',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().custom(validateNoEmoji).alphanum().max(15).required(),
    }),
    otherwise: Joi.forbidden(),
  }),
  vesselName: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().max(50).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-'`() ]+$/)).required(),
    }),
    otherwise: Joi.forbidden()
  }),
  flagState: Joi.when('vehicle', {
    is: 'containerVessel',
    then: Joi.when('$query.draft', {
      is: true,
      then: Joi.any(),
      otherwise: Joi.string().trim().required(),
    }),
    otherwise: Joi.forbidden()
  }),
  departurePlace: Joi.when('$query.draft', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().trim().max(50).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-'` ]+$/)).required(),
  }),
  freightBillNumber: Joi.when('$query.draft', {
    is: true,
    then: Joi.string().allow('').trim().max(60).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9-./]*$/)),
    otherwise: Joi.string().trim().max(60).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9-./]+$/))
  }),
  documents: Joi.array().optional()
});

export default catchCertificateTransportDetailsSchema;
