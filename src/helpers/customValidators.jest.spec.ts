import { decimalPlacesValidator, validateExclusiveEconomicZones } from './customValidators';
import { validateCountriesName } from '../validators/countries.validator';
import ApplicationConfig from '../applicationConfig';
import * as Joi from 'joi';

jest.mock('../validators/countries.validator');
jest.mock('../applicationConfig');

describe('decimalPlacesValidator()', () => {
  const helpers = {
    error: (message: string) => message,
  };

  it('should return value when the value is valid', () => {
    const value = 100.20;
    expect(decimalPlacesValidator(value, helpers)).toEqual(value);
  });

  it('should return an error message when value has more than 2 decimal places', () => {
    const value = 100.123;
    const expectation = 'number.decimal-places';
    expect(decimalPlacesValidator(value, helpers)).toEqual(expectation);
  });
});

describe('validateExclusiveEconomicZones()', () => {
  const mockValidateCountriesName = validateCountriesName as jest.MockedFunction<typeof validateCountriesName>;
  const mockGetReferenceServiceUrl = ApplicationConfig.getReferenceServiceUrl as jest.MockedFunction<typeof ApplicationConfig.getReferenceServiceUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReferenceServiceUrl.mockReturnValue('http://mock-ref-url');
  });

  describe('when highSeasArea is "No"', () => {
    it('should return validation errors for empty officialCountryName', async () => {
      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: '   ' },
          { officialCountryName: null }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(3);
      expect(errors[0]).toBeInstanceOf(Joi.ValidationError);
      expect(errors[0].message).toBe('error.eez.0.any.required');
      expect(errors[1].message).toBe('error.eez.1.any.required');
      expect(errors[2].message).toBe('error.eez.2.any.required');
    });

    it('should validate non-empty country names and return errors if invalid', async () => {
      const mockError = {
        message: 'error.eez.0.invalid',
        details: [
          {
            message: 'error.eez.0.invalid',
            path: ['eez', '0'],
            type: 'any.invalid',
            context: { key: 'officialCountryName' }
          }
        ]
      } as any;

      mockValidateCountriesName.mockResolvedValue({
        isError: true,
        error: mockError
      });

      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: [
          { officialCountryName: 'InvalidCountry' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe(mockError);
      expect(mockValidateCountriesName).toHaveBeenCalledWith(
        { officialCountryName: 'InvalidCountry' },
        'http://mock-ref-url',
        'eez.0'
      );
    });

    it('should return no errors when all country names are valid', async () => {
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
        error: null as any
      });

      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: [
          { officialCountryName: 'United Kingdom' },
          { officialCountryName: 'France' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(mockValidateCountriesName).toHaveBeenCalledTimes(2);
    });

    it('should return combined errors for both empty and invalid country names', async () => {
      const mockError = {
        message: 'error.eez.1.invalid',
        details: [
          {
            message: 'error.eez.1.invalid',
            path: ['eez', '1'],
            type: 'any.invalid',
            context: { key: 'officialCountryName' }
          }
        ]
      } as any;

      mockValidateCountriesName.mockResolvedValue({
        isError: true,
        error: mockError
      });

      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: 'InvalidCountry' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('error.eez.0.any.required');
      expect(errors[1].message).toBe('error.eez.1.invalid');
    });
  });

  describe('when highSeasArea is "Yes"', () => {
    it('should remove empty EEZ records and return no errors', async () => {
      const value = {
        highSeasArea: 'Yes',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: '   ' },
          { officialCountryName: null }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(value.exclusiveEconomicZones).toHaveLength(0);
    });

    it('should validate non-empty country names and return errors if invalid', async () => {
      const mockError = {
        message: 'error.eez.0.invalid',
        details: [
          {
            message: 'error.eez.0.invalid',
            path: ['eez', '0'],
            type: 'any.invalid',
            context: { key: 'officialCountryName' }
          }
        ]
      } as any;

      mockValidateCountriesName.mockResolvedValue({
        isError: true,
        error: mockError
      });

      const value = {
        highSeasArea: 'Yes',
        exclusiveEconomicZones: [
          { officialCountryName: 'InvalidCountry' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(1);
      expect(value.exclusiveEconomicZones).toHaveLength(1); // Not removed because it has a value
    });

    it('should remove empty records and validate non-empty ones', async () => {
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
        error: null as any
      });

      const value = {
        highSeasArea: 'Yes',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: 'United Kingdom' },
          { officialCountryName: '   ' },
          { officialCountryName: 'France' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(value.exclusiveEconomicZones).toHaveLength(2);
      expect(value.exclusiveEconomicZones[0].officialCountryName).toBe('United Kingdom');
      expect(value.exclusiveEconomicZones[1].officialCountryName).toBe('France');
      expect(mockValidateCountriesName).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed empty and invalid records correctly', async () => {
      const mockError = {
        message: 'error.eez.1.invalid',
        details: [
          {
            message: 'error.eez.1.invalid',
            path: ['eez', '1'],
            type: 'any.invalid',
            context: { key: 'officialCountryName' }
          }
        ]
      } as any;

      mockValidateCountriesName.mockResolvedValue({
        isError: true,
        error: mockError
      });

      const value = {
        highSeasArea: 'Yes',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: 'InvalidCountry' },
          { officialCountryName: '  ' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors[0].message).toBe('error.eez.1.invalid');
      expect(value.exclusiveEconomicZones).toHaveLength(1);
      expect(value.exclusiveEconomicZones[0].officialCountryName).toBe('InvalidCountry');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when exclusiveEconomicZones is undefined', async () => {
      const value = {
        highSeasArea: 'No'
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(mockValidateCountriesName).not.toHaveBeenCalled();
    });

    it('should return empty array when exclusiveEconomicZones is empty array', async () => {
      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: []
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(mockValidateCountriesName).not.toHaveBeenCalled();
    });

    it('should return empty array when exclusiveEconomicZones is null', async () => {
      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: null
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(mockValidateCountriesName).not.toHaveBeenCalled();
    });

    it('should handle highSeasArea with value other than "Yes" or "No"', async () => {
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
        error: null as any
      });

      const value = {
        highSeasArea: 'Maybe',
        exclusiveEconomicZones: [
          { officialCountryName: '' },
          { officialCountryName: 'United Kingdom' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      // Should not treat empty as error (not "No") and should not remove (not "Yes")
      expect(errors).toHaveLength(0);
      expect(value.exclusiveEconomicZones).toHaveLength(2); // Not removed
      expect(mockValidateCountriesName).toHaveBeenCalledTimes(1); // Only validates non-empty
    });

    it('should handle zone object without officialCountryName property', async () => {
      const value = {
        highSeasArea: 'No',
        exclusiveEconomicZones: [
          {},
          { otherProperty: 'value' }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('error.eez.0.any.required');
      expect(errors[1].message).toBe('error.eez.1.any.required');
    });

    it('should correctly adjust indices when removing multiple empty records', async () => {
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
        error: null as any
      });

      const value = {
        highSeasArea: 'Yes',
        exclusiveEconomicZones: [
          { officialCountryName: 'Country1' },
          { officialCountryName: '' },
          { officialCountryName: 'Country2' },
          { officialCountryName: '   ' },
          { officialCountryName: 'Country3' },
          { officialCountryName: null }
        ]
      };

      const errors = await validateExclusiveEconomicZones(value);

      expect(errors).toHaveLength(0);
      expect(value.exclusiveEconomicZones).toHaveLength(3);
      expect(value.exclusiveEconomicZones[0].officialCountryName).toBe('Country1');
      expect(value.exclusiveEconomicZones[1].officialCountryName).toBe('Country2');
      expect(value.exclusiveEconomicZones[2].officialCountryName).toBe('Country3');
    });
  });
});
