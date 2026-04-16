import * as Joi from "joi";
import { validateNoEmoji } from '../../validators/emojiValidator';

const catchCertificateTransportDocumentsSchema = Joi.object({
  id: Joi.string().required(),
  vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required(),
  documents: Joi.when('$query.draft', {
    is: true,
    then: Joi.array(),
    otherwise: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().max(50).custom(validateNoEmoji).required(),
          reference: Joi.string().trim().max(50).custom(validateNoEmoji).required()
        })
      ).min(1).required()
  }),
  isDraft: Joi.boolean(),
});

export default catchCertificateTransportDocumentsSchema;