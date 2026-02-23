import { describe, it, expect, jest } from '@jest/globals';
import directLandingsSchema from './directLandingsSchema';

jest.mock('../../applicationConfig', () => ({
  default: {
    _landingLimitDaysInTheFuture: 0,
    _referenceServiceUrl: 'http://localhost',
  },
}));

const baseValidPayload = {
  dateLanded: '2024-01-15',
  startDate: '2024-01-10',
  faoArea: 'FAO27',
  vessel: { vesselName: 'Test Vessel' },
  weights: [
    { speciesId: 'COD', exportWeight: 100 },
  ],
  gearCategory: 'Trawls',
  gearType: 'Bottom trawls',
  highSeasArea: 'No',
  exclusiveEconomicZones: [{ officialCountryName: 'United Kingdom' }],
};

describe('directLandingsSchema - weights total validation', () => {
  describe('when total export weight is within the valid limit', () => {
    it('does not return an array.totalWeightExceeded error for a single weight equal to the limit', () => {
      const payload = {
        ...baseValidPayload,
        weights: [{ speciesId: 'COD', exportWeight: 99999999999.99 }],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeUndefined();
    });

    it('does not return an array.totalWeightExceeded error when multiple weights total exactly the limit', () => {
      const payload = {
        ...baseValidPayload,
        weights: [
          { speciesId: 'COD', exportWeight: 50000000000 },
          { speciesId: 'HKE', exportWeight: 49999999999.99 },
        ],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeUndefined();
    });

    it('does not return an array.totalWeightExceeded error for typical small weights', () => {
      const payload = {
        ...baseValidPayload,
        weights: [
          { speciesId: 'COD', exportWeight: 100.5 },
          { speciesId: 'HKE', exportWeight: 200 },
        ],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeUndefined();
    });
  });

  describe('when total export weight exceeds 99,999,999,999.99', () => {
    it('returns an array.totalWeightExceeded error for a single weight above the limit', () => {
      const payload = {
        ...baseValidPayload,
        weights: [{ speciesId: 'COD', exportWeight: 100000000000 }],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeDefined();
      expect(weightError?.path).toEqual(['weights']);
      expect(weightError?.type).toBe('array.totalWeightExceeded');
    });

    it('returns an array.totalWeightExceeded error when multiple weights combine to exceed the limit', () => {
      const payload = {
        ...baseValidPayload,
        weights: [
          { speciesId: 'COD', exportWeight: 50000000000 },
          { speciesId: 'HKE', exportWeight: 50000000000 },
        ],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeDefined();
      expect(weightError?.path).toEqual(['weights']);
      expect(weightError?.type).toBe('array.totalWeightExceeded');
    });

    it('returns an array.totalWeightExceeded error for the example values from the technical specification', () => {
      // liveExportWeight: 31111111334.52, totalRecordedAgainstLanding: 1000000000000040
      const payload = {
        ...baseValidPayload,
        weights: [
          { speciesId: 'COD', exportWeight: 31111111334.52 },
          { speciesId: 'HKE', exportWeight: 1000000000000040 },
        ],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const weightError = error?.details.find(
        (d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
      );
      expect(weightError).toBeDefined();
    });

    it('includes other validation errors alongside the total weight error when abortEarly is false', () => {
      const payload = {
        ...baseValidPayload,
        weights: [{ speciesId: '', exportWeight: 100000000000 }],
      };
      const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
      const allTypes = error?.details.map((d) => d.type) ?? [];
      expect(allTypes).toContain('array.totalWeightExceeded');
      expect(allTypes).toContain('string.empty');
    });
  });
});
