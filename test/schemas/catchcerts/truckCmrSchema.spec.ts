import * as test from 'tape';
import * as Joi from 'joi';
import truckCmrSchema from '../../../src/schemas/catchcerts/truckCmrSchema';

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, truckCmrSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [
      {
        message: '"cmr" is required',
        path: 'cmr',
        type: 'any.required',
        context: { key: 'cmr' }
      }
    ]
  );
  t.end();
});

test('Should have no errors when present', t => {

  const result = Joi.validate({cmr: '123124243'}, truckCmrSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: {
      cmr: '123124243',
    }
  });

  t.end();
});
