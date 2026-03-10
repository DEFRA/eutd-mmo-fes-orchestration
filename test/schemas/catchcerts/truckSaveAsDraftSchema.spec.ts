import * as test from 'tape';
import * as Joi from 'joi';
import truckSaveAsDraftSchema from '../../../src/schemas/catchcerts/truckSaveAsDraftSchema';

test('truckSaveAsDraftSchema - should allow any container numbers in save as draft mode', t => {
  const validContainers = [
    'ABCD1234567',    // Invalid ISO format but allowed in draft
    'ABCJ0123456',    // Valid ISO format
    'TEST',           // Short alphanumeric
    '',               // Empty
  ];

  validContainers.forEach(container => {
    const result = Joi.validate({
      vehicle: 'truck',
      arrival: false,
      containerNumbers: [container],
      journey: 'storageNotes'
    }, truckSaveAsDraftSchema, {
      abortEarly: false
    });

    t.equal(result.error, null, `Container "${container}" should be valid in save as draft`);
  });

  t.end();
});

test('truckSaveAsDraftSchema - should allow empty registration number', t => {
  const result = Joi.validate({
    vehicle: 'truck',
    arrival: false,
    journey: 'storageNotes',
    registrationNumber: ''
  }, truckSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Empty registration number should pass in save as draft mode');
  t.end();
});

test('truckSaveAsDraftSchema - should allow optional fields for save as draft', t => {
  const payload = {
    vehicle: 'truck',
    arrival: false,
    journey: 'storageNotes',
    nationalityOfVehicle: '',
    registrationNumber: '',
    departurePlace: '',
    freightBillNumber: '',
    exportDate: ''
  };

  const result = Joi.validate(payload, truckSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'All optional fields empty should pass');
  t.end();
});

test('truckSaveAsDraftSchema - should reject container numbers exceeding max length', t => {
  const longContainer = 'A'.repeat(51);

  const result = Joi.validate({
    vehicle: 'truck',
    arrival: false,
    containerNumbers: [longContainer],
    journey: 'storageNotes'
  }, truckSaveAsDraftSchema, {
    abortEarly: false
  });

  t.notEqual(result.error, null, 'Container exceeding 50 chars should fail');
  t.end();
});
