import { validateCountries } from './httpHelper';
import { BusinessError } from './validationErrors';
import { ICountry } from '../persistence/schema/common';

export const validateCountriesName = async (exportDestination: ICountry, url: string, error: string = 'exportDestination') : Promise<BusinessError> => {
  return await validateCountries(exportDestination, url, error);
}