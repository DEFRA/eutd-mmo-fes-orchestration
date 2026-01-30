import { describe, it, expect } from '@jest/globals';
import catchCertificateTransportDetailsSchema from '../../../src/schemas/catchcerts/catchCertificateTransportDetailsSchema';

describe('catchCertificateTransportDetailsSchema - containerNumber validation', () => {
  const basePayload = {
    id: 'transport-id-123',
    vehicle: 'containerVessel',
  };

  describe('Container Vessel - containerNumber validation', () => {
    describe('when not in draft mode', () => {
      const context = { query: { draft: false } };

      it('returns error.containerNumber.containerVessel.any.required when containerNumber is missing', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('any.required');
        expect(containerErr.message).toBe('error.containerNumber.containerVessel.any.required');
      });

      it('returns error.containerNumber.containerVessel.string.empty when containerNumber is empty string', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: '',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.empty');
        expect(containerErr.message).toBe('error.containerNumber.containerVessel.string.empty');
      });

      it('returns error.containerNumber.string.pattern.base when containerNumber format is invalid - lowercase letters', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'abcj0123456',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerNumber.string.pattern.base');
      });

      it('returns error.containerNumber.string.pattern.base when containerNumber format is invalid - wrong 4th character', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCA0123456',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerNumber.string.pattern.base');
      });

      it('returns error.containerNumber.string.pattern.base when containerNumber is too short', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCJ012345',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerNumber.string.pattern.base');
      });

      it('returns error.containerNumber.string.pattern.base when containerNumber is too long', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCJ01234567',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerNumber.string.pattern.base');
      });

      it('passes validation with valid containerNumber format ABCJ0123456', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCJ0123456',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });

      it('passes validation with valid containerNumber format XYZU9876543', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'XYZU9876543',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });

      it('passes validation with valid containerNumber using U as 4th character', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCU1234567',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });

      it('passes validation with valid containerNumber using J as 4th character', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCJ1234567',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });

      it('passes validation with valid containerNumber using Z as 4th character', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCZ1234567',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });

      it('passes validation with valid containerNumber using R as 4th character', () => {
        const payload = { 
          ...basePayload, 
          vesselName: 'MS Maersk',
          flagState: 'Denmark',
          containerNumber: 'ABCR1234567',
          departurePlace: 'Southampton'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });
    });

    describe('when in draft mode', () => {
      const context = { query: { draft: true } };

      it('allows any value for containerNumber in draft mode', () => {
        const payload = { 
          ...basePayload, 
          containerNumber: 'invalid'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        const containerErr = error?.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeUndefined();
      });

      it('allows empty containerNumber in draft mode', () => {
        const payload = { 
          ...basePayload, 
          containerNumber: ''
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        const containerErr = error?.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeUndefined();
      });
    });
  });

  describe('Plane - containerNumber validation', () => {
    const planePayload = {
      id: 'transport-id-123',
      vehicle: 'plane',
    };

    describe('when not in draft mode', () => {
      const context = { query: { draft: false } };

      it('returns error.containerNumber.plane.any.required when containerNumber is missing', () => {
        const payload = { 
          ...planePayload,
          flightNumber: 'BA123',
          departurePlace: 'Heathrow'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('any.required');
        expect(containerErr.message).toBe('error.containerNumber.plane.any.required');
      });

      it('returns error.containerNumber.plane.string.empty when containerNumber is empty', () => {
        const payload = { 
          ...planePayload,
          flightNumber: 'BA123',
          containerNumber: '',
          departurePlace: 'Heathrow'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.empty');
        expect(containerErr.message).toBe('error.containerNumber.plane.string.empty');
      });

      it('returns error.containerNumber.plane.string.pattern.base when containerNumber has special characters', () => {
        const payload = { 
          ...planePayload,
          flightNumber: 'BA123',
          containerNumber: 'ABC-123',
          departurePlace: 'Heathrow'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerNumber.plane.string.pattern.base');
      });

      it('passes validation with alphanumeric containerNumber for plane', () => {
        const payload = { 
          ...planePayload,
          flightNumber: 'BA123',
          containerNumber: 'ABC123 XYZ789',
          departurePlace: 'Heathrow'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Truck/Train - containerIdentificationNumber validation', () => {
    const truckPayload = {
      id: 'transport-id-123',
      vehicle: 'truck',
    };

    describe('when not in draft mode', () => {
      const context = { query: { draft: false } };

      it('returns error.containerIdentificationNumber.string.pattern.base when format is invalid', () => {
        const payload = { 
          ...truckPayload,
          nationalityOfVehicle: 'United Kingdom',
          registrationNumber: 'AB12 CDE',
          containerIdentificationNumber: 'invalid',
          departurePlace: 'Dover'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeDefined();
        const containerErr = error.details.find((d: any) => d.path.join('.') === 'containerIdentificationNumber');
        expect(containerErr).toBeDefined();
        expect(containerErr.type).toBe('string.pattern.base');
        expect(containerErr.message).toBe('error.containerIdentificationNumber.string.pattern.base');
      });

      it('allows empty string for optional containerIdentificationNumber', () => {
        const payload = { 
          ...truckPayload,
          nationalityOfVehicle: 'United Kingdom',
          registrationNumber: 'AB12 CDE',
          containerIdentificationNumber: '',
          departurePlace: 'Dover'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        const containerErr = error?.details.find((d: any) => d.path.join('.') === 'containerIdentificationNumber');
        expect(containerErr).toBeUndefined();
      });

      it('passes validation with valid containerIdentificationNumber format', () => {
        const payload = { 
          ...truckPayload,
          nationalityOfVehicle: 'United Kingdom',
          registrationNumber: 'AB12 CDE',
          containerIdentificationNumber: 'ABCJ0123456',
          departurePlace: 'Dover'
        };
        const { error } = catchCertificateTransportDetailsSchema.validate(payload, { context, abortEarly: false });
        
        expect(error).toBeUndefined();
      });
    });
  });
});
