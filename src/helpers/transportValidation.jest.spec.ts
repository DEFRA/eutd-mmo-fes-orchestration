import { validateTruckNationality } from './transportValidation';
import axios from 'axios';
import ApplicationConfig from '../applicationConfig';

jest.mock('axios');
jest.mock('../applicationConfig');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedConfig = ApplicationConfig as jest.Mocked<typeof ApplicationConfig>;

describe('Transport Validation Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfig.getReferenceServiceUrl.mockReturnValue('http://reference-service');
  });

  describe('validateTruckNationality', () => {
    it('should return empty array when nationality is not provided', async () => {
      const errors = await validateTruckNationality('truck', '', false);
      expect(errors).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array when nationality is undefined', async () => {
      const errors = await validateTruckNationality('truck', undefined, false);
      expect(errors).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array when vehicle is not a truck', async () => {
      const errors = await validateTruckNationality('plane', 'United Kingdom', false);
      expect(errors).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array in draft mode regardless of validity', async () => {
      const errors = await validateTruckNationality('truck', 'InvalidCountry', true);
      expect(errors).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array when nationality is valid', async () => {
      mockedAxios.get.mockResolvedValue({
        data: [
          { officialCountryName: 'United Kingdom' },
          { officialCountryName: 'Afghanistan' }
        ]
      });

      const errors = await validateTruckNationality('truck', 'United Kingdom', false);
      
      expect(errors).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://reference-service/v1/countries');
    });

    it('should return error when nationality is invalid', async () => {
      mockedAxios.get.mockResolvedValue({
        data: [
          { officialCountryName: 'United Kingdom' },
          { officialCountryName: 'Afghanistan' }
        ]
      });

      const errors = await validateTruckNationality('truck', 'InvalidCountry', false);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('details');
      expect(errors[0].details).toEqual([
        {
          path: ['nationalityOfVehicle'],
          type: 'any.invalid',
          context: { key: 'nationalityOfVehicle' },
          message: 'error.nationalityOfVehicle.any.invalid'
        }
      ]);
    });

    it('should return error when reference service fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Service unavailable'));

      const errors = await validateTruckNationality('truck', 'United Kingdom', false);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('details');
      expect(errors[0].details).toEqual([
        {
          path: ['nationalityOfVehicle'],
          type: 'any.invalid',
          context: { key: 'nationalityOfVehicle' },
          message: 'error.nationalityOfVehicle.any.invalid'
        }
      ]);
    });
  });
});
