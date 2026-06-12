import * as Joi from 'joi';
import { createEmojiAwarePatternValidator } from '../../validators/emojiValidator';

const conservationSaveAsDraftSchema = Joi.object().keys({
  caughtInUKWaters: Joi.any(),
  caughtInEUWaters: Joi.any(),
  caughtInOtherWaters: Joi.any(),
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().trim().required(),
  dashboardUri: Joi.string().trim().required(),
  otherWaters: Joi.when('caughtInOtherWaters', {
    is: 'Y',
    then: Joi.string().custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-' ]+$/)).required(),
    otherwise: Joi.any()
  })
}).or( 'caughtInUKWaters', 'caughtInEUWaters', 'caughtInOtherWaters' ).label('watersCaughtIn');

export default conservationSaveAsDraftSchema;