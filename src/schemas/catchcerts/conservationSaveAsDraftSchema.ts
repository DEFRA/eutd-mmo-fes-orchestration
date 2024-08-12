import * as Joi from 'joi';

const conservationSaveAsDraftSchema = Joi.object().keys({
  caughtInUKWaters: Joi.any(),
  caughtInEUWaters: Joi.any(),
  caughtInOtherWaters: Joi.any(),
  currentUri: Joi.string().trim().required(),
  journey: Joi.string().trim().required(),
  dashboardUri: Joi.string().trim().required(),
  otherWaters: Joi.when('caughtInOtherWaters', {
    is: 'Y',
    then: Joi.string().required(),
    otherwise: Joi.any()
  })
}).or( 'caughtInUKWaters', 'caughtInEUWaters', 'caughtInOtherWaters' ).label('watersCaughtIn');

export default conservationSaveAsDraftSchema;