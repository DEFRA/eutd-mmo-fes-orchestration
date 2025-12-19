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

import { describe, it, expect } from '@jest/globals';
import planeSchemaDefault from '../../../src/schemas/catchcerts/planeSchema';

const basePayload = {
  vehicle: 'plane',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  flightNumber: 'FL123',
  containerNumber: 'CONT456',
  departurePlace: 'London Heathrow',
  journey: 'air',
  exportDate: '',
  exportDateTo: '',
  departureCountry: 'United Kingdom',
  departurePort: 'Heathrow Airport'
};

describe('planeSchema - pointOfDestination validation', () => {
  const validPayload = {
    ...basePayload,
    departureDate: '01/01/2020'
  };

  describe('when arrival is false (save-and-continue)', () => {
    it('returns any.required error when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: false };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.empty error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.empty');
    });

    it('passes validation with valid pointOfDestination', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Charles de Gaulle Airport' };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Airport-Paris CDG ABC123 O'Hare/Terminal 2" };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Airport@Paris#CDG$%' };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Charles de Gaulle' };
      const { error } = planeSchemaDefault.default.validate(payload, { abortEarly: false });
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
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Airport@Paris' };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.string.pattern.base');
    });
  });
});