import { validateCountriesName } from './countries.validator';
import ApplicationConfig from '../applicationConfig';
import * as HttpHelper from "./httpHelper";
import { ICountry } from '../persistence/schema/common';

describe('countries.validator',() => {
  const exportDestination: ICountry = {
    officialCountryName: 'India'
  };
  const refUrl = ApplicationConfig.getReferenceServiceUrl();

  let mockValidateCountries;

  beforeEach(() => {
    mockValidateCountries = jest.spyOn(HttpHelper, "validateCountries");
    mockValidateCountries.mockResolvedValue({ isError: true });
  })

  afterEach(() => {
    mockValidateCountries.mockRestore();
  })

  it('should return an error if the country name does not exist in the countries array', async () => {
    const result = await validateCountriesName(exportDestination, refUrl);
    expect(result.isError).toEqual(true);
  });

  it('should return an error if a country destination is not given', async () => {
    const result = await validateCountriesName(undefined, refUrl);
    expect(result.isError).toEqual(true);
  });

  it('should return isError: false and error:null if the country name exists in the countries array', async () => {
    mockValidateCountries.mockResolvedValue({ isError: false });
    const result = await validateCountriesName(exportDestination, refUrl);
    expect(result.isError).toEqual(false);
  });

  it('should call validate countries with correct error property', async () => {
    const result = await validateCountriesName(exportDestination, refUrl);
    expect(mockValidateCountries).toHaveBeenCalledWith(exportDestination, refUrl, 'exportDestination');
    expect(result.isError).toEqual(true);
  });

  it('should call validate countries with given error property', async () => {
    const propertyError = 'country';
    const result = await validateCountriesName(exportDestination, refUrl, propertyError);
    expect(mockValidateCountries).toHaveBeenCalledWith(exportDestination, refUrl, propertyError);
    expect(result.isError).toEqual(true);
  });

});
