import * as test from 'tape';
import * as Joi from 'joi';
import conservationSchema from '../../../src/schemas/catchcerts/conservationSchema';
import buildErrorObject from "../../../src/helpers/errorExtractor";


function validate(obj) {
  const res = Joi.validate(obj, conservationSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => { // NOSONAR
  t.deepEqual( validate({}), {watersCaughtIn: 'error.watersCaughtIn.object.missing'});
  t.deepEqual( validate({caughtInUKWaters: 'Y'}), null);
  t.deepEqual( validate({caughtInEUWaters: 'Y'}), null);
  t.deepEqual( validate({caughtInOtherWaters: 'Y'}), {otherWaters: 'error.otherWaters.any.required'});
  t.deepEqual( validate({caughtInOtherWaters: 'Y', otherWaters: 'ABCD' }), null);
  t.deepEqual( validate({otherWaters: '' }), {watersCaughtIn: 'error.watersCaughtIn.object.missing'});
  t.end();
});

test('Should reject emoji characters in otherWaters', t => { // NOSONAR
  t.deepEqual( validate({caughtInOtherWaters: 'Y', otherWaters: 'Atlantic 🐟' }), {otherWaters: 'error.otherWaters.string.emoji'});
  t.deepEqual( validate({caughtInOtherWaters: 'Y', otherWaters: 'ValidWaters' }), null);
  t.ok(validate({caughtInOtherWaters: 'Y', otherWaters: 'Atlantic 🐟'}) !== null, 'emoji in otherWaters should fail validation');
  t.ok(validate({caughtInOtherWaters: 'Y', otherWaters: 'ValidWaters'}) === null, 'valid otherWaters should pass validation');
  t.end();
});
