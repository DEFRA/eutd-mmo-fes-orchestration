import * as test from 'tape';
import * as Joi from 'joi';
import truckSchema from '../../../src/schemas/catchcerts/truckSchema';
import buildNonJsErrorObject from "../../../src/helpers/errorExtractor";
import { describe, it, expect } from '@jest/globals';

const truckSchemaDefult = truckSchema.default;

function validateNonJs(obj) {
  const res = Joi.validate(obj, truckSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject( res.error );
}

test('Should assert mandatory fields when empty', t => {

  const result = Joi.validate({}, truckSchema, {
    abortEarly: false
  });

  t.deepEqual(result.error.details,
    [ { message: '"nationalityOfVehicle" is required', path: 'nationalityOfVehicle', type: 'any.required', context: { key: 'nationalityOfVehicle' } }, { message: '"registrationNumber" is required', path: 'registrationNumber', type: 'any.required', context: { key: 'registrationNumber' } }, { message: '"departurePlace" is required', path: 'departurePlace', type: 'any.required', context: { key: 'departurePlace' } } ]
  );
  t.end();
});

test('Should have no errors when present and alphanumeric', t => {

  const result = Joi.validate({nationalityOfVehicle: 'cxz$@£$fx!!c342', registrationNumber: '3k3289uf!@£!@£fdef54', departurePlace: 'Calais'}, truckSchema, {
    abortEarly: false
  });

  t.deepEqual(result, {
    error: null,
    value: {
      nationalityOfVehicle: 'cxz$@£$fx!!c342',
      registrationNumber: '3k3289uf!@£!@£fdef54',
      departurePlace: 'Calais'
    }
  });

  t.end();
});

test('Should assert mandatory fields when empty in nonJS mode', t => {

  t.deepEqual(validateNonJs({}),
    { nationalityOfVehicle: 'error.nationalityOfVehicle.any.required', registrationNumber: 'error.registrationNumber.any.required', departurePlace: 'error.departurePlace.any.required' }
  );
  t.end();
});

test('Should assert mandatory fields when empty but retain valid entries nonJS mode', t => {

  t.deepEqual(validateNonJs({nationalityOfVehicle:'uk',departurePlace:'york'}),
    { registrationNumber: 'error.registrationNumber.any.required' }
  );
  t.end();
});

const basePayload = {
  vehicle: 'truck',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  cmr: 'CMR123',
  nationalityOfVehicle: 'GB',
  registrationNumber: 'ABC-123',
  freightBillNumber: 'FB-1',
  departurePlace: 'London',
  placeOfUnloading: 'Calais',
  journey: 'road',
  exportDate: '',
  exportDateTo: '',
  departureCountry: 'United Kingdom',
  departurePort: 'Dover'
};

describe('truckSchema - departureDate empty handling', () => {
  it('returns any.required error when departureDate is an empty string', () => {
    const payload = { ...basePayload, departureDate: '' };
    const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const ddErr = error.details.find((d: any) => d.path.join('.') === 'departureDate');
    expect(ddErr).toBeDefined();
    expect(ddErr.type).toBe('any.required');
  });

  it('returns any.required error when departureDate is missing', () => {
    const payload = { ...basePayload };
    // ensure property is not present
    delete (payload as any).departureDate;
    const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const ddErr = error.details.find((d: any) => d.path.join('.') === 'departureDate');
    expect(ddErr).toBeDefined();
    expect(ddErr.type).toBe('any.required');
  });

  it('passes validation when departureDate is a valid formatted date', () => {
    const payload = { ...basePayload, departureDate: '01/01/2020' };
    const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('returns date.max error when departureDate is in the future', () => {
    const payload = { ...basePayload, departureDate: '01/01/3000' };
    const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const ddErr = error.details.find((d: any) => d.path.join('.') === 'departureDate');
    expect(ddErr).toBeDefined();
    expect(ddErr.type).toBe('date.max');
  });
});

describe('truckSchema - pointOfDestination validation', () => {
  const validPayload = {
    ...basePayload,
    departureDate: '01/01/2020'
  };

  describe('when arrival is false (save-and-continue)', () => {
    it('returns any.required error when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: false };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.empty error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.empty');
    });

    it('passes validation with valid pointOfDestination (50 chars)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port of Rotterdam' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Port-of-Le Havre ABC123 O'Connor's Bay/Terminal" };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port@Rotterdam' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });

    it('returns string.pattern.base error with special characters (#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port#Rotterdam$%' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });

    it('returns string.pattern.base error with unicode characters', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port of Göteborg' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: '' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Rotterdam' };
      const { error } = truckSchemaDefult.validate(payload, { abortEarly: false });
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
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port@Rotterdam' };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).pointOfDestination).toBe('error.pointOfDestination.string.pattern.base');
    });
  });
});