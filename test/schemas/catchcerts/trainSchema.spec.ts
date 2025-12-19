import * as test from 'tape';
import * as Joi from 'joi';
import trainSchema from '../../../src/schemas/catchcerts/trainSchema';
import buildNonJsErrorObject from "../../../src/helpers/errorExtractor";

function validateNonJs(obj) {
  const res = Joi.validate(obj, trainSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"railwayBillNumber" is required', path: 'railwayBillNumber', type: 'any.required', context: { key: 'railwayBillNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should assert alphanumeric', t => {

  const result = Joi.validate({railwayBillNumber: '£@$@$@$', departurePlace: 'Paris'}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [
      {
        message: '"railwayBillNumber" must only contain alpha-numeric characters',
        path: 'railwayBillNumber',
        type: 'string.alphanum',
        context: {
          value: '£@$@$@$',
          key: 'railwayBillNumber'
        }
      }
      ]
  );
  t.end();
});

test('Should have no errors when present and alphanumeric', t => {

  const result = Joi.validate({railwayBillNumber: '4mn23b42n2m3442m3', departurePlace: 'Paris'}, trainSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: { railwayBillNumber: '4mn23b42n2m3442m3', departurePlace: 'Paris' }
  });

  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode_train', t => {

  t.deepEqual(validateNonJs({}),
    { railwayBillNumber: 'error.railwayBillNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({railwayBillNumber: '416'}),
    { departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

import { describe, it, expect } from '@jest/globals';
import trainSchemaDefault from '../../../src/schemas/catchcerts/trainSchema';

const basePayload = {
  vehicle: 'train',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  railwayBillNumber: 'RB12345',
  departurePlace: 'London St Pancras',
  journey: 'rail',
  exportDate: '',
  exportDateTo: '',
  departureCountry: 'United Kingdom',
  departurePort: 'St Pancras International'
};

describe('trainSchema - pointOfDestination validation', () => {
  const validPayload = {
    ...basePayload,
    departureDate: '01/01/2020'
  };

  describe('when arrival is false (save-and-continue)', () => {
    it('returns any.required error when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: false };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.empty error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.empty');
    });

    it('passes validation with valid pointOfDestination', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Gare du Nord Paris' };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Station-Paris Nord ABC123 O'Connell's/Platform 3" };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Station@Paris#Nord$%' };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Gare du Nord' };
      const { error } = trainSchemaDefault.default.validate(payload, { abortEarly: false });
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
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Station@Paris' };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.string.pattern.base');
    });
  });
});
