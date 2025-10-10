import SUT from "./processing-statement";
import ApplicationConfig from '../../applicationConfig';
import * as ProcessingStatementService from "./processing-statement";
import * as OrchestrationService from "../orchestration.service";
import * as FishValidator from "../..//validators/fish.validator";
import * as DocumentValidator from "../../validators/documentValidator"
import * as CommodityCodes from "../../validators/pssdCommodityCode.validator";
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
  let mockValidateCommodityCode;

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
      errors: {},
      documentNumber: 'GBR-2023-PS-01234ABCD',
      userPrincipal: 'bob',
      contactId: 'contactId'
    });

    const expected = {
      addAnotherCatch: 'psCatchAddedErrorAddAnotherCatch',
      "catches-0-catchCertificateNumber": "psAddCatchDetailsErrorUKCCNumberFormatInvalid",
    };
    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-details', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [{
        id: '',
        catchCertificateType: undefined
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber',
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      'catches-0-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    }

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });


  it('should return errors when certificate number has invalid characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-902-9_(-)_()',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorCCNumberMustOnlyContain',
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
    };
    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });

  it('should return errors when a uk certificate number is invalid', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  it('should not return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a non uk certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {};

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should return a psAddCatchDetailsErrorNonUKCCNumberCharLimit error if a non UK catch certificate number exceeds 52 characters', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE-WITH-MORE-THAN-52-CHARACTERS',
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorNonUKCCNumberCharLimit',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('non_uk');
  });

  it('should not return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for an unspecified certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'NOT-A-UK-CATCH-CERTIFICATE',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType"
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBeUndefined();
  });

  it('should return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a valid uk PS certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'GBR-2022-PS-01234ABCD',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  it('should return a psAddCatchDetailsErrorUKCCNumberFormatInvalid error for a valid uk SD certificate number', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
    const handler = SUT[currentUrl];

    const data: ProcessingStatement = {
      catches: [
        {
          id: '',
          species: 'Atlantic Cod',
          catchCertificateNumber: 'GBR-2022-SD-01234ABCD',
          catchCertificateType: 'uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
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
      contactId: 'contactId'
    });

    const expectedErrors = {
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCNumberFormatInvalid',
    };

    expect(errors).toEqual(expectedErrors);
    expect(data.catches[0].catchCertificateType).toBe('uk');
  });

  describe('when validating a correctly formatted catch certificate', () => {
    let mockValidateCatchCertificate;
    let mockValidateSpeciesName;
    let mockValidateSpecies;

    beforeEach(() => {
      mockValidateCatchCertificate = jest.spyOn(DocumentValidator, 'validateCompletedDocument');
      mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
      mockValidateSpeciesName.mockResolvedValue({ isError: false });
      mockValidateSpecies = jest.spyOn(DocumentValidator, 'validateSpecies');
      mockValidateSpecies.mockResolvedValue(false);
    });

    afterEach(() => {
      mockValidateCatchCertificate.mockRestore();
      mockValidateSpeciesName.mockRestore();
      mockValidateSpecies.mockRestore();
    });

    it('should return a psAddCatchDetailsErrorUKCCNumberNotExist error for a certificate number of a missing COMPLETE document', async () => {
      mockValidateCatchCertificate.mockResolvedValue(false);
      mockValidateSpecies.mockResolvedValue(true);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110'
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
        contactId: 'contactId'
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

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
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
            exportWeightAfterProcessing: '1110'
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
        contactId: 'contactId'
      });

      const expectedErrors = {
        'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorUKCCSpeciesMissing',
      };

      expect(mockValidateSpecies).toHaveBeenCalledWith('GBR-2022-CC-01234ABCD', 'Atlantic Cod', 'COD', 'bob', 'contactId', 'GBR-2023-PS-01234ABCD');
      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });

    it('should not return any errors for a valid uk certificate number', async () => {
      mockValidateCatchCertificate.mockResolvedValue(true);
      mockValidateSpecies.mockResolvedValue(true);

      const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode';
      const handler = SUT[currentUrl];

      const data: ProcessingStatement = {
        catches: [
          {
            id: '',
            species: 'Atlantic Cod',
            catchCertificateNumber: 'GBR-2022-CC-01234ABCD',
            catchCertificateType: 'uk',
            totalWeightLanded: '1112',
            exportWeightBeforeProcessing: '1111',
            exportWeightAfterProcessing: '1110'
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
        contactId: 'contactId'
      });

      const expectedErrors = {};

      expect(errors).toEqual(expectedErrors);
      expect(data.catches[0].catchCertificateType).toBe('uk');
    });
  });

});

describe('handler for /create-processing-statement/:documentNumber/add-catch-details/:speciesCode/:catchIndex', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [{}],
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
      'catches-0-catchCertificateNumber': 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber',
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
      "catches-0-exportWeightAfterProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing": "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
      'catches-0-species': 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName',
    };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return errors when required props are missing also checking catchCertificateNumber regex', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-catch-details/:speciesCode/:catchIndex';
    const handler = SUT[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateNumber: 'CT-902-9_(-)_()',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110',
          catchesCertificateType: 'uk'
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
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
    };
    expect(errors).toEqual(expectedErrors);
  });
});

describe('handler for /create-processing-statement/:documentNumber/add-catch-type', () => {
  let mockValidateSpeciesName;
  let mockValidateSpeciesWithSuggestions;

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
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
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
      "catches-catchCertificateType": "psAddCatchTypeErrorCatchCertificateTypeInvalid",
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
  let mockValidateSpeciesName;
  let mockValidateSpeciesWithSuggestions;

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
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
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
      "catches-catchCertificateType": "psAddCatchTypeErrorCatchCertificateTypeInvalid",
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
      "catches-catchCertificateType": "psAddCatchTypeErrorSelectCatchCertificateType",
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
      "catches-0-exportWeightAfterProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing",
      "catches-0-exportWeightBeforeProcessing":
        "psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing",
      "catches-0-totalWeightLanded": "psAddCatchWeightsErrorEnterTotalWeightLandedInKG",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("should return the relevant errors if numbers are not correct (up to 2 decimal places)", async () => {
    data = {
      catches: [
        {
          species: "Atlantic Cod",
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "123.12345",
          exportWeightBeforeProcessing: "10.456",
          exportWeightAfterProcessing: "10.54567",
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
      "catches-0-totalWeightLanded":
        "psAddCatchWeightsErrorEnterTotalWeightMaximum2Decimal",
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
          catchCertificateNumber: "CT-111111",
          totalWeightLanded: "-123",
          exportWeightBeforeProcessing: "0",
          exportWeightAfterProcessing: "-123.456",
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
      "catches-0-totalWeightLanded":
        "psAddCatchWeightsErrorTotalWeightGreaterThanNull",
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
      'catches-0-totalWeightLanded': 'psAddCatchWeightsErrorEnterTotalWeightLandedInKG',
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
});

describe('handler for /create-processing-statement/:documentNumber/add-processing-plant-details', () => {
  it('should return errors when required props are missing', async () => {
    const currentUrl = '/create-processing-statement/:documentNumber/add-processing-plant-details';
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
      plantApprovalNumber: 'plant approval number'
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
      plantApprovalNumber: 'plant approval number'
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
});


describe('validateCatchDetails', () => {
  const index = 0;
  const errors = {};
  const documentNumber = 'GBR-2023-PS-01234ABCD';
  const userPrincipal = 'bob';
  const contactId = 'contactId';

  let mockValidateSpeciesName;

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
          catchesCertificateType: 'uk'
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
          scientificName: 'someScientificName'
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
});
