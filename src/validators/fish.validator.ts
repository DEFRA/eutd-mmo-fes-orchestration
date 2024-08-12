import { validate, validateSpecies, checkSpeciesNameWithSuggestions } from './httpHelper';
import { BusinessError, SpeciesSuggestionError } from './validationErrors';
import { Product } from '../persistence/schema/frontEndModels/species';

const SPECIES_NAME_IN_FORM = 'species';


export const constructPath = (name: string, fao: string, scientificName: string) : string => {
  return `/v1/species/search-exact?faoCode=${fao}&faoName=${name}&scientificName=${scientificName}`;
}

export const validateSpeciesName = async (speciesNameWithCode: string, scientificName: string, url: string) : Promise<BusinessError> => {
  return await validate(speciesNameWithCode, scientificName, url, SPECIES_NAME_IN_FORM, constructPath);
}

export const validateSpeciesWithSuggestions = async (speciesNameWithCode: string, url: string): Promise<BusinessError | SpeciesSuggestionError> => {
  return await checkSpeciesNameWithSuggestions(speciesNameWithCode, url, SPECIES_NAME_IN_FORM);
}

export const validateSpeciesWithReferenceData = async (species: Product, url: string) : Promise<BusinessError> => {
  const path = ({speciesCode, state, presentation}: Product) : string =>
    `/v1/commodities/search?speciesCode=${speciesCode}&state=${state}&presentation=${presentation}`;
  return await validateSpecies(species, url, SPECIES_NAME_IN_FORM, path(species));
}

