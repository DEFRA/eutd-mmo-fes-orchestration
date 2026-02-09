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

import { describe, it, expect } from '@jest/globals';
import containerVesselSchemaDefault from '../../../src/schemas/catchcerts/containerVesselSchema';

const basePayload = {
  vehicle: 'containerVessel',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  vesselName: 'MS Maersk',
  flagState: 'Denmark',
  containerNumber: 'CONT123456',
  departurePlace: 'Port of Southampton',
  journey: 'sea',
  exportDate: '',
  exportDateTo: '',
  departureCountry: 'United Kingdom',
  departurePort: 'Southampton'
};

describe('containerVesselSchema - pointOfDestination validation', () => {
  const validPayload = {
    ...basePayload,
    departureDate: '01/01/2020'
  };

  describe('when arrival is false (save-and-continue)', () => {
    it('returns any.required error when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: false };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.empty error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.empty');
    });

    it('passes validation with valid pointOfDestination', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port of Le Havre' };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Port-of-Le Havre ABC123 O'Neill's Dock/Terminal 5" };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port@Le Havre#Terminal$%' };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Port of Le Havre' };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('nonJS error mode', () => {
    it('returns correct error key when pointOfDestination is missing (arrival=false)', () => {
      const payload = { ...validPayload, arrival: false };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.any.required');
    });

    it('returns correct error key when pointOfDestination is empty string (arrival=false)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.any.empty');
    });

    it('returns correct error key when pointOfDestination exceeds max length', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.string.max');
    });

    it('returns correct error key when pointOfDestination has invalid characters', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port@Le Havre' };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.string.pattern.base');
    });
  });
});

describe('containerVesselSchema - containerNumbers validation', () => {
  const validPayload = {
    ...basePayload,
    departureDate: '01/01/2020',
    pointOfDestination: 'Port of Le Havre'
  };

  describe('required field validation', () => {
    it('returns any.required error when containerNumbers is missing', () => {
      const payload = { ...validPayload };
      delete payload.containerNumbers;
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
      expect(cnErr).toBeDefined();
      expect(cnErr.type).toBe('any.required');
    });

    it('returns any.required error when containerNumbers is undefined', () => {
      const payload = { ...validPayload, containerNumbers: undefined };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
      expect(cnErr).toBeDefined();
      expect(cnErr.type).toBe('any.required');
    });

    it('passes validation when containerNumbers is provided with valid data', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCU1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('minimum array length validation', () => {
    it('returns array.min error when containerNumbers is empty array', () => {
      const payload = { ...validPayload, containerNumbers: [] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
      expect(cnErr).toBeDefined();
      expect(cnErr.type).toBe('array.min');
    });

    it('passes validation with exactly 1 element (min boundary)', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCU1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('pattern validation - ISO container format', () => {
    it('accepts valid ISO container number format (3 letters + U/J/Z/R + 7 digits)', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCU1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container number with J equipment category', () => {
      const payload = { ...validPayload, containerNumbers: ['XYZJ9876543'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container number with Z equipment category', () => {
      const payload = { ...validPayload, containerNumbers: ['DEFZ1111111'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container number with R equipment category', () => {
      const payload = { ...validPayload, containerNumbers: ['GHIR2222222'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts multiple valid ISO container numbers', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: ['ABCU1234567', 'XYZJ9876543', 'DEFZ1111111']
      };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts empty string in array', () => {
      const payload = { ...validPayload, containerNumbers: [''] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('rejects container number with lowercase letters', () => {
      const payload = { ...validPayload, containerNumbers: ['abcu1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with invalid equipment category (not U/J/Z/R)', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCA1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with less than 7 digits', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCU123456'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with more than 7 digits', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCU12345678'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with less than 3 owner letters', () => {
      const payload = { ...validPayload, containerNumbers: ['ABU1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with more than 3 owner letters', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCDU1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with spaces', () => {
      const payload = { ...validPayload, containerNumbers: ['ABC U1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container number with special characters', () => {
      const payload = { ...validPayload, containerNumbers: ['ABC-U1234567'] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });
  });

  describe('array constraints', () => {
    it('accepts array with 5 elements', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: ['ABCU1234567', 'XYZJ9876543', 'DEFZ1111111', 'GHIR2222222', 'JKLU3333333']
      };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts array with 10 elements (max boundary)', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(10).fill('ABCU1234567')
      };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('rejects array with more than 10 elements', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(11).fill('ABCU1234567')
      };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
      expect(cnErr).toBeDefined();
      expect(cnErr.type).toBe('array.max');
    });

    it('returns string.max error when container number exceeds 50 chars', () => {
      const payload = { ...validPayload, containerNumbers: ['A'.repeat(51)] };
      const { error } = containerVesselSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.max');
    });
  });

  describe('nonJS error mode', () => {
    it('returns correct error key when containerNumbers is missing', () => {
      const payload = { ...validPayload };
      delete payload.containerNumbers;
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.any.required');
    });

    it('returns correct error key when containerNumbers is empty array', () => {
      const payload = { ...validPayload, containerNumbers: [] };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.array.min');
    });

    it('returns correct error key when container number has invalid pattern', () => {
      const payload = { ...validPayload, containerNumbers: ['INVALID123'] };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.string.pattern.base');
    });

    it('returns correct error key when container number exceeds max length', () => {
      const payload = { ...validPayload, containerNumbers: ['A'.repeat(51)] };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.string.max');
    });

    it('returns correct error key when array exceeds max size', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(11).fill('ABCU1234567')
      };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.array.max');
    });
  });
});
