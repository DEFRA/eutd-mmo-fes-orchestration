import { describe, it, expect } from '@jest/globals';
import planeSchemaDefault from '../../../src/schemas/catchcerts/planeSchema';
import { buildNonJsErrorObject } from '../../../src/helpers/errorExtractor';

function validateNonJs(obj: any): any {
  const res = planeSchemaDefault.validate(obj, { abortEarly: false });
  if (!res.error) return null;
  return buildNonJsErrorObject(res.error, obj);
}

const basePayload = {
  vehicle: 'plane',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  flightNumber: 'FL123',
  containerNumber: 'CONT456',
  containerNumbers: ['ABCU1234567'],
  departurePlace: 'London Heathrow',
  placeOfUnloading: 'Heathrow Terminal 5',
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
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.required error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('passes validation with valid pointOfDestination', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Charles de Gaulle Airport' };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Airport-Paris CDG ABC123 O'Hare/Terminal 2" };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Airport@Paris#CDG$%' };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Charles de Gaulle' };
      const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
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
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.any.required');
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

describe('planeSchema - containerNumbers validation', () => {
  const validPayload = {
    ...basePayload,
    pointOfDestination: 'Charles de Gaulle Airport',
    departureDate: '01/01/2020'
  };

  it('returns any.required error when containerNumbers is missing', () => {
    const { containerNumbers, ...payload } = validPayload;
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.type).toBe('any.required');
  });

  it('returns array.min error when containerNumbers is an empty array', () => {
    const payload = { ...validPayload, containerNumbers: [] };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.type).toBe('array.min');
  });

  it('passes validation with one valid container number', () => {
    const payload = { ...validPayload, containerNumbers: ['ABCU1234567'] };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('passes validation with an empty string item (allowed blank)', () => {
    const payload = { ...validPayload, containerNumbers: [''] };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('passes validation with exactly 10 container numbers (boundary)', () => {
    const payload = {
      ...validPayload,
      containerNumbers: ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567',
                         'DEFU1234567', 'DEFJ1234567', 'DEFZ1234567', 'DEFR1234567',
                         'GHIU1234567', 'GHIJ1234567']
    };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('returns array.max error when containerNumbers has more than 10 items', () => {
    const payload = {
      ...validPayload,
      containerNumbers: ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567',
                         'DEFU1234567', 'DEFJ1234567', 'DEFZ1234567', 'DEFR1234567',
                         'GHIU1234567', 'GHIJ1234567', 'GHIZ1234567']
    };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.type).toBe('array.max');
  });

  it('returns string.pattern.base error when item does not match the container number format', () => {
    const payload = { ...validPayload, containerNumbers: ['INVALID-NUMBER'] };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path[0] === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.message).toBe('error.containerNumbers.string.pattern.base');
  });

  it('returns string.pattern.base error when item does not match ISO 6346 format', () => {
    // For the plane schema, the regex /^$|^[A-Z]{3}[UJZR]\d{7}$/ rejects non-matching strings.
    // A long string of 'A' characters does not match the pattern.
    const payload = { ...validPayload, containerNumbers: ['A'.repeat(51)] };
    const { error } = planeSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path[0] === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.message).toBe('error.containerNumbers.string.pattern.base');
  });
});