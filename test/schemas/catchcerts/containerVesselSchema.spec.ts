import * as test from 'tape';
import * as Joi from 'joi';
import containerVesselSchema from '../../../src/schemas/catchcerts/containerVesselSchema';
import buildNonJsErrorObject from "../../../src/helpers/errorExtractor";

function validateNonJs(obj) {
  const res = Joi.validate(obj, containerVesselSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, containerVesselSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"vesselName" is required', path: 'vesselName', type: 'any.required', context: { key: 'vesselName' } }, { message: '"flagState" is required', path: 'flagState', type: 'any.required', context: { key: 'flagState' } }, { message: '"containerNumber" is required', path: 'containerNumber', type: 'any.required', context: { key: 'containerNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({vesselName: '123456789', flagState: '853765834', containerNumber: '4255345', departurePlace: 'Bordeaux'}, containerVesselSchema, {
    abortEarly: false
  });

  t.deepEqual(result, { error: null, value: { vesselName: '123456789', flagState: '853765834', containerNumber: '4255345', departurePlace: 'Bordeaux' } });
  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode', t => {

  t.deepEqual(validateNonJs({}),
    { vesselName: 'error.vesselName.any.required', flagState: 'error.flagState.any.required', containerNumber: 'error.containerNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({vesselName: '123456789', flagState: '853765834', containerNumber: '4255345'}),
    { departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});
