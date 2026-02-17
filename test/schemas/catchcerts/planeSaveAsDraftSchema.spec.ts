import { describe, it, expect } from '@jest/globals';
import planeSaveAsDraftSchema from '../../../src/schemas/catchcerts/planeSaveAsDraftSchema';
import {buildNonJsErrorObject} from "../../../src/helpers/errorExtractor";
import * as Joi from 'joi';

function validateNonJs(obj) {
  const res = Joi.validate(obj, planeSaveAsDraftSchema, { abortEarly: false });
  if( !res.error) return null;
  return buildNonJsErrorObject(res.error, obj);
}

const basePayload = {
  vehicle: 'plane',
  arrival: false,
  exportedTo: {
    officialCountryName: 'France',
    isoCodeAlpha2: 'FR'
  },
  pointOfDestination: 'Paris Airport',
  flightNumber: 'FL123',
  departurePlace: 'London',
  journey: 'air',
  departureCountry: 'United Kingdom'
};

describe('planeSaveAsDraftSchema - containerNumbers validation', () => {
  const validPayload = {
    ...basePayload
  };

  describe('pattern validation', () => {
    it('accepts alphanumeric container numbers with spaces', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT123', 'ABC456 789'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts single alphanumeric container number', () => {
      const payload = { ...validPayload, containerNumbers: ['CONTAINER1'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container numbers with only letters', () => {
      const payload = { ...validPayload, containerNumbers: ['ABCDEFGH'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container numbers with only numbers', () => {
      const payload = { ...validPayload, containerNumbers: ['12345678'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts container numbers at 50 character boundary', () => {
      const payload = { ...validPayload, containerNumbers: ['A'.repeat(50)] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('returns string.max error when container number exceeds 50 chars', () => {
      const payload = { ...validPayload, containerNumbers: ['A'.repeat(51)] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.max');
    });

    it('accepts empty string in array', () => {
      const payload = { ...validPayload, containerNumbers: [''] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts mixed valid container numbers including empty strings', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT123', '', 'ABC456'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('rejects container numbers with special characters', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT@123', 'ABC#456'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container numbers with hyphens', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT-123'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container numbers with dots', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT.123'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });

    it('rejects container numbers with slashes', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT/123'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.message.includes('containerNumbers'));
      expect(cnErr).toBeDefined();
      expect(cnErr.message).toBe('error.containerNumbers.string.pattern.base');
    });
  });

  describe('array constraints', () => {
    it('accepts array with exactly 1 element', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT123'] };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts array with 5 elements', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: ['CONT1', 'CONT2', 'CONT3', 'CONT4', 'CONT5']
      };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts array with 10 elements (max boundary)', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(10).fill('CONT123')
      };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('rejects array with more than 10 elements', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(11).fill('CONT123')
      };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeDefined();
      const cnErr = error.details.find((d: any) => d.path.join('.') === 'containerNumbers');
      expect(cnErr).toBeDefined();
      expect(cnErr.type).toBe('array.max');
    });

    it('passes validation when containerNumbers is optional and missing', () => {
      const payload = { ...validPayload };
      delete payload.containerNumbers;
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('passes validation when containerNumbers is undefined', () => {
      const payload = { ...validPayload, containerNumbers: undefined };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });

  describe('nonJS error mode', () => {
    it('returns correct error key when container number exceeds max length', () => {
      const payload = { ...validPayload, containerNumbers: ['A'.repeat(51)] };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.string.max');
    });

    it('returns correct error key when container number has invalid pattern', () => {
      const payload = { ...validPayload, containerNumbers: ['CONT@123'] };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.string.pattern.base');
    });

    it('returns correct error key when array exceeds max size', () => {
      const payload = { 
        ...validPayload, 
        containerNumbers: Array(11).fill('CONT123')
      };
      const errors = validateNonJs(payload);
      expect(errors).toBeDefined();
      expect((errors as any).containerNumbers).toBe('error.containerNumbers.array.max');
    });
  });

  describe('save as draft mode - lenient validation', () => {
    it('accepts payload with minimal fields', () => {
      const payload = { 
        vehicle: 'plane',
        containerNumbers: ['CONT123']
      };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });

    it('accepts empty or null values for optional fields', () => {
      const payload = { 
        vehicle: 'plane',
        airwayBillNumber: '',
        flightNumber: '',
        departurePlace: '',
        pointOfDestination: '',
        containerNumbers: ['CONT123']
      };
      const { error } = planeSaveAsDraftSchema.validate(payload, { abortEarly: false });
      expect(error).toBeUndefined();
    });
  });
});
