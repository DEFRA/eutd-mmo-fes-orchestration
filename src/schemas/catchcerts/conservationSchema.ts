import * as Joi from 'joi';
import { createEmojiAwarePatternValidator } from '../../validators/emojiValidator';

const conservationSchema = Joi.object({
  caughtInUKWaters: Joi.any(),
  caughtInEUWaters: Joi.any(),
  caughtInOtherWaters: Joi.any(),
  otherWaters: Joi.when('caughtInOtherWaters', {
    is: 'Y',
    then: Joi.string().custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-' ]+$/)).required(),
    otherwise: Joi.any()
  })
}).or( 'caughtInUKWaters', 'caughtInEUWaters', 'caughtInOtherWaters' ).label('watersCaughtIn');


export default conservationSchema;
