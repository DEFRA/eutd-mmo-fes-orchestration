import * as test from 'tape';
import * as Joi from 'joi';
import containerVesselSaveAsDraftSchema from '../../../src/schemas/catchcerts/containerVesselSaveAsDraftSchema';

test('containerVesselSaveAsDraftSchema - should allow any container format for arrival transport', t => {
  const validContainers = [
    'ABCD1234567',    // Invalid ISO but allowed in draft
    'ABCJ0123456',    // Valid ISO
    'SIMPLE123',
    ''
  ];

  validContainers.forEach(container => {
    const result = Joi.validate({
      vehicle: 'containerVessel',
      arrival: true,  // Arrival mode
      containerNumbers: [container],
      journey: 'storageNotes'
    }, containerVesselSaveAsDraftSchema, {
      abortEarly: false
    });

    t.equal(result.error, null, `Container "${container}" should be valid for arrival`);
  });

  t.end();
});

test('containerVesselSaveAsDraftSchema - should allow empty vessel fields', t => {
  const payload = {
    vehicle: 'containerVessel',
    arrival: false,
    journey: 'storageNotes',
    vesselName: '',
    flagState: '',
    departurePlace: '',
    freightBillNumber: '',
    exportDate: ''
  };

  const result = Joi.validate(payload, containerVesselSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'All optional fields empty should pass');
  t.end();
});

test('containerVesselSaveAsDraftSchema - should reject containers over max length', t => {
  const longContainer = 'A'.repeat(51);

  const result = Joi.validate({
    vehicle: 'containerVessel',
    arrival: true,
    containerNumbers: [longContainer],
    journey: 'storageNotes'
  }, containerVesselSaveAsDraftSchema, {
    abortEarly: false
  });

  t.notEqual(result.error, null, 'Container over 50 chars should fail');
  t.end();
});

test('containerVesselSaveAsDraftSchema - should allow departure transport without container validation', t => {
  const result = Joi.validate({
    vehicle: 'containerVessel',
    arrival: false,  // Departure mode - containerNumbers validation different
    journey: 'storageNotes'
  }, containerVesselSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Departure mode should allow minimal fields');
  t.end();
});
