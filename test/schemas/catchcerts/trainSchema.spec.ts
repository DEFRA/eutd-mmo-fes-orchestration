import * as test from 'tape';
import * as Joi from 'joi';
import trainSchema from '../../../src/schemas/catchcerts/trainSchema';
import buildNonJsErrorObject from "../../../src/helpers/errorExtractor";

function validateNonJs(obj) {
  const res = Joi.validate(obj, trainSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"railwayBillNumber" is required', path: 'railwayBillNumber', type: 'any.required', context: { key: 'railwayBillNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should assert alphanumeric', t => {

  const result = Joi.validate({railwayBillNumber: '£@$@$@$', departurePlace: 'Paris'}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [
      {
        message: '"railwayBillNumber" must only contain alpha-numeric characters',
        path: 'railwayBillNumber',
        type: 'string.alphanum',
        context: {
          value: '£@$@$@$',
          key: 'railwayBillNumber'
        }
      }
      ]
  );
  t.end();
});

test('Should have no errors when present and alphanumeric', t => {

  const result = Joi.validate({railwayBillNumber: '4mn23b42n2m3442m3', departurePlace: 'Paris'}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: { railwayBillNumber: '4mn23b42n2m3442m3', departurePlace: 'Paris' }
  });

  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode_train', t => {

  t.deepEqual(validateNonJs({}),
    { railwayBillNumber: 'error.railwayBillNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({railwayBillNumber: '416'}),
    { departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});
