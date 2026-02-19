import * as test from 'tape';
import * as Joi from 'joi';
import planeSaveAsDraftSchema from '../../../src/schemas/catchcerts/planeSaveAsDraftSchema';

test('planeSaveAsDraftSchema - should allow valid container numbers in any format', t => {
  const validContainerNumbers = [
    'ABCD1234567',    // Invalid ISO format but should pass in draft mode
    'ABCJ0123456',    // Valid ISO format
    'TEST123',        // Short
    '',               // Empty
    'ABC DEF 123'     // With spaces
  ];

  validContainerNumbers.forEach(containerNumber => {
    const result = Joi.validate({
      vehicle: 'plane',
      arrival: false,
      containerNumbers: [containerNumber],
      journey: 'storageNotes'
    }, planeSaveAsDraftSchema, {
      abortEarly: false
    });

    t.equal(result.error, null, `Container number "${containerNumber}" should be valid in save as draft mode`);
  });

  t.end();
});

test('planeSaveAsDraftSchema - should reject container numbers exceeding max length', t => {
  const longContainer = 'A'.repeat(51); // Exceeds 50 char limit

  const result = Joi.validate({
    vehicle: 'plane',
    arrival: false,
    containerNumbers: [longContainer],
    journey: 'storageNotes'
  }, planeSaveAsDraftSchema, {
    abortEarly: false
  });

  t.notEqual(result.error, null, 'Container number exceeding 50 chars should fail');
  t.ok(result.error.details.some(d => d.message.includes('max')), 'Error should mention max length');
  t.end();
});

test('planeSaveAsDraftSchema - should allow empty/optional fields for save as draft', t => {
  const minimalPayload = {
    vehicle: 'plane',
    arrival: false,
    journey: 'storageNotes'
  };

  const result = Joi.validate(minimalPayload, planeSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Minimal payload with only required fields should pass');
  t.end();
});

test('planeSaveAsDraftSchema - should allow partial date input for save as draft', t => {
  const result = Joi.validate({
    vehicle: 'plane',
    arrival: false,
    journey: 'storageNotes',
    exportDate: '', // Empty date should be allowed
  }, planeSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Empty exportDate should be valid in save as draft mode');
  t.end();
});

test('planeSaveAsDraftSchema - should allow valid exportDate formats', t => {
  const validDates = [
    '19/02/2026',
    '19/2/2026',
    '9/02/2026',
    '9/2/2026',
    ''
  ];

  validDates.forEach(date => {
    const result = Joi.validate({
      vehicle: 'plane',
      arrival: false,
      journey: 'storageNotes',
      exportDate: date,
      exportDateTo: '2026-12-31T00:00:00.000Z'
    }, planeSaveAsDraftSchema, {
      abortEarly: false
    });

    t.equal(result.error, null, `Date "${date}" should be valid`);
  });

  t.end();
});

test('planeSaveAsDraftSchema - should allow optional fields with empty strings', t => {
  const payload = {
    vehicle: 'plane',
    arrival: false,
    journey: 'storageNotes',
    pointOfDestination: '',
    airwayBillNumber: '',
    flightNumber: '',
    departurePlace: '',
    freightBillNumber: '',
    departureDate: ''
  };

  const result = Joi.validate(payload, planeSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'All optional fields with empty strings should pass in save as draft mode');
  t.end();
});

test('planeSaveAsDraftSchema - should allow arrival transport validation', t => {
  const arrivalPayload = {
    vehicle: 'plane',
    arrival: true, // Arrival mode
    journey: 'storageNotes',
    departureCountry: '',
    departurePort: '',
    departureDate: ''
  };

  const result = Joi.validate(arrivalPayload, planeSaveAsDraftSchema, {
    abortEarly: false
  });

  t.equal(result.error, null, 'Arrival transport with empty fields should pass in save as draft mode');
  t.end();
});
