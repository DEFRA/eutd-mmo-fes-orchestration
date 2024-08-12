import * as test from 'tape';
import * as Joi from 'joi';
import planeSchema from '../../../src/schemas/catchcerts/planeSchema';
import {buildNonJsErrorObject} from "../../../src/helpers/errorExtractor";

function validateNonJs(obj) {
  const res = Joi.validate(obj, planeSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject(res.error, obj);
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, planeSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"flightNumber" is required', path: 'flightNumber', type: 'any.required', context: { key: 'flightNumber' } }, { message: '"containerNumber" is required', path: 'containerNumber', type: 'any.required', context: { key: 'containerNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({flightNumber: '123456789', containerNumber: '853765834', departurePlace: 'Paris'}, planeSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {error: null, value: {flightNumber: '123456789', containerNumber: '853765834', departurePlace: 'Paris'}});
  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode', t => {

  t.deepEqual(validateNonJs({}),
  { flightNumber: 'error.flightNumber.any.required', containerNumber: 'error.containerNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({flightNumber:'',containerNumber:'1A234',departurePlace:''}),
  { flightNumber: 'error.flightNumber.any.empty', departurePlace: 'error.departurePlace.any.empty' }
  );
  t.end();
});