import * as test from 'tape';
import * as Joi from 'joi';
import * as assert from 'node:assert/strict';
import trainSchema from '../../src/schemas/catchcerts/trainSchema';
import errorExtractor from '../../src/helpers/errorExtractor';

test('Should assert mandatory fields when empty', t => {

  const result = errorExtractor(Joi.validate({}, trainSchema, {
    abortEarly: false
  }).error);

  const expected = {
    railwayBillNumber: 'error.railwayBillNumber.any.required',
    departurePlace: 'error.departurePlace.any.required'
  };

  assert.deepStrictEqual(result, expected);
  t.deepEqual(result, expected);
  t.end();
});
