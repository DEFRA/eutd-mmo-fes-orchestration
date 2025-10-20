import StorageNotes from "./storage-notes";
import * as FishValidator from "../../validators/fish.validator";
import * as CommodityCodeValidator from "../../validators/pssdCommodityCode.validator";

describe("/create-storage-document/:documentNumber/add-product-to-this-consignment", () => {
  let mockValidatorSpeciesName: jest.SpyInstance;
  let mockValidatorCommodityCode: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;

  beforeEach(() => {
    mockValidatorSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidatorSpeciesName.mockResolvedValue({
      isError: false
    });
    mockValidatorCommodityCode = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockValidatorCommodityCode.mockResolvedValue({
      isError: false
    });
    mockValidateSpeciesWithSuggestions = jest.spyOn(FishValidator, 'validateSpeciesWithSuggestions');
  })

  afterEach(() => {
    mockValidatorSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
  })

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it("with invalid commodity code", async () => {
    mockValidatorCommodityCode.mockResolvedValue({
      isError: true
    });

    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          commodityCode: "commodity code is invalid",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({
      'catches-0-commodityCode': 'sdAddProductToConsignmentCommodityCodeErrorNull'
    });
  });

  it("with no certificate type", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          commodityCode: "commodity code is invalid",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus'
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({
      'catches-0-certificateType': 'sdAddCatchTypeErrorSelectCertificateType',
      'catches-0-certificateNumber': 'sdAddProductToConsignmentCertificateNumberErrorNull',
    });
  });

  it("with an invalid certificate type", async () => {

    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          commodityCode: "commodity code is invalid",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'invalid_type',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({
      'catches-0-certificateType': 'sdAddCatchTypeErrorCertificateTypeInvalid'
    });
  });

  it("with bad date for date of unloading", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/20199090",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it("with future date for date of unloading", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/3010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it("with no weight on CC", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({
      "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorNull",
    });
  });

  it("with missing product validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-product": "sdAddProductToConsignmentProductNameErrorNull",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks species name and scientificName and validates as error", async () => {
    mockValidatorSpeciesName.mockResolvedValue({
      isError: true
    });

    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-product": "sdAddProductToConsignmentSpeciesNameErrorInValid",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with missing commodity code validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-commodityCode": `sdAddProductToConsignmentCommodityCodeErrorNull`
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with missing catch certificate number validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          certificateNumber: "SD",
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("should return an error when the number of characters in the document number exceeds the threshold", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateNumber: 'CERTIFICATENUMBERCERTIFICATENUMBERCERTIFICATENUMBERCERTIFICATENUMBER',
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-certificateNumber": "sdAddProductToConsignmentWeightOnCCErrorMustNotExceed-54"
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("should return an error when the document number has invalid characters", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateNumber: 'DOCUMENTNUMBER; R*1',
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-certificateNumber": "sdAddProductToConsignmentCertificateNumberErrorInvalidFormat",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with missing date product entered the UK validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with missing place product entered the UK validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with incorrect place product entered the UK validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          transportUnloadedFrom: "TRANS-IN-001",
          placeOfUnloading: "!Dover",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with missing transport details validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with whitespace product, commodityCode, certificateNumber, placeOfUnloading and transportUnloadedFrom validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: " ",
          commodityCode: " ",
          certificateNumber: " ",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: " ",
          transportUnloadedFrom: " ",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-certificateNumber": "sdAddProductToConsignmentCertificateNumberErrorNull",
      "catches-0-commodityCode": "sdAddProductToConsignmentCommodityCodeErrorNull",
      "catches-0-product": "sdAddProductToConsignmentProductNameErrorNull",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
    expect(mockValidateSpeciesWithSuggestions).not.toHaveBeenCalled();
  });

  it("invalid (negative) numbers in weightOnCC validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "-22",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "10",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorMax2DecimalLargerThan0",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("invalid (floating point) numbers in weightOnCC validates as error", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it('should return catches-species-incorrect error if there in nonjs and an incorrect search', async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        }
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Incorect FAO code or Species name')
    });

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal", "catches-species-incorrect": "sdAddCatchDetailsErrorIncorrectFaoOrSpecies" };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-suggest error if there in nonjs and an incorrect search with possible results', async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Results match fewer than 5'),
      resultList: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    });

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = {
      "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal",
      "catches-species-suggest": {
        translation: 'sdAddCatchDetailsErrorSpeciesSuggestion',
        possibleMatches: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
      }
    };
    expect(errors).toEqual(expectedErrors);
  });

  it("with invalid supporting documents", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          supportingDocuments: ["@@$@$"],
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      'catches-0-supportingDocuments-0': 'sdAddProductToConsignmentSupportingDocumentErrorInvalidFormat'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with invalid supporting documents with long length", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          supportingDocuments: ["supportingDocumentsupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocuments"],
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      'catches-0-supportingDocuments-0': 'sdAddProductToConsignmentSupportingDocumentErrorMustNotExceed-54'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with invalid product description", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          productDescription: "@@$@$",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      'catches-0-productDescription': 'sdAddProductToConsignmentProductDescriptionErrorInvalidFormat'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with invalid product description with long length", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          productDescription: "supportingDocumentsupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocuments",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      'catches-0-productDescription': 'sdAddProductToConsignmentProductDescriptionErrorMustNotExceed-50'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightProductArrival and validates as zero", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: "0",
          certificateType: 'non_uk',
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalErrorMax2DecimalLargerThan0"
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightProductArrival and validates as -1", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: -1,
          netWeightFisheryProductArrival: -1,
          certificateType: 'non_uk',
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-netWeightFisheryProductArrival": "sdNetWeightProductFisheryArrivalErrorMax2DecimalLargerThan0",
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalErrorMax2DecimalLargerThan0",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightProductArrival and validates as Positive Max 2 Decimal", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "999999999999",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: "99999999999.991",
          netWeightFisheryProductArrival: "99999999999.991",
          certificateType: 'non_uk',
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-netWeightFisheryProductArrival": "sdNetWeightProductFisheryArrivalPositiveMax2Decimal",
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalPositiveMax2Decimal",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightProductArrival and validates as exceed 100000000000", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "100000000001",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: 100000000000,
          netWeightFisheryProductArrival: 100000000000,
          certificateType: 'non_uk',
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    const expected = {
      "catches-0-netWeightFisheryProductArrival": "sdNetWeightProductFisheryArrivalExceed12Digit",
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalExceed12Digit",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe("/create-storage-document/:documentNumber/add-product-to-this-consignment/:index", () => {
  let mockValidatorSpeciesName: jest.SpyInstance;
  let mockValidatorCommodityCode: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;

  beforeEach(() => {
    mockValidatorSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidatorSpeciesName.mockResolvedValue({
      isError: false
    });

    mockValidatorCommodityCode = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockValidatorCommodityCode.mockResolvedValue({
      isError: false
    });

    mockValidateSpeciesWithSuggestions = jest.spyOn(FishValidator, 'validateSpeciesWithSuggestions');
  })

  afterEach(() => {
    mockValidatorSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
  })

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
    };

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      params: { index: 0 },
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(errors).toBeTruthy();
    expect(errors).toEqual({});
  });

  it('should return catches-species-incorrect error if there in nonjs and an incorrect search', async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        }
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Incorect FAO code or Species name')
    });

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      params: { index: 0 },
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = { "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal", "catches-species-incorrect": "sdAddCatchDetailsErrorIncorrectFaoOrSpecies" };
    expect(errors).toEqual(expectedErrors);
  });

  it('should return catches-species-suggest error if there in nonjs and an incorrect search with possible results', async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Results match fewer than 5'),
      resultList: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
    });

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      _currentUrl: currentUrl,
      errors: {},
      params: { index: 0 },
      documentNumber: 'SD',
      userPrincipal: 'bob',
      contactId: 'bob-contact-Id'
    });

    expect(mockValidateSpeciesWithSuggestions).toHaveBeenCalled();
    const expectedErrors = {
      "catches-0-weightOnCC": "sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal",
      "catches-species-suggest": {
        translation: 'sdAddCatchDetailsErrorSpeciesSuggestion',
        possibleMatches: ['Yellowback seabream (DTT)', 'Atlantic cod (COD)']
      }
    };
    expect(errors).toEqual(expectedErrors);
  });
});

describe("/create-storage-document/:documentNumber/you-have-added-a-product", () => {
  const data = {
    catches: [
      {
        weightOnCC: "2222",
        product: "Atlantix",
        commodityCode: "34234324",
        certificateNumber: "CC-11111",
        productWeight: "1111",
        dateOfUnloading: "29/01/2019",
        placeOfUnloading: "Dover",
        transportUnloadedFrom: "TRANS-IN-001",
      },
    ],
    storageFacilities: [{}],
    addAnotherProduct: "notset",
  };

  let mockValidatorSpeciesName: jest.SpyInstance;

  beforeEach(() => {
    mockValidatorSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidatorSpeciesName.mockResolvedValue({
      isError: false
    });
  })

  afterEach(() => {
    mockValidatorSpeciesName.mockRestore();
  })

  it("with missing addAnotherProduct validates as error", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/you-have-added-a-product";
    const handler = StorageNotes[currentUrl];

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      currentUrl: currentUrl,
      errors: {}
    });

    const expectedErrors = {
      addAnotherProduct: "Select yes if you need to add another product",
    };
    expect(errors).toEqual(expectedErrors);
  });

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/you-have-added-a-product";
    const handler = StorageNotes[currentUrl];
    data.addAnotherProduct = "yes";

    const { errors } = await handler({
      data: data,
      _nextUrl: "",
      currentUrl: currentUrl,
      errors: {}
    });

    expect(errors).toEqual({});
    data.addAnotherProduct = "notset";
  });

  it("should set next to 'add-storage-facility-details' when data.addAnotherProduct set to 'no'", async () => {
    const currentUrl =
      "/create-storage-document/:documentNumber/you-have-added-a-product";
    const handler = StorageNotes[currentUrl];
    data.addAnotherProduct = "no";

    const { errors, next } = await handler({
      data: data,
      _nextUrl: "",
      currentUrl: currentUrl,
      errors: {}
    });

    expect(errors).toEqual({});
    expect(next).toEqual("/create-storage-document/:documentNumber/add-storage-facility-details");
    data.addAnotherProduct = "notset";
  });
});

describe("/create-storage-document/:documentNumber/departure-product-summary", () => {
  it("Net weight on departure  equal to or less than weight on document", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/departure-product-summary";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [{
        weightOnCC: "2222",
        commodityCode: "34234324",
        certificateNumber: "CC-11111",
        productWeight: "1111",
        product: "a vessel",
        dateOfUnloading: "29/01/2019",
        placeOfUnloading: "Dover",
        transportUnloadedFrom: "TRANS-IN-001",
        scientificName: 'wrongScientificName',
        netWeightProductDeparture: "10"
      }]
    };

    const { errors } = await handler({
      data,
      errors: {},
    });

    const expected = {};

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductDeparture, netWeightProductDeparture and validates as zero", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/departure-product-summary";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName'
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-netWeightProductDeparture": "sdNetWeightOrFisheryWeightProductDeparture"
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductDeparture, netWeightProductDeparture and validates as -1", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/departure-product-summary";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductDeparture: -1,
          netWeightFisheryProductDeparture: -1,
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-netWeightFisheryProductDeparture": "sdNetWeightFisheryProductDepartureErrorMax2DecimalLargerThan0",
      "catches-0-netWeightProductDeparture": "sdNetWeightProductDepartureErrorMax2DecimalLargerThan0",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductDeparture, netWeightProductDeparture and validates as Positive Max 2 Decimal", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/departure-product-summary";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "999999999999",
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductDeparture: "99999999999.991",
          netWeightFisheryProductDeparture: "99999999999.991",
        },
      ]
    };

    const { errors } = await handler({
      data: data,
      errors: {},
    });

    const expected = {
      "catches-0-netWeightFisheryProductDeparture": "sdNetWeightFisheryProductDeparturePositiveMax2Decimal",
      "catches-0-netWeightProductDeparture": "sdNetWeightProductDeparturePositiveMax2Decimal",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductDeparture, netWeightProductDeparture and validates as exceed 100000000000", async () => {
    const currentUrl = "/create-storage-document/:documentNumber/departure-product-summary";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductDeparture: 100000000000,
          netWeightFisheryProductDeparture: 100000000000,
        },
      ]
    };

    const { errors } = await handler({
      data,
      errors: {},
    });

    const expected = {
      "catches-0-netWeightFisheryProductDeparture": "sdNetWeightFisheryProductDepartureExceed12Digit",
      "catches-0-netWeightProductDeparture": "sdNetWeightProductDepartureExceed12Digit",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe("/create-storage-document/:documentNumber/add-storage-facility-details", () => {
  const data = {
    catches: [
      {
        weightOnCC: "2222",
        product: "Atlantix",
        commodityCode: "34234324",
        certificateNumber: "CC-11111",
        productWeight: "1111",
        dateOfUnloading: "29/01/2019",
        placeOfUnloading: "Dover",
        transportUnloadedFrom: "TRANS-IN-001",
      },
    ],
    facilityAddressOne: "",
    facilityArrivalDate: "",
    facilityName: "",
    addAnotherProduct: "notset",
  };

  it("with missing storageFacilities validates as error", async () => {
    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityAddressOne": "sdAddStorageFacilityDetailsErrorEnterTheAddress",
      "storageFacilities-facilityArrivalDate": "sdArrivalDateValidationError",
      "storageFacilities-facilityName": "sdAddStorageFacilityDetailsErrorEnterTheFacilityName",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("with storage approval number invalid date validates as error", async () => {
    const data = {
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "UK/ABC/001",
      facilityArrivalDate: "123/03/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityArrivalDate": "sdArrivalDateValidationError",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("with storage arrival date before departure date validates as error", async () => {
    const data = {
      arrivalTransport: {
        vehicle: "plane",
        departureDate: "09/10/2025"
      },
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "UK/ABC/001",
      facilityArrivalDate: "08/10/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityArrivalDate": "sdArrivalDateBeforeDepatureDateValidationError",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("with storage arrival date equal to departure date validates successfully", async () => {
    const data = {
      arrivalTransportation: {
        vehicle: "plane",
        departureDate: "09/11/2025"
      },
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "UK/ABC/001",
      facilityArrivalDate: "09/11/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {};

    expect(errors).toEqual(expectedErrors);
  });

  it("with storage arrival date after to departure date validates successfully", async () => {
    const data = {
      arrivalTransportation: {
        vehicle: "plane",
        departureDate: "09/11/2025"
      },
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "UK/ABC/001",
      facilityArrivalDate: "10/11/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {};

    expect(errors).toEqual(expectedErrors);
  });
});

describe("/create-storage-document/:documentNumber/add-storage-facility-approval", () => {
  it("with storage approval number validates as error", async () => {
    const data = {
      addAnotherProduct: "notset",
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "UK/ABC/001UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00"
    
    };
    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-approval";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityApproval": "sdAddStorageFacilityApprovalCharacterError",
    };

    expect(errors).toEqual(expectedErrors);
  });

  it("with storage approval number invalid characters validates as error", async () => {
    const data = {
      facilityName: "name",
      facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
      facilityTownCity: "NEWCASTLE UPON TYNE",
      facilityPostcode: "NE4 7YH",
      facilitySubBuildingName: "MMO SUB",
      facilityBuildingNumber: "",
      facilityBuildingName: "LANCASTER HOUSE",
      facilityStreetName: "HAMPSHIRE COURT",
      facilityCounty: "TYNESIDE",
      facilityCountry: "ENGLAND",
      facilityApprovalNumber: "@£$%^&*(@£",
      addAnotherProduct: "notset",
    };
    const _currentUrl =
      "/create-storage-document/:documentNumber/add-storage-facility-approval";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityApproval": "sdAddStorageFacilityApprovalInvalidError",
    };

    expect(errors).toEqual(expectedErrors);
  });
});

