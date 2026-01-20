import StorageNotes from "./storage-notes";
import * as FishValidator from "../../validators/fish.validator";
import * as CommodityCodeValidator from "../../validators/pssdCommodityCode.validator";
import * as CountriesValidator from "../../validators/countries.validator";

describe("/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment", () => {
  let mockValidatorSpeciesName: jest.SpyInstance;
  let mockValidatorCommodityCode: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;
  let mockValidateCountriesName: jest.SpyInstance;

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
    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false, error: null });
  })

  afterEach(() => {
    mockValidatorSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
    mockValidateCountriesName.mockRestore();
  })

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "commodity code is invalid",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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

  it("should handle issuingCountry as string and return invalid country error", async () => {
    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data: any = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
          issuingCountry: 'InvalidCountryName',  // String format to simulate browser input
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
      'catches-0-issuingCountry': 'sdAddCatchDetailsErrorEnterIssuingCountry'
    });
  });

  it("should return sdAddCatchDetailsErrorEnterIssuingCountry error for non_uk certificate with empty issuingCountry", async () => {
    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data: any = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
          issuingCountry: { officialCountryName: '' },  // Empty country name
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
      'catches-0-issuingCountry': 'sdAddCatchDetailsErrorEnterIssuingCountry'
    });
  });

  it("should return sdAddCatchDetailsErrorEnterIssuingCountry error for non_uk certificate with undefined issuingCountry", async () => {
    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data: any = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
          // issuingCountry: undefined (not set)
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
      'catches-0-issuingCountry': 'sdAddCatchDetailsErrorEnterIssuingCountry'
    });
  });

  it("with no certificate type", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "commodity code is invalid",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "commodity code is invalid",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'invalid_type',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/20199090",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/3010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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

  it("with no weight for net weight on arrival", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightFisheryProductArrival: "1",
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
      "catches-0-netWeightProductArrival": "sdAddProductToConsignmentNetWeightOfProductErrorNull",
    });
  });

  it("with no weight for net weight of fishery products on arrival", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
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
      "catches-0-netWeightFisheryProductArrival": "sdAddProductToConsignmentNetWeightOfFisheryProductErrorNull",
    });
  });

  it("with invalid value for net weight of product on arrival (more than 2 decimals)", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "10.123",
          netWeightFisheryProductArrival: "1",
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
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalPositiveMax2Decimal",
    });
  });

  it("with invalid value for net weight of fishery products on arrival (more than 2 decimals)", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2010",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "10.123",
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
      "catches-0-netWeightFisheryProductArrival": "sdNetWeightProductFisheryArrivalPositiveMax2Decimal",
    });
  });

  it("with missing product validates as error", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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

    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          certificateNumber: "SD",
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateNumber: 'CERTIFICATENUMBERCERTIFICATENUMBERCERTIFICATENUMBERCERTIFICATENUMBER',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateNumber: 'DOCUMENTNUMBER; R*1',
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          transportUnloadedFrom: "TRANS-IN-001",
          placeOfUnloading: "!Dover",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: " ",
          productDescription: 'Some product description',
          commodityCode: " ",
          certificateNumber: " ",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: " ",
          transportUnloadedFrom: " ",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "-22",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "10",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          supportingDocuments: ["@@$@$"],
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantic Cod (COD)',
          weightOnCC: "2222",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          supportingDocuments: ["supportingDocumentsupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocumentssupportingDocuments"],
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
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
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
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
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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

  it("with missing product description validates as error", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
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
          // productDescription intentionally missing
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      'catches-0-productDescription': 'sdAddProductToConsignmentProductDescriptionErrorNull'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightFisheryProductArrival and validates as zero", async () => {
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          product: "a vessel",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'wrongScientificName',
          netWeightProductArrival: "0",
          netWeightFisheryProductArrival: "0",
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
      "catches-0-netWeightProductArrival": "sdNetWeightProductArrivalErrorMax2DecimalLargerThan0",
      "catches-0-netWeightFisheryProductArrival": "sdNetWeightProductFisheryArrivalErrorMax2DecimalLargerThan0",
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("checks netWeightProductArrival, netWeightProductArrival and validates as -1", async () => {
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          productDescription: 'Some product description',
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "999999999999",
          productDescription: 'Some product description',
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "100000000001",
          productDescription: 'Some product description',
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

  it("with UK certificate type and invalid UK document format", async () => {
    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "INVALID-FORMAT",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      'catches-0-certificateNumber': 'sdAddUKEntryDocumentErrorUKDocumentNumberFormatInvalid'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with UK certificate type and document does not exist", async () => {
    // Mock validateCompletedDocument to return false
    const DocumentValidator = require("../../validators/documentValidator");
    jest.spyOn(DocumentValidator, 'validateCompletedDocument').mockResolvedValue(false);

    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "GBR-2023-CC-123456789",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      'catches-0-certificateNumber': 'sdAddUKEntryDocumentDoesNotExistError'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });

  it("with UK certificate type and species does not exist in document", async () => {
    // Mock validateCompletedDocument to return true but validateSpecies to return false
    const DocumentValidator = require("../../validators/documentValidator");
    jest.spyOn(DocumentValidator, 'validateCompletedDocument').mockResolvedValue(true);
    jest.spyOn(DocumentValidator, 'validateSpecies').mockResolvedValue(false);

    const currentUrl = "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "GBR-2023-CC-987654321",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          speciesCode: 'ACH',
          certificateType: 'uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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
      'catches-0-certificateNumber': 'sdAddUKEntryDocumentSpeciesDoesNotExistError'
    };

    expect(errors).toBeTruthy();
    expect(errors).toEqual(expected);
  });
});

describe("/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment/:index", () => {
  let mockValidatorSpeciesName: jest.SpyInstance;
  let mockValidatorCommodityCode: jest.SpyInstance;
  let mockValidateSpeciesWithSuggestions: jest.SpyInstance;
  let mockValidateCountriesName: jest.SpyInstance;

  beforeEach(() => {
    mockValidatorSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
    mockValidatorSpeciesName.mockResolvedValue({
      isError: false
    });

    mockValidatorCommodityCode = jest.spyOn(CommodityCodeValidator, 'validateCommodityCode');
    mockValidatorCommodityCode.mockResolvedValue({
      isError: false
    });

    mockValidateCountriesName = jest.spyOn(CountriesValidator, 'validateCountriesName');
    mockValidateCountriesName.mockResolvedValue({ isError: false, error: null });

    mockValidateSpeciesWithSuggestions = jest.spyOn(FishValidator, 'validateSpeciesWithSuggestions');
  })

  afterEach(() => {
    mockValidatorSpeciesName.mockRestore();
    mockValidateSpeciesWithSuggestions.mockRestore();
    mockValidateCountriesName.mockRestore();
  })

  it("with all mandatory fields validates as OK", async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Atlantix",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
          issuingCountry: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'ES',
            isoCodeAlpha3: 'ESP',
            isoNumericCode: '724',
          },
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
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "2222",
          product: "Arctic char (ACH)",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          productWeight: "1111",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          scientificName: 'Salvelinus alpinus',
          certificateType: 'uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
        },
      ],
      storageFacilities: [{}],
      addAnotherProduct: "notset",
      isNonJs: true
    };

    mockValidateSpeciesWithSuggestions.mockResolvedValue({
      isError: true,
      error: new Error('Incorect FAO code or Species name')
    });

    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

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
    const expectedErrors = { "catches-0-certificateNumber": "sdAddProductToConsignmentCertificateNumberErrorNull", "catches-species-incorrect": "sdAddCatchDetailsErrorIncorrectFaoOrSpecies" };
    expect(errors).toEqual(expectedErrors);
  });

    it('should return catches-species-suggest error if there in nonjs and an incorrect search with possible results', async () => {
    const currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment/:index";
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: "22.345",
          product: "Cod",
          productDescription: 'Some product description',
          commodityCode: "34234324",
          certificateNumber: "CC-11111",
          productWeight: "11.11",
          dateOfUnloading: "29/01/2019",
          placeOfUnloading: "Dover",
          transportUnloadedFrom: "TRANS-IN-001",
          certificateType: 'non_uk',
          netWeightProductArrival: "1",
          netWeightFisheryProductArrival: "1",
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

    mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Error('Invalid country') });

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
      },
      "catches-0-issuingCountry": "sdAddCatchDetailsErrorEnterIssuingCountry"
    };
    expect(errors).toEqual(expectedErrors);
  });

});

describe("/create-non-manipulation-document/:documentNumber/you-have-added-a-product", () => {
  const data = {
    catches: [
      {
        weightOnCC: "2222",
        product: "Atlantix",
        productDescription: 'Some product description',
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
      "/create-non-manipulation-document/:documentNumber/you-have-added-a-product";
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
      "/create-non-manipulation-document/:documentNumber/you-have-added-a-product";
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
      "/create-non-manipulation-document/:documentNumber/you-have-added-a-product";
    const handler = StorageNotes[currentUrl];
    data.addAnotherProduct = "no";

    const { errors, next } = await handler({
      data: data,
      _nextUrl: "",
      currentUrl: currentUrl,
      errors: {}
    });

    expect(errors).toEqual({});
    expect(next).toEqual("/create-non-manipulation-document/:documentNumber/add-storage-facility-details");
    data.addAnotherProduct = "notset";
  });
});

describe("/create-non-manipulation-document/:documentNumber/departure-product-summary", () => {
  it("Net weight on departure equal to or less than weight on document", async () => {
    const currentUrl = "/create-non-manipulation-document/:documentNumber/departure-product-summary";
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
        netWeightProductDeparture: "10",
        netWeightFisheryProductDeparture: "10"
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/departure-product-summary";
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/departure-product-summary";
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/departure-product-summary";
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
    const currentUrl = "/create-non-manipulation-document/:documentNumber/departure-product-summary";
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

describe("/create-non-manipulation-document/:documentNumber/add-storage-facility-details", () => {
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
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
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
      facilityStorage: "Chilled",
      facilityArrivalDate: "123/03/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
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
      facilityStorage: "Chilled",
      facilityArrivalDate: "08/10/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
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
      facilityStorage: "Chilled",
      facilityArrivalDate: "09/11/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
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

  it("with storage arrival date after departure date more than 1 day validates as error", async () => {
    const data = {
      arrivalTransport: {
        vehicle: "plane",
        departureDate: "09/10/2025"
      },
      transport: {
        exportDate: "09/10/2025"
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
      facilityStorage: "Chilled",
      facilityArrivalDate: "12/10/2025",
      addAnotherProduct: "notset",
    };
    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
    const handler = StorageNotes[_currentUrl];
    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });
    const expectedErrors = {
      "storageFacilities-facilityArrivalDate": "sdArrivalDateSameOrOneDayBeforeDepartureDateValidationError",
    };
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
      facilityStorage: "Chilled",
      facilityArrivalDate: "10/11/2025",
      addAnotherProduct: "notset",
    };

    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-details";
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

describe("/create-non-manipulation-document/:documentNumber/add-storage-facility-approval", () => {
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
      facilityApprovalNumber: "UK/ABC/001UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00UK/ABC/00",
      facilityStorage: "Chilled",
    };
    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-approval";
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
      facilityStorage: "Chilled",
      addAnotherProduct: "notset",
    };
    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-approval";
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

  it("should return error if product stored radio button is not selected", async () => {
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
      facilityApprovalNumber: "TSF001",
      facilityStorage: "",
      addAnotherProduct: "notset",
    };
    const _currentUrl =
      "/create-non-manipulation-document/:documentNumber/add-storage-facility-approval";
    const handler = StorageNotes[_currentUrl];

    const { errors } = handler({
      data: data,
      _currentUrl,
      _nextUrl: "",
      errors: {},
      _params: {},
    });

    const expectedErrors = {
      "storageFacilities-facilityStorage": "sdAddStorageFacilityProductStoredNullError",
    };

    expect(errors).toEqual(expectedErrors);
  });
  describe("Facility Arrival Date vs Transport Export Date", () => {
  const handler = StorageNotes["/create-non-manipulation-document/:documentNumber/add-storage-facility-details"];

  it("should NOT set error if arrival date is before export date", () => {
    const data = {
      facilityArrivalDate: "08/10/2025",
      transport: { exportDate: "09/10/2025" },
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should NOT set error if arrival date is same as export date", () => {
    const data = {
      facilityArrivalDate: "09/10/2025",
      transport: { exportDate: "09/10/2025" },
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should set error if arrival date is after export date", () => {
    const data = {
      facilityArrivalDate: "10/10/2025",
      transport: { exportDate: "09/10/2025" },
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateSameOrOneDayBeforeDepartureDateValidationError");
  });

  it("should NOT set error if transport.exportDate is missing", () => {
    const data = {
      facilityArrivalDate: "10/10/2025",
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });
});

describe("Facility Arrival Date: transport and exportDate edge cases", () => {
  const handler = StorageNotes["/create-non-manipulation-document/:documentNumber/add-storage-facility-details"];

  it("should NOT set error if transport is missing", () => {
    const data = {
      facilityArrivalDate: "10/10/2025",
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should NOT set error if transport exists but exportDate is missing", () => {
    const data = {
      facilityArrivalDate: "10/10/2025",
      transport: { vehicle: "plane" }, // exportDate missing
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should set error if transport exportDate exists and is same or one day before arrival date", () => {
    const data = {
      facilityArrivalDate: "10/10/2025",
      transport: { exportDate: "10/10/2025" }, 
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });
});

describe("Facility Arrival Date: Maximum 1 day in future validation", () => {
  const handler = StorageNotes["/create-non-manipulation-document/:documentNumber/add-storage-facility-details"];

  it("should NOT set error for today's date", () => {
    const today = new Date();
    const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const data = {
      facilityArrivalDate: todayFormatted,
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should NOT set error for tomorrow's date (1 day in future)", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;
    
    const data = {
      facilityArrivalDate: tomorrowFormatted,
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
  });

  it("should set error for date more than 1 day in future (2 days)", () => {
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const twoDaysLaterFormatted = `${String(twoDaysLater.getDate()).padStart(2, '0')}/${String(twoDaysLater.getMonth() + 1).padStart(2, '0')}/${twoDaysLater.getFullYear()}`;
    
    const data = {
      facilityArrivalDate: twoDaysLaterFormatted,
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDatenotMorethanOneDay");
  });

  it("should set error for date 7 days in future", () => {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDaysLaterFormatted = `${String(sevenDaysLater.getDate()).padStart(2, '0')}/${String(sevenDaysLater.getMonth() + 1).padStart(2, '0')}/${sevenDaysLater.getFullYear()}`;
    
    const data = {
      facilityArrivalDate: sevenDaysLaterFormatted,
      facilityName: "name",
      facilityAddressOne: "address",
      facilityTownCity: "city",
      facilityPostcode: "postcode",
    };
    const { errors } = handler({ data, errors: {}, _currentUrl: "", _nextUrl: "", _params: {} });
    expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDatenotMorethanOneDay");
  });

});

});

