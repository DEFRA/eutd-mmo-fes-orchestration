import * as test from 'tape';
import * as Joi from 'joi';
import trainSaveAsDraftSchema from '../../../src/schemas/catchcerts/trainSaveAsDraftSchema';

test('trainSaveAsDraftSchema - should allow any container format in save as draft mode', t => {
  const validContainers = [
    'ABCD1234567',
    'ANY-STRING-123',
    'TEST',
    ''
  ];

  validContainers.forEach(container => {
    const result = Joi.validate({
      vehicle: 'train',
      arrival: false,
      containerNumbers: [container],
      journey: 'storageNotes'
    }, trainSaveAsDraftSchema, {
      abortEarly: false
    });

    t.equal(result.error, null, `Container "${container}" should be valid`);
  });

  t.end();
});

test('trainSaveAsDraftSchema - should allow empty railway bill number', t => {
  const result = Joi.validate({
    vehicle: 'train',
    arrival: false,
    journey: 'storageNotes',
    railwayBillNumber: ''
  }, trainSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Empty railway bill number should pass');
  t.end();
});

test('trainSaveAsDraftSchema - should allow all optional fields empty', t => {
  const payload = {
    vehicle: 'train',
    arrival: false,
    journey: 'storageNotes',
    railwayBillNumber: '',
    departurePlace: '',
    freightBillNumber: '',
    exportDate: ''
  };

  const result = Joi.validate(payload, trainSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'All optional fields empty should pass');
  t.end();
});

test('trainSaveAsDraftSchema - should reject containers over max length', t => {
  const longContainer = 'A'.repeat(51);

  const result = Joi.validate({
    vehicle: 'train',
    arrival: false,
    containerNumbers: [longContainer],
    journey: 'storageNotes'
  }, trainSaveAsDraftSchema, {
    abortEarly: false
  });

  t.notEqual(result.error, null, 'Container over 50 chars should fail');
  t.end();
});
