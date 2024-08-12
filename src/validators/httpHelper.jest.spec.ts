
import * as SUT from './httpHelper';
import * as HTTP from '../helpers/http';
import { BusinessError, CannotReachError, SpeciesSuggestionError } from './validationErrors';
import { Product } from '../persistence/schema/frontEndModels/species';
import logger from '../logger';
import * as Name from "../helpers/name";
import { ICountry } from '../persistence/schema/common';

describe('validate species', () => {
  let product: Product;

  const baseURL = 'some-url';
  const propertyName = 'species';
  const path = '/v1/commodities/search?speciesCode=COD&state=FRE&presentation=FIL';

  let mockGetEntityFromServer;
  let mockLoggerError;

  beforeEach(() => {
    mockGetEntityFromServer = jest.spyOn(HTTP, 'getEntityFromServer');
    mockGetEntityFromServer.mockResolvedValue([{
      code: '1234',
      description: 'some-description',
      faoName: 'valid species',
      presentationLabel : 'presentation lable',
      stateLabel : 'state lable'
    }]);
    mockLoggerError = jest.spyOn(logger, 'error');

    product = {
      id: 'some-id',
      user_id: 'some-user-id',
      commodity_code: '1234',
      species: 'valid species (COD)',
      speciesCode: 'COD',
      stateLabel : 'state lable',
      presentationLabel : 'presentation lable',
    };
  });

  afterEach(() => {
    mockGetEntityFromServer.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should not return an error', async () => {
    const expected: BusinessError = {
      isError: false,
      error: null
    };

    const result = await SUT.validateSpecies(product, baseURL, propertyName, path);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if commodity code do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "species" fails because ["species" is invalid]') as CannotReachError
    };
    product.commodity_code = 'invalid';

    const result = await SUT.validateSpecies(product, baseURL, propertyName, path);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if species  do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "species" fails because ["species" is invalid]') as CannotReachError
    };
    product.species = 'invalid species';

    const result = await SUT.validateSpecies(product, baseURL, propertyName, path);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error when species is not defined', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "species" fails because ["species" is invalid]') as CannotReachError
    };

    const result = await SUT.validateSpecies(undefined, baseURL, propertyName, path);

    expect(mockGetEntityFromServer).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error when an error is thrown', async () => {
    const e = new Error('something went wrong');
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "species" fails because ["species" cannot be checked if valid]') as CannotReachError
    };

    mockGetEntityFromServer.mockRejectedValue(e);

    const result = await SUT.validateSpecies(product, baseURL, propertyName, path);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
    expect(mockLoggerError).toHaveBeenCalledWith('Cannot get species from reference service', e);
  });
});

describe('validate', () => {

  const expectedBusinessError: BusinessError = {
    isError: true,
    error: new Error('child "species" fails because ["species" is invalid]') as CannotReachError
  };

  const expectedCannotReachError: BusinessError = {
    isError: true,
    error: new Error('child "species" fails because ["species" cannot be checked if valid]') as CannotReachError
  };

  let mockBreakDownNameAndCode;
  let parsedItem: Name.ParsedItem;
  let mockCheckIfEntityExistsInServer;

  const constructPath = (name: string, fao: string) : string => {
    return `/v1/species/search-exact?faoCode=${fao}&faoName=${name}`;
  };

  beforeEach(() => {
    parsedItem = {
      name : 'My Species',
      code : 'MSP'
    };

    mockCheckIfEntityExistsInServer = jest.spyOn(HTTP,'checkIfEntityExistsInServer');
    mockCheckIfEntityExistsInServer.mockResolvedValue(true);

    mockBreakDownNameAndCode = jest.spyOn(Name , 'breakDownNameAndCode' );
    mockBreakDownNameAndCode.mockReturnValue(parsedItem)
  });

  afterEach(()=> {
    jest.restoreAllMocks();
  });

  it('should call breakDownNameAndCode', async () => {
    await SUT.validate('itemWithCode', 'someScientificName', 'baseUrl','species', constructPath);
    expect(mockBreakDownNameAndCode).toHaveBeenCalled();
  });

  it('should return error if no parsedItem and no call checkIfEntityExistsInServer', async () => {
    mockBreakDownNameAndCode.mockReturnValue(null);
    const result = await SUT.validate('itemWithCode', 'someScientificName', 'baseUrl','species', constructPath);
    expect(result).toEqual(expectedBusinessError);
    expect(mockCheckIfEntityExistsInServer).not.toHaveBeenCalled();
  });

  it('should return error if parsedItem do not match original and no call checkIfEntityExistsInServer', async () => {
    const result = await SUT.validate('itemWithCode', 'someScientificName', 'baseUrl','species', constructPath);
    expect(result).toEqual(expectedBusinessError);
    expect(mockCheckIfEntityExistsInServer).not.toHaveBeenCalled();

  });

  it('should call checkIfEntityExistsInServer if parsedItem match original', async () => {
    await SUT.validate('My Species (MSP)', 'someScientificName', 'baseUrl','species', constructPath);
    expect(mockCheckIfEntityExistsInServer).toHaveBeenCalled();
  });

  it('should  return error if checkIfEntityExistsInServer fail', async () => {
    mockCheckIfEntityExistsInServer.mockRejectedValue(new Error('an error'));
    const result = await SUT.validate('My Species (MSP)', 'someScientificName', 'baseUrl','species', constructPath);
    expect(result).toEqual(expectedCannotReachError);
  });

  it('should  return error if checkIfEntityExistsInServer return false', async () => {
    mockCheckIfEntityExistsInServer.mockResolvedValue(false);
    const result = await SUT.validate('My Species (MSP)', 'someScientificName', 'baseUrl','species', constructPath);
    expect(result).toEqual(expectedBusinessError);
  });

  it('should return no errors for valid species', async () => {
    const result = await SUT.validate('My Species (MSP)', 'someScientificName', 'baseUrl','species', constructPath);
    expect(result).toEqual({error:null, isError: false});
  });

});

describe('validate countries', () => {
  let exportDestination: ICountry;

  const baseURL = 'some-url';
  const propertyName = 'exportDestination';
  const path = '/v1/countries';

  let mockGetEntityFromServer;
  let mockLoggerError;

  beforeEach(() => {
    mockGetEntityFromServer = jest.spyOn(HTTP, 'getEntityFromServer');
    mockGetEntityFromServer.mockResolvedValue([{
      officialCountryName: 'Japan',
      isoCodeAlpha2: 'JP',
      isoCodeAlpha3: 'JPN',
      isoNumericCode: '392'
    }]);
    mockLoggerError = jest.spyOn(logger, 'error');

    exportDestination = {
      officialCountryName: 'Japan',
      isoCodeAlpha2: 'JP',
      isoCodeAlpha3: 'JPN',
      isoNumericCode: '392'
    };
  });

  afterEach(() => {
    mockGetEntityFromServer.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should not return an error', async () => {
    const expected: BusinessError = {
      isError: false,
      error: null
    };

    const result = await SUT.validateCountries(exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error if official country name do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" is invalid]') as CannotReachError
    };

    const _exportDestination: ICountry = {
      ...exportDestination,
      officialCountryName: 'invalid'
    };

    const result = await SUT.validateCountries(_exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error if isoCodeAlpha2 do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" is invalid]') as CannotReachError
    };

    const _exportDestination: ICountry = {
      ...exportDestination,
      isoCodeAlpha2: 'invalid'
    };

    const result = await SUT.validateCountries(_exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error if isoCodeAlpha3 do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" is invalid]') as CannotReachError
    };

    const _exportDestination: ICountry = {
      ...exportDestination,
      isoCodeAlpha3: 'invalid'
    };

    const result = await SUT.validateCountries(_exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error if isoNumericCode do not match', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" is invalid]') as CannotReachError
    };

    const _exportDestination: ICountry = {
      ...exportDestination,
      isoNumericCode: 'invalid'
    };

    const result = await SUT.validateCountries(_exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error when exportDestination is not defined', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" is invalid]') as CannotReachError
    };

    const result = await SUT.validateCountries(undefined, baseURL, propertyName);

    expect(mockGetEntityFromServer).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error when an error is thrown', async () => {
    const e = new Error('something went wrong');
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "exportDestination" fails because ["exportDestination" cannot be checked if valid]') as CannotReachError
    };

    mockGetEntityFromServer.mockRejectedValue(e);

    const result = await SUT.validateCountries(exportDestination, baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
    expect(mockLoggerError).toHaveBeenCalledWith('Cannot get country name from reference service', e);
  });
});

describe('validate ps/sd commodity codes', () => {
  const baseURL = 'some-url';
  const propertyName = 'commodityCode';
  const path = '/v1/commodities';

  let mockGetEntityFromServer;
  let mockLoggerError;

  beforeEach(() => {
    mockGetEntityFromServer = jest.spyOn(HTTP, 'getEntityFromServer');
    mockGetEntityFromServer.mockResolvedValue([{
      code: '0123456',
      description: 'some commodity description'
    }]);
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockGetEntityFromServer.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should not return an error', async () => {
    const expected: BusinessError = {
      isError: false,
      error: null
    };

    const result = await SUT.validatePSSDCommodityCode('0123456', baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error if commodity code does not exist', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "commodityCode" fails because ["commodityCode" is invalid]') as CannotReachError
    };

    const result = await SUT.validatePSSDCommodityCode('01234567', baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error when commodity code is empty', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "commodityCode" fails because ["commodityCode" is invalid]') as CannotReachError
    };

    const result = await SUT.validatePSSDCommodityCode('', baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
  });

  it('should return an error when commodity code is not defined', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "commodityCode" fails because ["commodityCode" is invalid]') as CannotReachError
    };

    const result = await SUT.validatePSSDCommodityCode(undefined, baseURL, propertyName);

    expect(mockGetEntityFromServer).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error when commodity code is null', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "commodityCode" fails because ["commodityCode" is invalid]') as CannotReachError
    };

    const result = await SUT.validatePSSDCommodityCode(null, baseURL, propertyName);

    expect(mockGetEntityFromServer).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error when an error is thrown', async () => {
    const e = new Error('something went wrong');
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "commodityCode" fails because ["commodityCode" cannot be checked if valid]') as CannotReachError
    };

    mockGetEntityFromServer.mockRejectedValue(e);

    const result = await SUT.validatePSSDCommodityCode('', baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalledWith(baseURL, path, undefined);
    expect(result).toEqual(expected);
    expect(mockLoggerError).toHaveBeenCalledWith('Cannot get PS/SD commodity code from reference service', e);
  });
});

describe('check species name with suggestions', () => {

  const baseURL = 'some-url';
  const propertyName = 'species';

  let mockGetEntityFromServer;
  let mockLoggerError;

  beforeEach(() => {
    mockGetEntityFromServer = jest.spyOn(HTTP, 'getEntityFromServer');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockGetEntityFromServer.mockRestore();
    mockLoggerError.mockRestore();
  });


  it('should return an error if there was an issue getting the species', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('child "species" fails because ["species" cannot be checked if valid]') as CannotReachError
    };
    const error = new Error('something went wrong');
    mockGetEntityFromServer.mockRejectedValue(error);

    const result = await SUT.checkSpeciesNameWithSuggestions("cod", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if the species name result is 0', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('Incorect FAO code or Species name') as CannotReachError
    };
    mockGetEntityFromServer.mockResolvedValue([
      {
        "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
        "species": "Black scabbardfish (BSF)",
        "speciesCode": "BSF",
        "scientificName": "Aphanopus carbo",
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Marbled electric ray (TTR)",
        "speciesCode": "TTR",
        "scientificName": "Torpedo marmorata",
      }
    ]);

    const result = await SUT.checkSpeciesNameWithSuggestions("cod", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if the species name result is more than 5', async () => {
    const expected: BusinessError = {
      isError: true,
      error: new Error('Incorect FAO code or Species name') as CannotReachError
    };
    mockGetEntityFromServer.mockResolvedValue([
      {
        "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
        "species": "Atlantic cod (COD)",
        "speciesCode": "COD",
        "faoName": "Atlantic cod",
        "faoCode": "COD"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Dwarf codling (AIM)",
        "speciesCode": "AIM",
        "faoName": "Dwarf codling",
        "faoCode": "AIM"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Artic cod (ATG)",
        "speciesCode": "ATG",
        "faoName": "Artic cod",
        "faoCode": "ATG"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "East siberian cod (ATV)",
        "speciesCode": "ATV",
        "faoName": "East siberian cod",
        "faoCode": "ATV"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Crocodile snake eel (AOY)",
        "speciesCode": "AOY",
        "faoName": "Crocodile snake eel",
        "faoCode": "AOY"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Smallscale codlet (BVQ)",
        "speciesCode": "BVQ",
        "faoName": "Smallscale codlet",
        "faoCode": "BVQ"
      }
    ]);

    const result = await SUT.checkSpeciesNameWithSuggestions("cod", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if the species name result is 5 or less', async () => {
    const expected: SpeciesSuggestionError = {
      isError: true,
      error: new Error('Results match fewer than 5') as CannotReachError,
      resultList: ["Atlantic cod (COD)", "Dwarf codling (AIM)", "Artic cod (ATG)"]
    };
    mockGetEntityFromServer.mockResolvedValue([
      {
        "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
        "species": "Atlantic cod (COD)",
        "speciesCode": "COD",
        "faoName": "Atlantic cod",
        "faoCode": "COD"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Dwarf codling (AIM)",
        "speciesCode": "AIM",
        "faoName": "Dwarf codling",
        "faoCode": "AIM"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Artic cod (ATG)",
        "speciesCode": "ATG",
        "faoName": "Artic cod",
        "faoCode": "ATG"
      }
    ]);

    const result = await SUT.checkSpeciesNameWithSuggestions("cod", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return an error if the species name result is 1 but the input does not match', async () => {
    const expected: SpeciesSuggestionError = {
      isError: true,
      error: new Error('Results match fewer than 5') as CannotReachError,
      resultList: ["Atlantic cod (COD)"]
    };
    mockGetEntityFromServer.mockResolvedValue([
      {
        "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
        "species": "Atlantic cod (COD)",
        "speciesCode": "COD",
        "faoName": "Atlantic cod",
        "faoCode": "COD"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Dwarf codling (AIM)",
        "speciesCode": "AIM",
        "faoName": "Dwarf codling",
        "faoCode": "AIM"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Artic cod (ATG)",
        "speciesCode": "ATG",
        "faoName": "Artic cod",
        "faoCode": "ATG"
      }
    ]);

    const result = await SUT.checkSpeciesNameWithSuggestions("Atlantic cod (", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should not return an error if the species name result is exact', async () => {
    const expected = {
      isError: false,
      error: null
    };
    mockGetEntityFromServer.mockResolvedValue([
      {
        "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
        "species": "Atlantic cod (COD)",
        "speciesCode": "COD",
        "faoName": "Atlantic cod",
        "faoCode": "COD"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Dwarf codling (AIM)",
        "speciesCode": "AIM",
        "faoName": "Dwarf codling",
        "faoCode": "AIM"
      },
      {
        "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
        "species": "Artic cod (ATG)",
        "speciesCode": "ATG",
        "faoName": "Artic cod",
        "faoCode": "ATG"
      }
    ]);

    const result = await SUT.checkSpeciesNameWithSuggestions("Atlantic cod (COD)", baseURL, propertyName);

    expect(mockGetEntityFromServer).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});