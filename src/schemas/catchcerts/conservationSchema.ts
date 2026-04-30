import * as Joi from 'joi';
import { validateNoEmoji } from '../../validators/emojiValidator';

const conservationSchema = Joi.object({
  caughtInUKWaters: Joi.any(),
  caughtInEUWaters: Joi.any(),
  caughtInOtherWaters: Joi.any(),
  otherWaters: Joi.when('caughtInOtherWaters', {
    is: 'Y',
    then: Joi.string().custom(validateNoEmoji).required(),
    otherwise: Joi.any()
  })
}).or( 'caughtInUKWaters', 'caughtInEUWaters', 'caughtInOtherWaters' ).label('watersCaughtIn');


export default conservationSchema;
