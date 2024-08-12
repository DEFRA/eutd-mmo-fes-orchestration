import * as test from 'tape';
import * as Joi from 'joi';
import truckSchema from '../../../src/schemas/catchcerts/truckSchema';
import buildNonJsErrorObject from "../../../src/helpers/errorExtractor";

function validateNonJs(obj) {
  const res = Joi.validate(obj, truckSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, truckSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"nationalityOfVehicle" is required', path: 'nationalityOfVehicle', type: 'any.required', context: { key: 'nationalityOfVehicle' } }, { message: '"registrationNumber" is required', path: 'registrationNumber', type: 'any.required', context: { key: 'registrationNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should have no errors when present and alphanumeric', t => {

  const result = Joi.validate({nationalityOfVehicle: 'cxz$@£$fx!!c342', registrationNumber: '3k3289uf!@£!@£fdef54', departurePlace: 'Calais'}, truckSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: {
      nationalityOfVehicle: 'cxz$@£$fx!!c342',
      registrationNumber: '3k3289uf!@£!@£fdef54',
      departurePlace: 'Calais'
    }
  });

  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode', t => {

  t.deepEqual(validateNonJs({}),
    { nationalityOfVehicle: 'error.nationalityOfVehicle.any.required', registrationNumber: 'error.registrationNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({nationalityOfVehicle:'uk',departurePlace:'york'}),
    { registrationNumber: 'error.registrationNumber.any.required' }
  );
  t.end();
});