import SUT from "./processing-statement";
import ApplicationConfig from '../../applicationConfig';
import * as ProcessingStatementService from "./processing-statement";
import * as OrchestrationService from "../orchestration.service";
import * as FishValidator from "../..//validators/fish.validator";
import * as DocumentValidator from "../../validators/documentValidator"
import * as CommodityCodes from "../../validators/pssdCommodityCode.validator";
import * as CountriesValidator from "../../validators/countries.validator";
import { ProcessingStatement } from "../../persistence/schema/frontEndModels/processingStatement";

describe('calling handler for /create-processing-statement/:documentNumber/add-consignment-details', () => {
  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-processing-statement/:documentNumber/add-consignment-details";
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it('with missing consignmentDescription validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with whitespace consignmentDescription validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with empty products array of products and descriptions', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'some consignment description',
      products: []
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with whitespace product details of products and descriptions', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'some consignment description',
      products: [{
        description: ' ',
        commodityCode: ' '
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with valid product details of products and descriptions', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'some consignment description',
      products: [{
        description: 'some description',
        commodityCode: 'commodity code'
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {};
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with valid product details of products and descriptions, without consignment descriptions', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'some description',
        commodityCode: 'commodity code'
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {};
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe('calling handler for /create-processing-statement/:documentNumber/add-consignment-details/:productIndex', () => {
  let mockValidateCommodityCode: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCommodityCode = jest.spyOn(CommodityCodes, 'validateCommodityCode');
    mockValidateCommodityCode.mockResolvedValue({ isError: false, error: null });
  });

  afterEach(() => {
    mockValidateCommodityCode.mockRestore();
  });

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-processing-statement/:documentNumber/add-consignment-details/:productIndex";
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'some product description',
        commodityCode: '03051234'
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it('with missing description validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        commodityCode: '03051234'
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      consignmentDescription: 'psAddProductDescriptionError'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).toHaveBeenCalled();
  });

  it('with missing commodity code validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'some product description',
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      commodityCode: 'psAddProductCommodityCodeError'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).not.toHaveBeenCalled();
  });

  it('with whitespace commodityCode validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'some product description',
        commodityCode: ' '
      }],
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      commodityCode: 'psAddProductCommodityCodeError'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).not.toHaveBeenCalled();
  });

  it('with invalid commodity code validates as error', async () => {
    mockValidateCommodityCode.mockResolvedValue({ isError: true, error: new Error('Cannot get PS/SD commodity code from reference service') });

    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'some product description',
        commodityCode: 'some invalid commodity code'
      }]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      commodityCode: 'psAddProductCommodityCodeError'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).toHaveBeenCalled();
  });

  it('with whitespace description validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: ' ',
        commodityCode: '03051234'
      }],
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      consignmentDescription: 'psAddProductDescriptionError'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).toHaveBeenCalled();
  });

  it('with description validates as over 50 character error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-consignment-details/:productIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      products: [{
        description: 'this is a description with over 50 characters so this should error',
        commodityCode: '03051234'
      }],
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { productIndex: 0 }
    });

    const expected = {
      consignmentDescription: 'psAddProductDescriptionCharacterError'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateCommodityCode).toHaveBeenCalled();
  });
});

it('calling handler for /create-processing-statement/:documentNumber/catch-added with missing addAnotherCatch validates as error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/catch-added';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset'
    };

    const {errors} = await handler({
      data: data,
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      addAnotherCatch: 'ccLandingTypeSelectOption'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
});

it('calling handler for /create-processing-statement/:documentNumber/catch-added with addAnotherCatch "yes" redirects to add-catch-details', async () => {
  const currentUrl = '/create-processing-statement/:documentNumber/catch-added';
  const handler = SUT[currentUrl];

  const data = {
    catches: [
      { species: 'Atlantic Cod', catchCertificateNumber: 'CT-111111' }
    ],
    addAnotherCatch: 'yes'
  };

  const result = await handler({
    data: data,
    currentUrl: currentUrl,
    errors: {}
  });

  expect(result.errors).toEqual({});
  expect(result.next).toBe('/create-processing-statement/add-catch-details/1');
});

it('calling handler for /create-processing-statement/:documentNumber/catch-added with addAnotherCatch "no" redirects to add-processing-plant-details', async () => {
  const currentUrl = '/create-processing-statement/:documentNumber/catch-added';
  const handler = SUT[currentUrl];

  const data = {
    catches: [
      { species: 'Atlantic Cod', catchCertificateNumber: 'CT-111111' }
    ],
    addAnotherCatch: 'no'
  };

  const result = await handler({
    data: data,
    currentUrl: currentUrl,
    errors: {}
  });

  expect(result.errors).toEqual({});
  expect(result.next).toBe('/create-processing-statement/add-processing-plant-details');
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-details', () => {
  let mockValidateCountriesName: jest.SpyInstance;
  let mockValidateSpeciesName: jest.SpyInstance;

  beforeEach(() => {
    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false, error: null });
    mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidateSpeciesName.mockResolvedValue({ isError: false });
  });

  afterEach(() => {
    mockValidateCountriesName.mockRestore();
    mockValidateSpeciesName.mockRestore();
  });

  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [{
        id: '',
        catchCertificateType: undefined,
        speciesCommodityCode: '03023110'
      }],
      consignmentDescription: ' ',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-0-catchCertificateNumber": 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber',
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-species": 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    }
    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });

  it('should return errors when certificate number has invalid characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'CT-902-9_(-)_()',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorCCNumberMustOnlyContain',
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
    };
    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });

  it('should return errors when a uk certificate number is invalid', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  it('should not return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a non uk certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          catchCertificateType: 'non_uk',
          issuingCountry: { officialCountryName: '' },
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {};

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should return a psAddCatchDetailsErrorNonUKCCNumberCharLimit error if a non UK catch certificate number exceeds 52 characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE-WITH-MORE-THAN-52-CHARACTERS',
          catchCertificateType: 'non_uk',
          issuingCountry: { officialCountryName: '' },
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorNonUKCCNumberCharLimit',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should handle issuingCountry as string and return invalid country error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const data: any = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'VALID-CERTIFICATE-123',
          catchCertificateType: 'non_uk',
          issuingCountry: 'InvalidCountryName',  // String format to simulate browser input
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-issuingCountry': 'psAddCatchDetailsErrorEnterIssuingCountry',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should return psAddCatchDetailsErrorEnterIssuingCountry error for non_uk certificate with empty issuingCountry', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'VALID-CERTIFICATE-123',
          catchCertificateType: 'non_uk',
          issuingCountry: { officialCountryName: '' },  // Empty country name
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-issuingCountry': 'psAddCatchDetailsErrorEnterIssuingCountry',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should return psAddCatchDetailsErrorEnterIssuingCountry error for non_uk certificate with undefined issuingCountry', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'VALID-CERTIFICATE-123',
          catchCertificateType: 'non_uk',
          // issuingCountry: undefined (not set)
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-issuingCountry': 'psAddCatchDetailsErrorEnterIssuingCountry',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });


  it('should not return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for an unspecified certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType"
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });

  it('should return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a valid uk PS certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'GBR-2022-PS-01234ABCD',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  it('should return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a valid uk SD certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          speciesCode: 'COD',
          catchCertificateNumber: 'GBR-2022-SD-01234ABCD',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
      exportedTo: {
        officialCountryName: ''
      },
      error: ''
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId',
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  describe('when validating a correctly formatted catch certificate', () => {
    let mockValidateCatchCertificate: jest.SpyInstance;
    let mockValidateSpeciesName: jest.SpyInstance;
    let mockValidateSpecies: jest.SpyInstance;
    let mockValidateCommodityCode: jest.SpyInstance;

    beforeEach(() => {
      mockValidateCatchCertificate = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
      mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
      mockValidateSpeciesName.mockResolvedValue({ isError: false });
      mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
      mockValidateSpecies.mockResolvedValue(false);
      mockValidateCommodityCode = jest.spyOn(DocumentValidator, 'validateCommodityCode');
      mockValidateCommodityCode.mockResolvedValue(true);
    });

    afterEach(() => {
      mockValidateCatchCertificate.mockRestore();
      mockValidateSpeciesName.mockRestore();
      mockValidateSpecies.mockRestore();
      mockValidateCommodityCode.mockRestore();
    });

    it('should return a psAddCatchDetailsErrorUKCCNumberNotExist error for a certificate number of a missing COMPLETE document', async () => {
      mockValidateCatchCertificate.mockResolvedValue(false);
      mockValidateSpecies.mockResolvedValue(true);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            speciesCode: 'COD',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110',
            speciesCommodityCode: '03023110'
          }
        ],
        consignmentDescription: '',
        exportedTo: {
          officialCountryName: ''
        },
        error: ''
      };

      const { errors } = await handler({
        data: data,
        errors: {},
        documentNumber: 'GBR-2023-PS-01234ABCD',
        userPrincipal: 'bob',
        contactId: 'contactId',
      params: { catchIndex: 0 }
      });

      const expectedErrors = {
        'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberNotExist',
      };

      expect(mockValidateCatchCertificate).toHaveBeenCalledWith('GBR-2022-CC-01234ABCD', 'bob', 'contactId', 'GBR-2023-PS-01234ABCD');
      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });

    it('should return a psAddCatchDetailsErrorUKCCSpeciesMissing error for a valid uk certificate number when the given species is not present on the reference catch certificate', async () => {
      mockValidateCatchCertificate.mockResolvedValue(true);
      mockValidateSpecies.mockResolvedValue(false);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            speciesCode: 'COD',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110',
            speciesCommodityCode: '03023110'
          }
        ],
        consignmentDescription: '',
        exportedTo: {
          officialCountryName: ''
        },
        error: ''
      };

      const { errors } = await handler({
        data: data,
        errors: {},
        documentNumber: 'GBR-2023-PS-01234ABCD',
        userPrincipal: 'bob',
        contactId: 'contactId',
      params: { catchIndex: 0 }
      });

      const expectedErrors = {
        'catches-0-species': 'psAddCatchDetailsErrorUKCCSpeciesMissing',
      };

      expect(mockValidateSpecies).toHaveBeenCalledWith('GBR-2022-CC-01234ABCD', 'Atlantic Cod', 'COD', 'bob', 'contactId', 'GBR-2023-PS-01234ABCD');
      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });

    it('should not return any errors for a valid uk certificate number', async () => {
      mockValidateCatchCertificate.mockResolvedValue(true);
      mockValidateSpecies.mockResolvedValue(true);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            speciesCode: 'COD',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110',
            speciesCommodityCode: '03023110'
          }
        ],
        consignmentDescription: '',
        exportedTo: {
          officialCountryName: ''
        },
        error: ''
      };

      const { errors } = await handler({
        data: data,
        errors: {},
        documentNumber: 'GBR-2023-PS-01234ABCD',
        userPrincipal: 'bob',
        contactId: 'contactId',
      params: { catchIndex: 0 }
      });

      const expectedErrors = {};

      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });

    it('should return a psAddCatchDetailsErrorUKCCCommodityCodeMissing error when the commodity code is not found on the reference catch certificate', async () => {
      mockValidateCatchCertificate.mockResolvedValue(true);
      mockValidateSpecies.mockResolvedValue(true);
      mockValidateCommodityCode.mockResolvedValue(false);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            speciesCode: 'COD',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110',
            speciesCommodityCode: '03023110'
          }
        ],
        consignmentDescription: '',
        exportedTo: {
          officialCountryName: ''
        },
        error: ''
      };

      const { errors } = await handler({
        data: data,
        errors: {},
        documentNumber: 'GBR-2023-PS-01234ABCD',
        userPrincipal: 'bob',
        contactId: 'contactId',
        params: { catchIndex: 0 }
      });

      const expectedErrors = {
        'catches-0-speciesCommodityCode': 'psAddCatchDetailsErrorUKCCCommodityCodeMissing',
      };

      expect(mockValidateCommodityCode).toHaveBeenCalledWith('GBR-2022-CC-01234ABCD', '03023110', 'bob', 'contactId', 'GBR-2023-PS-01234ABCD');
      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });

    it('should not check commodity code when species is missing from the catch certificate', async () => {
      mockValidateCatchCertificate.mockResolvedValue(true);
      mockValidateSpecies.mockResolvedValue(false);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            speciesCode: 'COD',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110',
            speciesCommodityCode: '03023110'
          }
        ],
        consignmentDescription: '',
        exportedTo: {
          officialCountryName: ''
        },
        error: ''
      };

      const { errors } = await handler({
        data: data,
        errors: {},
        documentNumber: 'GBR-2023-PS-01234ABCD',
        userPrincipal: 'bob',
        contactId: 'contactId',
        params: { catchIndex: 0 }
      });

      expect(mockValidateCommodityCode).not.toHaveBeenCalled();
      expect(errors['catches-0-species']).toBe('psAddCatchDetailsErrorUKCCSpeciesMissing');
    });
  });
});

describe('/create-processing-statement/:documentNumber/add-catch-details/:productId', () => {
  const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId';
  const handler = SUT[currentUrl];

  it('adds error when catches missing', async () => {
    const result = await handler({ data: {}, errors: {}, params: { productId: 'prod-1' }, documentNumber: 'GBR-2023-PS-01234ABCD', userPrincipal: 'bob', contactId: 'contactId' });
    console.log('result.errors', result.errors);
    expect(result.errors).toEqual({ 
      "catches-0-catchCertificateNumber": "psAddCatchDetailsErrorEnterTheCatchCertificateNumber",
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName",
      "catches-0-speciesCommodityCode": "psAddCatchDetailsErrorEnterSpeciesCommodityCode",
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    });
  });

  it('adds error when no catch matches productId', async () => {
    const data = { catches: [{ productId: 'other' }] };
    const result = await handler({ data, errors: {}, params: { productId: 'prod-1' }, documentNumber: 'GBR-2023-PS-01234ABCD', userPrincipal: 'bob', contactId: 'contactId' });
    expect(result.errors).toEqual({ 
      "catches-0-catchCertificateNumber": "psAddCatchDetailsErrorEnterTheCatchCertificateNumber",
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName",
      "catches-0-speciesCommodityCode": "psAddCatchDetailsErrorEnterSpeciesCommodityCode",
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    });
  });

  it('does not add error when first catch exists and productId matches', async () => {
    const data = { catches: [{ productId: 'prod-1' }] };
    const result = await handler({ data, errors: {}, params: { productId: 'prod-1' }, documentNumber: 'GBR-2023-PS-01234ABCD', userPrincipal: 'bob', contactId: 'contactId' });
    expect(result.errors).toEqual({});
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{ speciesCommodityCode: '03023110' }],
      consignmentDescription: '',
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 0 },
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId'
    });

    const expectedErrors = {
      "catches-0-catchCertificateNumber": 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber',
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-species": 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors when required props are missing also checking catchCertificateNumber regex', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateNumber: 'CT-902-9_(-)_()',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 0 },
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorCCNumberMustOnlyContain',
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
    };
    expect(errors).toEqual(expectedErrors);
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-type', () => {
  let mockValidateSpeciesName: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;

  beforeEach(() => {
    mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidateSpeciesWithSuggestions = jest.spyOn(FishValidator, 'validateSpeciesWithSuggestions');
  });

  afterEach(() => {
    mockValidateSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
  });

  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName",
    }

    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors when certificate type is invalid', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'blah',
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorCatchCertificateTypeInvalid",
      "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"
    };
    expect(mockValidateSpeciesName).toHaveBeenCalled();
    expect(errors).toEqual(expectedErrors);
  });

  it('should not return catchtype errors when one of the other catches are missing a catch certificate type', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        },
        {
          _id: '639343ef6fa3452751b7478a',
          species: 'Thermarces cerberus (TES)',
          catchCertificateNumber: '1222',
          id: '1222-1669097770',
          scientificName: 'Thermarces cerberus'
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(mockValidateSpeciesName).toHaveBeenCalled();
    const expectedErrors = { "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName" };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-incorrect error if there in nonjs and an incorrect search', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Incorect FAO code or Species name')
    });

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-species-incorrect": "psAddCatchDetailsErrorIncorrectFaoOrSpecies" };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-suggest error if there in nonjs and an incorrect search with possible results', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Results match fewer than 5'),
      resultList: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    });

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-species-suggest": {
      translation: 'psAddCatchDetailsErrorSpeciesSuggestion',
      possibleMatches: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    } };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return the default error message if the user did not enter any text even in nonjs use cases', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: '',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).not.toHaveBeenCalled();
    const expectedErrors = {"catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"};
    expect(errors).toEqual(expectedErrors);
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-type/:catchIndex', () => {
  let mockValidateSpeciesName: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;

  beforeEach(() => {
    mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidateSpeciesWithSuggestions = jest.spyOn(FishValidator, 'validateSpeciesWithSuggestions');
  });

  afterEach(() => {
    mockValidateSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
  });
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"
    }

    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors when catch certificate type is invalid', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'blah'
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 0 }
    });

    const expectedErrors = {
      "catches-0-catchCertificateType": "psAddCatchTypeErrorCatchCertificateTypeInvalid",
      "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"
    };
    expect(mockValidateSpeciesName).toHaveBeenCalled();
    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors for the catch that is missing a catch certificate type', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        },
        {
          _id: '639343ef6fa3452751b7478a',
          species: 'Thermarces cerberus (TES)',
          catchCertificateNumber: '1222',
          id: '1222-1669097770',
          scientificName: 'Thermarces cerberus'
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 1 }
    });

    const expectedErrors = {
      "catches-1-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"
    };
    expect(mockValidateSpeciesName).toHaveBeenCalled();
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-incorrect error if there in nonjs and an incorrect search', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        },
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Incorect FAO code or Species name')
    });

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 1 }
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-species-incorrect": "psAddCatchDetailsErrorIncorrectFaoOrSpecies" };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return the default error message if the user did not enter any text even in nonjs use cases', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: '',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 0 }
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).not.toHaveBeenCalled();
    const expectedErrors = {"catches-species": "psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName"};
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-suggest error if there in nonjs and an incorrect search with possible results', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-type/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        },
        {
          _id: '639343ef6fa3452751b74789',
          species: 'Yellowback seabream (DTT)',
          catchCertificateNumber: '',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '3',
          exportWeightBeforeProcessing: '2',
          exportWeightAfterProcessing: '2',
          id: '12-3996489220',
          scientificName: 'Dentex tumifrons'
        }
      ],
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Results match fewer than 5'),
      resultList: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    });

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 1 }
    });

    expect(mockValidateSpeciesName).not.toHaveBeenCalled();
    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-species-suggest": {
      translation: 'psAddCatchDetailsErrorSpeciesSuggestion',
      possibleMatches: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    } };
    expect(errors).toEqual(expectedErrors);
  });
});

describe("handler for /create-processing-statement/:documentNumber/add-catch-weights", () => {
  const currentUrl =
    "/create-processing-statement/:documentNumber/add-catch-weights";
  const handler = SUT[currentUrl];

  let data = {
    catches: [{}],
    consignmentDescription: " ",
  };

  it("should return errors when required props are missing", async () => {
    data = {
      catches: [{}],
      consignmentDescription: " ",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expectedErrors = {
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG"
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("should return the relevant errors if numbers are not correct (up to 2 decimal places)", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          speciesCode: 'COD',
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "123.12345",
          exportWeightBeforeProcessing: "10.456",
          exportWeightAfterProcessing: "10.54567",
          catchCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightMaximum2DecimalBeforeProcessing",
      "catches-0-exportWeightAfterProcessing":
        "psAddCatchWeightsErrorEnterExportWeightMaximum2DecimalAfterProcessing",
    };
    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if numbers are equal to or less than 0", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          speciesCode: 'COD',
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "-123",
          exportWeightBeforeProcessing: "0",
          exportWeightAfterProcessing: "-123.456",
          catchCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorExportWeightGreaterThanNullBeforeProcessing",
      "catches-0-exportWeightAfterProcessing":
        "psAddCatchWeightsErrorExportWeightGreaterThanNullAfterProcessing",
    };
    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "1",
          exportWeightBeforeProcessing: "10",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight with numbers", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: 1,
          exportWeightBeforeProcessing: 10,
          exportWeightAfterProcessing: 10,
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight with floats", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "10.00",
          exportWeightBeforeProcessing: "10.01",
          exportWeightAfterProcessing: 10,
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight with 2 floats", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Herring",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: 10.01,
          exportWeightBeforeProcessing: 10.02,
          exportWeightAfterProcessing: 10,
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return error when after-processing weight exceeds before-processing weight", async () => {
    const { errors } = await handler({
      data: {
        catches: [{
          catchCertificateType: 'uk',
          exportWeightBeforeProcessing: '10',
          exportWeightAfterProcessing: '11',
        }]
      },
      errors: {},
    });

    expect(errors['catches-0-exportWeightAfterProcessing']).toBe('psAddCatchWeightsErrorExportWeightAfterProcessingExceedsBeforeProcessing');
  });

  it("should return no errors", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "10",
          exportWeightBeforeProcessing: "10.00",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {};

    expect(errors).toEqual(expected);
  });

  it("should return error when totalWeightLanded is <= 0 for non_uk catch certificate", async () => {
    const { errors } = await handler({
      data: {
        catches: [{
          catchCertificateType: 'non_uk',
          totalWeightLanded: '-1',
          exportWeightBeforeProcessing: '10',
          exportWeightAfterProcessing: '5',
        }]
      },
      errors: {},
    });

    expect(errors['catches-0-totalWeightLanded']).toBe('psAddCatchWeightsErrorTotalWeightGreaterThanNull');
  });

  it("should return error when totalWeightLanded is missing for non_uk catch certificate", async () => {
    const { errors } = await handler({
      data: {
        catches: [{
          catchCertificateType: 'non_uk',
          // totalWeightLanded intentionally absent
          exportWeightBeforeProcessing: '10',
          exportWeightAfterProcessing: '5',
        }]
      },
      errors: {},
    });

    expect(errors['catches-0-totalWeightLanded']).toBe('psAddCatchWeightsErrorEnterTotalWeightLandedInKG');
  });

  it("should return error when totalWeightLanded has more than 2 decimal places for non_uk catch certificate", async () => {
    const { errors } = await handler({
      data: {
        catches: [{
          catchCertificateType: 'non_uk',
          totalWeightLanded: '10.123',
          exportWeightBeforeProcessing: '5',
          exportWeightAfterProcessing: '4',
        }]
      },
      errors: {},
    });

    expect(errors['catches-0-totalWeightLanded']).toBe('psAddCatchWeightsErrorEnterTotalWeightMaximum2Decimal');
  });

  it("should convert valid totalWeightLanded to string for non_uk catch certificate", async () => {
    const { errors } = await handler({
      data: {
        catches: [{
          catchCertificateType: 'non_uk',
          totalWeightLanded: '10.12',
          exportWeightBeforeProcessing: '5',
          exportWeightAfterProcessing: '4',
        }]
      },
      errors: {},
    });

    expect(errors).toEqual({});
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-weights/:catchIndex', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-weights/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: {
        catchIndex: 0
      }
    });

    const expectedErrors = {
      'catches-0-exportWeightAfterProcessing': 'psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing',
      'catches-0-exportWeightBeforeProcessing': 'psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing',
      'catches-0-totalWeightLanded': "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight for the corresponding catch", async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-weights/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "1",
          exportWeightBeforeProcessing: "10",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
        {
          species: "Atlantic Herring",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "1",
          exportWeightBeforeProcessing: "11",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: {
        catchIndex: 1
      }
    });

    const expected = {
      "catches-1-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return the relevant errors if weight in kg (before processing) is greater that total weight for the corresponding catch with floats", async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-weights/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "1",
          exportWeightBeforeProcessing: "10",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
        {
          species: "Atlantic Herring",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "11.56",
          exportWeightBeforeProcessing: "11.57",
          exportWeightAfterProcessing: "10",
          catchesCertificateType: 'uk'
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: {
        catchIndex: 1
      }
    });

    const expected = {
      "catches-1-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight"
    };

    expect(errors).toEqual(expected);
  });

  it("should return error when after-processing weight exceeds before-processing weight for the corresponding catch", async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-weights/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          catchCertificateType: 'uk',
          exportWeightBeforeProcessing: "10",
          exportWeightAfterProcessing: "5",
        },
        {
          species: "Atlantic Herring",
          catchCertificateNumber: "CT-222222",
          catchCertificateType: 'uk',
          exportWeightBeforeProcessing: "8",
          exportWeightAfterProcessing: "9",
        },
      ],
      consignmentDescription: "A description",
    };

    const { errors } = await handler({
      data: data,
      errors: {},
      params: { catchIndex: 1 }
    });

    expect(errors).toEqual({
      "catches-1-exportWeightAfterProcessing": "psAddCatchWeightsErrorExportWeightAfterProcessingExceedsBeforeProcessing"
    });
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-processing-plant-details', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
      plantName: 'name'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      'personResponsibleForConsignment': 'psAddProcessingPDErrorPersonResponsibleForConsignment',
      'plantApprovalNumber': 'psAddProcessingPDErrorPlantApprovalNumber',
    };

    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors personResponsibleForConsignment field exceeds the limit of characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      personResponsibleForConsignment: 'Ivina The first of her name mother of the cats and the coffee lover',
      plantApprovalNumber: 'plant approval number',
      plantName: 'name'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      'personResponsibleForConsignment': "psAddProcessingPDErrorPersonResponsibleForConsignmentLength"
    };

    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors to personResponsibleForConsignment when there are invalid characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      personResponsibleForConsignment: 'Ivin@ The f1rst 0f her n@m£',
      plantApprovalNumber: 'plant approval number',
      plantName: 'name'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      'personResponsibleForConsignment': 'psAddProcessingPDErrorResponsibleValidation'
    };

    expect(errors).toEqual(expectedErrors);
  });

  it('with missing plantName validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      personResponsibleForConsignment: 'Personal Responsible',
      plantApprovalNumber: 'plant approval number'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantName: 'psAddProcessingPlantAddressErrorNullPlantName'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with incorrect plantName validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      personResponsibleForConsignment: 'Personal Responsible',
      plantApprovalNumber: 'plant approval number',
      plantName: '!M&S'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantName: 'psAddProcessingPlantAddressErrorFormatPlantName'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with plantName validates on exceed length limit as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      personResponsibleForConsignment: 'Personal Responsible',
      plantApprovalNumber: 'plant approval number',
      plantName: 'Hw99zXbw0YqZ9RY8SaIxpVs4xm1t30zj6vC LxKmH3fcKJjiSnWJKax'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantName: 'psAddProcessingPlantAddressErrorMaxLimitPlantName'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-health-certificate', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-health-certificate';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expectedErrors = {
      'healthCertificateDate': 'psAddHealthCertificateErrorHealthCertificateDate',
      'healthCertificateNumber': 'psAddHealthCertificateErrorFormatHealthCertificateNumber',
    };

    expect(errors).toEqual(expectedErrors);
  });

  it('should return error when healthCertificateDate is not a valid date', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-health-certificate';
    const handler = SUT[currentUrl];

    const data = {
      healthCertificateNumber: '11/1/111111',
      healthCertificateDate: '99/99/9999',
    };

    const { errors } = await handler({ data, errors: {} });

    expect(errors.healthCertificateDate).toBe('psAddHealthCertificateErrorRealDateHealthCertificateDate');
  });

  it('should return error when healthCertificateDate exceeds maximum future date', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-health-certificate';
    const handler = SUT[currentUrl];

    const data = {
      healthCertificateNumber: '11/1/111111',
      healthCertificateDate: '01/01/2100',
    };

    const { errors } = await handler({ data, errors: {} });

    expect(errors.healthCertificateDate).toBe('psAddHealthCertificateErrorMaxDaysHealthCertificateDate');
  });

  it('should clean healthCertificateDate when it is a valid past date', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-health-certificate';
    const handler = SUT[currentUrl];

    const data = {
      healthCertificateNumber: '11/1/111111',
      healthCertificateDate: '01/01/2022',
    };

    const { errors } = await handler({ data, errors: {} });

    expect(errors.healthCertificateDate).toBeUndefined();
  });
});

describe('calling handler for /create-processing-statement/:documentNumber/add-processing-plant-details', () => {
  it('with all mandatory fields validates as OK', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it('with missing personResponsibleForConsignment validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment:
        'psAddProcessingPDErrorPersonResponsibleForConsignment'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with missing plantApprovalNumber validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantApprovalNumber: 'psAddProcessingPDErrorPlantApprovalNumber'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with missing plantAddressOne validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'psAddProcessingPlantAddressErrorAddress'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with missing plantAddressOne reports an error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: '',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'Enter the building and street (address line 1 of 2)'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with missing plantTownCity validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: '',
      plantPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantTownCity: 'Enter the town or city'
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with missing plantPostcode validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const data = {
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantTownCity: 'Seaham',
      // plantPostcode intentionally absent
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors.plantPostcode).toBe('Enter the postcode');
  });

  it('with whitespace personResponsibleForConsignment, plantApprovalNumber validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: ' ',
      plantApprovalNumber: ' ',
      plantName: 'name'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment:
        'psAddProcessingPDErrorPersonResponsibleForConsignment',
      plantApprovalNumber: 'psAddProcessingPDErrorPlantApprovalNumber',
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('with special characters personResponsibleForConsignment, plantApprovalNumber validates as error', async () => {
    const currentUrl =
      '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'isaac',
      plantApprovalNumber: '@@@@@@@@',
      plantName: 'name'
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    const expected = {
      plantApprovalNumber: 'psAddProcessingPDFormatErrorPlantApprovalNumber',
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe('validateCatchDetails', () => {
  const index = 0;
  const errors = {};
  const documentNumber = 'GBR-2023-PS-01234ABCD';
  const userPrincipal = 'bob';
  const contactId = 'contactId';

  let mockValidateSpeciesName: jest.SpyInstance

  beforeEach(() => {
    mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
  });

  afterEach(() => {
    mockValidateSpeciesName.mockRestore();
  });

  it('Should validate species & catchCertificateNumber', async () => {
    const data = {
      catches: [
        {
          species: '(___223&883',
          catchCertificateNumber: '  ',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
    };

    const expectedErrors = {
      errors: {
        'catches-0-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
        'catches-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
        'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber',
      }
    };
    const ctch = data.catches[index];
    const speciesValidation = await ProcessingStatementService.validateSpeciesWithinCatchDetails(ctch, index, false, errors);
    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, speciesValidation.errors, documentNumber, userPrincipal, contactId);
    expect(result).toStrictEqual(expectedErrors);
  });

  it('Should validate with getReferenceServiceUrl only when adding species', async () => {

    const data = {
      catches: [
        {
          species: '1&$223&883',
          catchCertificateNumber: '432(_)223',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          scientificName: 'someScientificName',
          speciesCommodityCode: '03023110'
        }
      ],
      consignmentDescription: '',
    };

    const expectedErrors = {
      errors: {
        'catches-0-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
        'catches-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
        'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorCCNumberMustOnlyContain',
      }
    };
    const ctch = data.catches[index];
    const refUrl = ApplicationConfig.getReferenceServiceUrl();
    const anyError = await FishValidator.validateSpeciesName(ctch.species, ctch.scientificName, refUrl);
    const speciesValidation = await ProcessingStatementService.validateSpeciesWithinCatchDetails(ctch, index, false, errors);
    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, speciesValidation.errors, documentNumber, userPrincipal, contactId);
    expect(anyError.isError).toBeTruthy();
    expect(result).toStrictEqual(expectedErrors);
  });

  it('Should validate when not adding species', async () => {
    const data = {
      catches: [
        {
          species: " ",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "1112",
          exportWeightBeforeProcessing: "1111",
          exportWeightAfterProcessing: "1110",
          catchesCertificateType: 'uk'
        },
      ],
    };

    const ctch = data.catches[index];
    const mockValidateCCNumberFormat = jest.spyOn(OrchestrationService, 'validateCCNumberFormat');
    mockValidateCCNumberFormat.mockReturnValue(true);
    const speciesValidation = await ProcessingStatementService.validateSpeciesWithinCatchDetails(ctch, index, false, errors);
    await ProcessingStatementService.validateCatchDetails(ctch, index, speciesValidation.errors, documentNumber, userPrincipal, contactId);

    expect(mockValidateCCNumberFormat).toHaveBeenCalledWith(ctch.catchCertificateNumber);
  });

  it('Should validate when not adding species for else part', async () => {
    const data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-1111111",
          totalWeightLanded: "1112",
          exportWeightBeforeProcessing: "1111",
          exportWeightAfterProcessing: "1110",
          scientificName: 'someScientificName',
          catchesCertificateType: 'uk'
        },
      ],
    };

    const refUrl = ApplicationConfig.getReferenceServiceUrl();
    const ctch = data.catches[index];

    mockValidateSpeciesName.mockResolvedValue({ isError: false });
    const speciesValidation = await ProcessingStatementService.validateSpeciesWithinCatchDetails(ctch, index, false, errors);
    await ProcessingStatementService.validateCatchDetails(ctch, index, speciesValidation.errors, documentNumber, userPrincipal, contactId);

    expect(mockValidateSpeciesName).toHaveBeenCalledWith(ctch.species, ctch.scientificName, refUrl);
  });

  it('should return species error when species is present but speciesCode is missing', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      // speciesCode intentionally absent to trigger the speciesCode branch in validateSpeciesInput
    };
    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-species`]).toBe('psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName');
  });

  it('should return species error when speciesCode is whitespace', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: '   ',
      // no catchCertificateNumber to avoid network calls
    };
    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-species`]).toBe('psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName');
  });

  it('should set species error from validateSpeciesAgainstReferenceData when reference data returns isError', async () => {
    mockValidateSpeciesName.mockResolvedValue({ isError: true });

    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      // no catchCertificateNumber to avoid extra network calls
    };
    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-species`]).toBe('psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName');
    expect(mockValidateSpeciesName).toHaveBeenCalled();
  });

  it('should return speciesCommodityCode error when speciesCommodityCode is missing', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      // speciesCommodityCode intentionally absent
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorEnterSpeciesCommodityCode');
  });

  it('should return speciesCommodityCode error when speciesCommodityCode is whitespace', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '   ',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorEnterSpeciesCommodityCode');
  });

  it('should not return speciesCommodityCode error when speciesCommodityCode is present', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '03023110',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBeUndefined();
  });

  it('should return speciesCommodityCode min length error when fewer than 6 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '0302',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorSpeciesCommodityCodeMinLength');
  });

  it('should return speciesCommodityCode min length error when exactly 5 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '03023',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorSpeciesCommodityCodeMinLength');
  });

  it('should not return speciesCommodityCode min length error when exactly 6 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '030231',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBeUndefined();
  });

  it('should return speciesCommodityCode max length error when more than 10 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '03023110999',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorSpeciesCommodityCodeMaxLength');
  });

  it('should return speciesCommodityCode max length error when exactly 11 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '03023110991',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBe('psAddCatchDetailsErrorSpeciesCommodityCodeMaxLength');
  });

  it('should not return speciesCommodityCode max length error when exactly 10 digits are entered', async () => {
    const ctch: any = {
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      scientificName: 'Gadus morhua',
      catchCertificateNumber: 'CT-111111',
      speciesCommodityCode: '0302311099',
    };

    mockValidateSpeciesName.mockResolvedValue({ isError: false });

    const result = await ProcessingStatementService.validateCatchDetails(ctch, index, {}, documentNumber, userPrincipal, contactId);

    expect(result.errors[`catches-${index}-speciesCommodityCode`]).toBeUndefined();
  });
});

describe('calling handler for /create-processing-statement/:documentNumber/progress (FI0-10647)', () => {
  it('should return no errors when all products have catches array', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: [
        {
          id: 'product-1',
          description: 'Product with catches'
        },
        {
          id: 'product-2',
          description: 'Product with catches'
        }
      ],
      catches: [
        {
          productId: 'product-1',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'GBR-2024-CC-123'
        },
        {
          productId: 'product-2',
          species: 'Pacific Cod',
          catchCertificateNumber: 'GBR-2024-CC-456'
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({});
  });

  it('should return error when product has description but no catches or caughtBy', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: [
        {
          id: 'product-1',
          description: 'Valid product'
        },
        {
          id: 'product-2',
          description: 'Description only product'
          // No catches with productId = 'product-2'
        }
      ],
      catches: [
        {
          productId: 'product-1',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'GBR-2024-CC-123'
        }
        // Missing catch for product-2
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({
      products: 'ccProgressPageProductDetailsRequired'
    });
  });

  it('should return error when all products have description but no catches', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: [
        {
          id: 'product-1',
          description: 'First description only'
        },
        {
          id: 'product-2',
          productDescription: 'Second description only'
        }
      ],
      catches: [] // No catches at all
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({
      products: 'ccProgressPageProductDetailsRequired'
    });
  });

  it('should return no errors when products array is empty', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: []
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({});
  });

  it('should return no errors when products is undefined', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {};

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({});
  });

  it('should return error when product has productDescription but no catches', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: [
        {
          productDescription: 'Using productDescription field',
          // No catches or caughtBy
        }
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({
      products: 'ccProgressPageProductDetailsRequired'
    });
  });

  it('should skip null or non-object entries in products array without error', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/progress';
    const handler = SUT[currentUrl];

    const data = {
      products: [null, undefined, 'not-an-object', 42],
      catches: []
    };

    const { errors } = await handler({
      data: data,
      errors: {}
    });

    expect(errors).toEqual({});
  });
});

describe('emoji validation across processing statement fields', () => {
  const baseDetails = {
    catches: [],
    personResponsibleForConsignment: 'Hank',
    plantApprovalNumber: 'Marvin',
  };

  it('should return emojiCharactersNotPermitted for plantName containing emoji', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const { errors } = await handler({
      data: { ...baseDetails, plantName: "Plant \u{1F40F} Name" },
      errors: {}
    });

    expect(errors).toEqual({ plantName: 'emojiCharactersNotPermitted' });
  });

  it('should return emojiCharactersNotPermitted for personResponsibleForConsignment containing emoji', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
    const handler = SUT[currentUrl];

    const { errors } = await handler({
      data: { ...baseDetails, plantName: 'Valid Plant', personResponsibleForConsignment: "Hank \u{1F600}" },
      errors: {}
    });

    expect(errors).toEqual({ personResponsibleForConsignment: 'emojiCharactersNotPermitted' });
  });

  it('should return emojiCharactersNotPermitted for plantAddressOne containing emoji', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const { errors } = await handler({
      data: {
        plantName: 'Valid Plant',
        plantAddressOne: "\u{1F3E0} Fish Quay",
        plantAddressTwo: 'Fishy Way',
        plantTownCity: 'Seaham',
        plantPostcode: 'SE11EA',
      },
      errors: {}
    });

    expect(errors).toEqual({ plantAddressOne: 'emojiCharactersNotPermitted' });
  });

  it('should return emojiCharactersNotPermitted for plantTownCity containing emoji', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-address';
    const handler = SUT[currentUrl];

    const { errors } = await handler({
      data: {
        plantName: 'Valid Plant',
        plantAddressOne: 'Fish Quay',
        plantAddressTwo: 'Fishy Way',
        plantTownCity: "\u{1F30A} Seaham",
        plantPostcode: 'SE11EA',
      },
      errors: {}
    });

    expect(errors).toEqual({ plantTownCity: 'emojiCharactersNotPermitted' });
  });
});
