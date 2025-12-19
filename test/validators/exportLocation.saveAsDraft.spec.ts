import * as test from 'tape';
import * as Joi from 'joi';

// Validation schema for /v1/export-location/saveAsDraft endpoint
const saveAsDraftSchema = Joi.object({
  pointOfDestination: Joi.string().allow('').allow(null).optional().max(100)
}).unknown(true).custom((value, _helpers) => {
  // Clear pointOfDestination if it only contains alphanumeric, hyphens, and apostrophes (no spaces or slashes)
  if (value.pointOfDestination && /^[a-zA-Z0-9\-']+$/.test(value.pointOfDestination)) {
    value.pointOfDestination = '';
  }
  return value;
});

test('saveAsDraft validation - pointOfDestination should accept empty string', (t) => {
  const payload = { pointOfDestination: '', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, '', 'pointOfDestination should remain empty');
  t.end();
});

test('saveAsDraft validation - pointOfDestination should accept null', (t) => {
  const payload = { pointOfDestination: null, exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, null, 'pointOfDestination should remain null');
  t.end();
});

test('saveAsDraft validation - pointOfDestination should be optional (missing field)', (t) => {
  const payload = { exportedTo: 'France' };
  const { error } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error when pointOfDestination is missing');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with valid characters (spaces, slashes) should NOT be cleared', (t) => {
  const payload = { pointOfDestination: "Port-of-Le Havre ABC123 O'Connor's Bay/Terminal", exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, "Port-of-Le Havre ABC123 O'Connor's Bay/Terminal", 'pointOfDestination should remain unchanged');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with ONLY alphanumeric and hyphens SHOULD be cleared', (t) => {
  const payload = { pointOfDestination: 'ABC123-XYZ', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, '', 'pointOfDestination should be cleared to empty string');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with ONLY alphanumeric and apostrophes SHOULD be cleared', (t) => {
  const payload = { pointOfDestination: "ABC123'DEF", exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, '', 'pointOfDestination should be cleared to empty string');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with ONLY letters SHOULD be cleared', (t) => {
  const payload = { pointOfDestination: 'Rotterdam', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, '', 'pointOfDestination should be cleared to empty string');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with ONLY numbers SHOULD be cleared', (t) => {
  const payload = { pointOfDestination: '12345', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, '', 'pointOfDestination should be cleared to empty string');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with spaces should NOT be cleared', (t) => {
  const payload = { pointOfDestination: 'Port of Rotterdam', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, 'Port of Rotterdam', 'pointOfDestination should remain unchanged when it contains spaces');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with slashes should NOT be cleared', (t) => {
  const payload = { pointOfDestination: 'Terminal/Dock', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, 'Terminal/Dock', 'pointOfDestination should remain unchanged when it contains slashes');
  t.end();
});

test('saveAsDraft validation - pointOfDestination exceeding 100 characters should fail', (t) => {
  const payload = { pointOfDestination: 'A'.repeat(101), exportedTo: 'France' };
  const { error } = saveAsDraftSchema.validate(payload);
  
  t.ok(error, 'should have validation error');
  if (error) {
    t.equals(error.details[0].type, 'string.max', 'error should be string.max');
  }
  t.end();
});

test('saveAsDraft validation - pointOfDestination at 100 character boundary should pass', (t) => {
  const longValue = 'A'.repeat(100);
  const payload = { pointOfDestination: longValue, exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error at 100 char boundary');
  // Since it's all letters, it should be cleared
  t.equals(value.pointOfDestination, '', 'pointOfDestination with only letters should be cleared');
  t.end();
});

test('saveAsDraft validation - pointOfDestination with mixed valid characters should NOT be cleared', (t) => {
  const payload = { pointOfDestination: 'Port123 ABC/XYZ', exportedTo: 'France' };
  const { error, value } = saveAsDraftSchema.validate(payload);
  
  t.error(error, 'should not have validation error');
  t.equals(value.pointOfDestination, 'Port123 ABC/XYZ', 'pointOfDestination with spaces should NOT be cleared');
  t.end();
});

test('saveAsDraft validation - comparison: alphanumeric only vs alphanumeric with space', (t) => {
  // Case 1: Only alphanumeric - should be cleared
  const payload1 = { pointOfDestination: 'ABC123', exportedTo: 'France' };
  const result1 = saveAsDraftSchema.validate(payload1);
  t.equals(result1.value.pointOfDestination, '', 'alphanumeric only should be cleared');
  
  // Case 2: Alphanumeric with space - should NOT be cleared
  const payload2 = { pointOfDestination: 'ABC 123', exportedTo: 'France' };
  const result2 = saveAsDraftSchema.validate(payload2);
  t.equals(result2.value.pointOfDestination, 'ABC 123', 'alphanumeric with space should NOT be cleared');
  
  t.end();
});
