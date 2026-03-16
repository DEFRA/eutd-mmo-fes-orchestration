import { describe, it, expect } from '@jest/globals';
import containerVesselSchemaDefault from '../../../src/schemas/catchcerts/containerVesselSchema';
import { buildNonJsErrorObject } from '../../../src/helpers/errorExtractor';

function validateNonJs(obj: any): any {
  const res = containerVesselSchemaDefault.validate(obj, { abortEarly: false });
  if (!res.error) return null;
  return buildNonJsErrorObject(res.error, obj);
}

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
  placeOfUnloading: 'Port of Le Havre',
  journey: 'sea',
  exportDate: '',
  exportDateTo: '2020-01-31',
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
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('returns any.required error when pointOfDestination is empty string', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: '' };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('any.required');
    });

    it('passes validation with valid pointOfDestination', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port of Le Havre' };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation with pointOfDestination at 100 char boundary', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(100) };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when pointOfDestination exceeds 100 chars', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'A'.repeat(101) };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.max');
    });

    it('passes validation with valid characters (letters, numbers, hyphen, apostrophe, space, slash)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: "Port-of-Le Havre ABC123 O'Neill's Dock/Terminal 5" };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.pattern.base error with special characters (@#$%)', () => {
      const payload = { ...validPayload, arrival: false, pointOfDestination: 'Port@Le Havre#Terminal$%' };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const podErr = error.details.find((d: any) => d.path.join('.') === 'pointOfDestination');
      expect(podErr).toBeDefined();
      expect(podErr.type).toBe('string.pattern.base');
    });
  });

  describe('when arrival is true (direct landing)', () => {
    it('passes validation when pointOfDestination is missing', () => {
      const payload = { ...validPayload, arrival: true };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when pointOfDestination has valid value', () => {
      const payload = { ...validPayload, arrival: true, pointOfDestination: 'Port of Le Havre' };
      const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
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
    pointOfDestination: 'Port of Le Havre',
    departureDate: '01/01/2020'
  };

  it('passes validation when containerNumbers is not provided (optional)', () => {
    const { error } = containerVesselSchemaDefault.validate(validPayload, { abortEarly: false });
    const err = error?.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeUndefined();
  });

  it('returns array.min error when containerNumbers is an empty array', () => {
    const payload = { ...validPayload, containerNumbers: [] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.type).toBe('array.min');
  });

  it('passes validation with one valid container number', () => {
    const payload = { ...validPayload, containerNumbers: ['ABCU1234567'] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    const err = error?.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeUndefined();
  });

  it('passes validation with an empty string item (allowed blank)', () => {
    const payload = { ...validPayload, containerNumbers: [''] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    const err = error?.details.find((d: any) => d.path[0] === 'containerNumbers');
    expect(err).toBeUndefined();
  });

  it('passes validation with exactly 10 container numbers (boundary)', () => {
    const payload = {
      ...validPayload,
      containerNumbers: ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567',
                         'DEFU1234567', 'DEFJ1234567', 'DEFZ1234567', 'DEFR1234567',
                         'GHIU1234567', 'GHIJ1234567']
    };
    const err = (containerVesselSchemaDefault.validate(payload, { abortEarly: false })).error
      ?.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeUndefined();
  });

  it('returns array.max error when containerNumbers has more than 10 items', () => {
    const payload = {
      ...validPayload,
      containerNumbers: ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567',
                         'DEFU1234567', 'DEFJ1234567', 'DEFZ1234567', 'DEFR1234567',
                         'GHIU1234567', 'GHIJ1234567', 'GHIZ1234567']
    };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.type).toBe('array.max');
  });

  it('returns string.pattern.base error when item does not match the container number format', () => {
    const payload = { ...validPayload, containerNumbers: ['INVALID-NUMBER'] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.path[0] === 'containerNumbers');
    expect(err).toBeDefined();
    expect(err.message).toBe('error.containerNumbers.string.pattern.base');
  });

  it('returns array.unique error when duplicate container numbers are provided', () => {
    const payload = { ...validPayload, containerNumbers: ['ABCU1234567', 'ABCU1234567'] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.type === 'array.unique');
    expect(err).toBeDefined();
    expect(err.message).toBe('error.containerNumbers.array.unique');
  });

  it('passes validation when all container numbers are unique', () => {
    const payload = { ...validPayload, containerNumbers: ['ABCU1234567', 'ABCJ7654321'] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    const err = error?.details.find((d: any) => d.type === 'array.unique');
    expect(err).toBeUndefined();
  });

  it('does not flag empty strings as duplicates', () => {
    const payload = { ...validPayload, containerNumbers: ['', ''] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    const err = error?.details.find((d: any) => d.type === 'array.unique');
    expect(err).toBeUndefined();
  });

  it('returns array.unique error when duplicates exist among multiple containers', () => {
    const payload = { ...validPayload, containerNumbers: ['ABCU1234567', 'ABCJ7654321', 'ABCU1234567'] };
    const { error } = containerVesselSchemaDefault.validate(payload, { abortEarly: false });
    expect(error).toBeDefined();
    const err = error.details.find((d: any) => d.type === 'array.unique');
    expect(err).toBeDefined();
  });
});
