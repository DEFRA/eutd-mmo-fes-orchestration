import { constructPath, validateSpeciesName, validateSpeciesWithReferenceData, validateSpeciesWithSuggestions } from "./fish.validator";
import * as HttpHelper from "./httpHelper";
import { BusinessError } from "./validationErrors";
import { Product } from '../persistence/schema/frontEndModels/species';

describe("fish.validator", () => {
  const mockedResponse = {} as BusinessError;
  const product: Product = {
    id: 'some-id',
    species: 'Atlantic cod (COD)',
    speciesCode: 'COD',
    state: 'FRE',
    stateLabel: 'Fresh',
    presentation: 'WHL',
    presentationLabel: 'Whole',
    user_id: 'some-user-id',
    commodity_code: '1234'
  }

  let mockValidateSpecies;
  let mockValidate;
  let mockValidateSpeciesSuggestion;

  beforeEach(() => {
    mockValidateSpecies = jest.spyOn(HttpHelper, 'validateSpecies');
    mockValidateSpecies.mockResolvedValue(mockedResponse);

    mockValidate = jest.spyOn(HttpHelper, 'validate');
    mockValidate.mockResolvedValue(mockedResponse);

    mockValidateSpeciesSuggestion = jest.spyOn(HttpHelper, 'checkSpeciesNameWithSuggestions');
    mockValidateSpeciesSuggestion.mockResolvedValue(mockedResponse);
  });

  afterEach(() => {
    mockValidateSpecies.mockRestore();
    mockValidate.mockRestore();
  });

  it("constructPath() should return a well formed path", () => {
    const result = constructPath("fish-name", "fish-code", 'someScientificName');
    const expectedResult = "/v1/species/search-exact?faoCode=fish-code&faoName=fish-name&scientificName=someScientificName";
    expect(result).toEqual(expectedResult);
  });

  it("validateSpeciesName() should return a validated species name", async () => {
    const result = await validateSpeciesName("fish-name/fish-code", "fish/url", 'someScientificName');
    expect(mockValidate).toHaveBeenCalled()
    expect(result).toEqual({});
  });

  it("validateSpeciesWithSuggestions() should return a validated species name", async () => {
    const result = await validateSpeciesWithSuggestions("fish-name (fish-code)", "fish/url");
    expect(mockValidateSpeciesSuggestion).toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("validateSpeciesWithReferenceData", async () => {
    const result = await validateSpeciesWithReferenceData(product, "fish/url");
    expect(mockValidateSpecies).toHaveBeenCalledWith(product, 'fish/url', 'species', '/v1/commodities/search?speciesCode=COD&state=FRE&presentation=WHL')
    expect(result).toEqual({});
  })
});
