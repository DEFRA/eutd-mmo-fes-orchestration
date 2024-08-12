import * as test from 'tape';
import * as Joi from 'joi';
import transportSelectionSchema from '../../../src/schemas/catchcerts/transportSelectionSchema';

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, transportSelectionSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"vehicle" is required', path: 'vehicle', type: 'any.required', context: { key: 'vehicle' } } ]
  );
  t.end();
});

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({
    vehicle: '853765834',
  }, transportSelectionSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: {vehicle: '853765834'}
  });
  t.end();
});
