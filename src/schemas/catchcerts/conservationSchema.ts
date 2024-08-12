import * as Joi from 'joi';

const conservationSchema = Joi.object({
  caughtInUKWaters: Joi.any(),
  caughtInEUWaters: Joi.any(),
  caughtInOtherWaters: Joi.any(),
  otherWaters: Joi.when('caughtInOtherWaters', {
    is: 'Y',
    then: Joi.string().required(),
    otherwise: Joi.any()
  })
}).or( 'caughtInUKWaters', 'caughtInEUWaters', 'caughtInOtherWaters' ).label('watersCaughtIn');


export default conservationSchema;
