import * as FrontEndExporter from "./exporterDetails"
import * as BackEndModels from "../catchCert"
import { ExporterDetails } from "../common";

describe("when mapping from a front end exporterDetails to a backend exporterDetails", () => {
  it("will contain all relevant properties for catch certificates", () => {
    const myFrontEndExporter: FrontEndExporter.CcExporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterFullName: "Mr. Robot",
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingNumber: '123',
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        },
        _updated: true
      }
    };

    const expectedResult: BackEndModels.CcExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterFullName: "Mr. Robot",
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      buildingNumber: '123',
      subBuildingName: 'Unit 1',
      buildingName: 'CJC Fish Ltd',
      streetName: '17  Old Edinburgh Road',
      county: 'West Midlands',
      country: 'England',
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const result = FrontEndExporter.toBackEndCcExporterDetails(myFrontEndExporter);

    expect(result).toStrictEqual(expectedResult);
  });

  it("will deal with optional data", () => {
    const myFrontEndExporter: FrontEndExporter.CcExporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterFullName: "Mr. Robot",
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      }
    };

    const result = FrontEndExporter.toBackEndCcExporterDetails(myFrontEndExporter);

    expect(result.buildingNumber).toBeUndefined()
    expect(result._updated).toBeUndefined();
  });
});



describe("when mapping from a front end PS exporterDetails to a backend PS exporterDetails", () => {
  it("will contain all relevant properties for a processing statement details object", () => {
    const myFrontEndExporter: FrontEndExporter.Exporter = {
      model: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "FSociety",
        addressOne: "Fake St",
        buildingNumber: "123",
        subBuildingName: "Unit 1",
        buildingName: "CJC Fish Ltd",
        streetName: "17  Old Edinburgh Road",
        county: "West Midlands",
        country: "England",
        townCity: "Nuevo Jamon",
        postcode: "NE1 0HI",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
        _updated: true,
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
      },
    };

    const expectedResult: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "FSociety",
      addressOne: "Fake St",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "Nuevo Jamon",
      postcode: "NE1 0HI",
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      }
    };

    const result = FrontEndExporter.toBackEndPsAndSdExporterDetails(myFrontEndExporter);

    expect(result).toStrictEqual(expectedResult);
  });

  it("will deal with optional data", () => {
    const myFrontEndExporter: FrontEndExporter.Exporter = {
      model: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingName: "CJC Fish Ltd",
        streetName: "17  Old Edinburgh Road",
        county: "West Midlands",
        country: "England",
        townCity: "Aberdeen",
        postcode: "AB1 2XX",
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
      },
    };

    const result = FrontEndExporter.toBackEndPsAndSdExporterDetails(
      myFrontEndExporter
    );

    expect(result.buildingNumber).toBeUndefined();
    expect(result.subBuildingName).toBeUndefined();
    expect(result._updated).toBeUndefined();
  });
});



describe('when mapping from a backend CcExporterDetail to front end CcExporterDetail', () => {

  it('should return exporterDetails in the format that FE expects', () => {
    const expectedResult: FrontEndExporter.CcExporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterFullName: "Mr. Robot",
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingNumber: '123',
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        user_id: "",
        journey: "",
        currentUri: "",
        nextUri: "",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        },
        _updated: true
      }
    };

    const myBackendExporter: BackEndModels.CcExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterFullName: "Mr. Robot",
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      buildingNumber: '123',
      subBuildingName: 'Unit 1',
      buildingName: 'CJC Fish Ltd',
      streetName: '17  Old Edinburgh Road',
      county: 'West Midlands',
      country: 'England',
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      },
      _updated: true
    };

    const result = FrontEndExporter.toFrontEndCcExporterDetails(myBackendExporter);

    expect(result).toStrictEqual(expectedResult);

  });

  it('should return exporterDetails with an _updated property in the format expected by the Front End', () => {

    const myBackendExporter: BackEndModels.CcExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterFullName: "Mr. Robot",
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd",
      addressTwo: "17 Old Edinburgh Road",
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const result = FrontEndExporter.toFrontEndCcExporterDetails(myBackendExporter);

    expect(result.model._updated).toBeTruthy();
    expect(result.model.addressOne).toBe('');
  });

  it('should not return an _updated property if exporter details are blank', () => {
    const blank: any = {};

    const result = FrontEndExporter.toFrontEndCcExporterDetails(blank);

    expect(result.model._updated).toBeUndefined();
  });

  it('should not return an _updated property if we saved as draft only the exporter and company name', () => {
    const blank: any = {
      exporterFullName: 'Bob',
      exporterCompanyName: 'Bob Co'
    };

    const result = FrontEndExporter.toFrontEndCcExporterDetails(blank);

    expect(result.model._updated).toBeUndefined();
  });

});

describe('when mapping from an old back end CcExporterDetail to a new back end CcExporterDetail for an individual', () => {

  const backEndOldFormatExporterDetails: BackEndModels.CcExporterDetails = {
    "contactId": "some contact id",
    "exporterFullName": "Exporter Full Name",
    "exporterCompanyName": "Private",
    "addressOne": "address one",
    "addressTwo": "address two",
    "townCity": "town",
    "postcode": "post code",
    "_dynamicsAddress": {
      "defra_uprn": null,
      "defra_buildingname": "defra building name",
      "defra_subbuildingname": "defra sub building name",
      "defra_premises": "defra premises",
      "defra_street": "defra street",
      "defra_locality": "defra locality",
      "defra_dependentlocality": "defra dependent locality",
      "defra_towntext": "defra town",
      "defra_county": "defra county",
      "defra_postcode": "defra postcode",
      "_defra_country_value": "defra county value",
      "defra_internationalpostalcode": null,
      "defra_fromcompanieshouse": false,
      "defra_addressid": "defra address id",
      "_defra_country_value_OData_Community_Display_V1_FormattedValue": "defra country value",
      "_defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty": "defra_Country",
      "_defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname": "defra_country",
      "defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue": "No"
    },
    "_dynamicsUser": {
      "firstName": "defra first name",
      "lastName": "defra last name"
    }
  };

  const backEndNewFormatExporterDetails: BackEndModels.CcExporterDetails = {
    "contactId": "some contact id",
    "exporterFullName": "Exporter Full Name",
    "exporterCompanyName": "Private",
    "addressOne": "address one",
    "buildingNumber": "building numbner",
    "subBuildingName": "subbuilding name",
    "buildingName": "building name",
    "streetName": "street name",
    "county": "county",
    "country": "country",
    "townCity": "town",
    "postcode": "post code",
    "_dynamicsAddress": {
      "defra_uprn": null,
      "defra_buildingname": null,
      "defra_subbuildingname": null,
      "defra_premises": "defra premisis",
      "defra_street": "defra street",
      "defra_locality": null,
      "defra_dependentlocality": null,
      "defra_towntext": "town text",
      "defra_county": "defra country",
      "defra_postcode": "defra postcode",
      "_defra_country_value": "defra country value",
      "defra_internationalpostalcode": null,
      "defra_fromcompanieshouse": false,
      "defra_addressid": "96773387-81a2-eb11-b1ac-000d3a4addcd",
      "_defra_country_value_OData_Community_Display_V1_FormattedValue": "defra country",
      "_defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty": "defra_Country",
      "_defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname": "defra_country",
      "defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue": "No"
    },
    "_dynamicsUser": {
      "firstName": "defra first name",
      "lastName": "defra last name"
    }
  };

  it('should return an updated back end CC exporter detail', () => {

    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(backEndOldFormatExporterDetails);

    expect(result.contactId).toBe('some contact id');
    expect(result.exporterFullName).toBe('Exporter Full Name');
    expect(result.exporterCompanyName).toBe('Private');
    expect(result.addressOne).toBe('defra premises, defra sub building name, defra building name, defra street, defra locality, defra dependent locality');
    expect(result.addressTwo).toBeUndefined();
    expect(result.buildingNumber).toBe('defra premises');
    expect(result.subBuildingName).toBe('defra sub building name');
    expect(result.buildingName).toBe('defra building name');
    expect(result.streetName).toBe('defra street');
    expect(result.townCity).toBe('defra town');
    expect(result.county).toBe('defra county');
    expect(result.country).toBe('defra country value');
    expect(result.postcode).toBe('defra postcode');
    expect(result._updated).toBeTruthy();
  });

  it('should return an updated address one omitting null values', () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: null,
        defra_subbuildingname: null,
        defra_premises: "defra premises",
        defra_street: "defra street",
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue: "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty: "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname: "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue: "No"
      }
    }

    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(nullAddressOneValues);

    expect(result.addressOne).toBe('defra premises, defra street');
  });

  it('should return the same back end CC exporter detail', () => {
    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(backEndNewFormatExporterDetails);

    expect(result).toStrictEqual(backEndNewFormatExporterDetails);
    expect(result._updated).toBeFalsy();
  });

  it('should return null', () => {
    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(null);
    expect(result).toBeNull();
  });

});

describe('when mapping from an old back end CcExporterDetail to a new back end CcExporterDetail for an organization', () => {

  const backEndOldFormatExporterDetails: BackEndModels.CcExporterDetails = {
    "contactId": "some contact id",
    "accountId": "some account id",
    "exporterFullName": "Exporter Full Name",
    "exporterCompanyName": "Private",
    "addressOne": "45 Leopold Street",
    "addressTwo": "",
    "townCity": "Town",
    "postcode": "DE1 2HF",
    "_dynamicsAddress": {
      "defra_uprn": null,
      "defra_buildingname": null,
      "defra_subbuildingname": null,
      "defra_premises": "null",
      "defra_street": "defra street",
      "defra_locality": "defra locality",
      "defra_dependentlocality": null,
      "defra_towntext": null,
      "defra_county": null,
      "defra_postcode": "defra postcode",
      "_defra_country_value": "f49cf73a-fa9c-e811-a950-000d3a3a2566",
      "defra_internationalpostalcode": null,
      "defra_fromcompanieshouse": true,
      "defra_addressid": "b774357d-1447-e911-a969-000d3a28d1a0",
      "_defra_country_value_OData_Community_Display_V1_FormattedValue": "United Kingdom of Great Britain and Northern Ireland",
      "_defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty": "defra_Country",
      "_defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname": "defra_country",
      "defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue": "Yes"
    },
    "_dynamicsUser": {
      "firstName": "Organsation first name",
      "lastName": "Organisation last name"
    }
  };

  const backEndNewFormatExporterDetails: BackEndModels.CcExporterDetails = {
    "contactId": "some contact id",
    "exporterFullName": "Exporter Full Name",
    "exporterCompanyName": "Private",
    "addressOne": "address one",
    "buildingNumber": "building numbner",
    "subBuildingName": "subbuilding name",
    "buildingName": "building name",
    "streetName": "street name",
    "county": "county",
    "country": "country",
    "townCity": "town",
    "postcode": "post code",
    "_dynamicsAddress": {
      "defra_uprn": null,
      "defra_buildingname": null,
      "defra_subbuildingname": null,
      "defra_premises": "null",
      "defra_street": "45 Leopold Street",
      "defra_locality": "Derby",
      "defra_dependentlocality": null,
      "defra_towntext": null,
      "defra_county": null,
      "defra_postcode": "DE1 2HF",
      "_defra_country_value": "f49cf73a-fa9c-e811-a950-000d3a3a2566",
      "defra_internationalpostalcode": null,
      "defra_fromcompanieshouse": true,
      "defra_addressid": "b774357d-1447-e911-a969-000d3a28d1a0",
      "_defra_country_value_OData_Community_Display_V1_FormattedValue": "United Kingdom of Great Britain and Northern Ireland",
      "_defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty": "defra_Country",
      "_defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname": "defra_country",
      "defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue": "Yes"
    },
    "_dynamicsUser": {
      "firstName": "defra first name",
      "lastName": "defra last name"
    }
  };

  it('should return an updated back end CC exporter detail', () => {

    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(backEndOldFormatExporterDetails);

    expect(result.contactId).toBe('some contact id');
    expect(result.accountId).toBe('some account id');
    expect(result.exporterFullName).toBe('Exporter Full Name');
    expect(result.exporterCompanyName).toBe('Private');
    expect(result.addressOne).toBe('defra street, defra locality');
    expect(result.addressTwo).toBeUndefined();
    expect(result.buildingNumber).toBeNull();
    expect(result.subBuildingName).toBeNull();
    expect(result.buildingName).toBeNull();
    expect(result.streetName).toBe('defra street');
    expect(result.townCity).toBeNull();
    expect(result.county).toBeNull();
    expect(result.country).toBe('United Kingdom of Great Britain and Northern Ireland');
    expect(result.postcode).toBe('defra postcode');
    expect(result._updated).toBeTruthy();
  });

  it('should return the same back end CC exporter detail', () => {
    const result: BackEndModels.CcExporterDetails = FrontEndExporter.toBackEndNewCcExporterDetails(backEndNewFormatExporterDetails);

    expect(result).toStrictEqual(backEndNewFormatExporterDetails);
    expect(result._updated).toBeFalsy();
  });

});


describe('when mapping from a backend PS exporterDetail to front end PS exporterDetail', () => {

  it('should return exporterDetails in the format that FE expects', () => {
    const expectedResult: FrontEndExporter.Exporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingNumber: '123',
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        user_id: "",
        journey: "",
        currentUri: "",
        nextUri: "",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        },
        _updated: true
      }
    };

    const myBackendExporter: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      buildingNumber: '123',
      subBuildingName: 'Unit 1',
      buildingName: 'CJC Fish Ltd',
      streetName: '17  Old Edinburgh Road',
      county: 'West Midlands',
      country: 'England',
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      },
      _updated: true
    };

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(myBackendExporter);

    expect(result).toStrictEqual(expectedResult);

  });

  it('should return exporterDetails with an _updated property in the format expected by the Front End', () => {

    const myBackendExporter: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd",
      addressTwo: "17 Old Edinburgh Road",
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(myBackendExporter);

    expect(result.model._updated).toBeTruthy();
    expect(result.model.addressOne).toBe('');
  });

  it('should return exporterDetails as is if flag doNotTransform is true', () => {

    const myBackendExporter: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd",
      addressTwo: "17 Old Edinburgh Road",
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(myBackendExporter, true);

    expect(result.model).toStrictEqual({
      ...myBackendExporter,
      user_id: '',
      journey: '',
      currentUri: '',
      nextUri: '',
    });
  });

  it('should not return an _updated property if exporter details are blank', () => {
    const blank: any = {};

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(blank);

    expect(result.model._updated).toBeUndefined();
  });

  it('should not return an _updated property if we saved as draft only the company name', () => {
    const blank: any = {
      exporterCompanyName: 'Bob Co'
    };

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(blank);

    expect(result.model._updated).toBeUndefined();
  });

});


describe("when mapping from an old back end PS ExporterDetail to a new back end PS ExporterDetail for an individual", () => {
  const backEndOldFormatExporterDetails: ExporterDetails = {
    contactId: "some contact id",
    accountId: "some account id",
    exporterCompanyName: "Private",
    addressOne: "address one",
    addressTwo: "address two",
    townCity: "town",
    postcode: "post code",
    _dynamicsAddress: {
      defra_uprn: null,
      defra_buildingname: "defra building name",
      defra_subbuildingname: "defra sub building name",
      defra_premises: "defra premises",
      defra_street: "defra street",
      defra_locality: "defra locality",
      defra_dependentlocality: "defra dependent locality",
      defra_towntext: "defra town",
      defra_county: "defra county",
      defra_postcode: "defra postcode",
      _defra_country_value: "defra county value",
      defra_internationalpostalcode: null,
      defra_fromcompanieshouse: false,
      defra_addressid: "defra address id",
      _defra_country_value_OData_Community_Display_V1_FormattedValue:
        "defra country value",
      _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
        "defra_Country",
      _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
        "defra_country",
      defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue: "No",
    },
    _dynamicsUser: {
      firstName: "defra first name",
      lastName: "defra last name",
    },
  };

  const backEndNewFormatExporterDetails: ExporterDetails = {
    contactId: "some contact id",
    accountId: "some account id",
    exporterCompanyName: "Private",
    addressOne: "address one",
    buildingNumber: "building numbner",
    subBuildingName: "subbuilding name",
    buildingName: "building name",
    streetName: "street name",
    county: "county",
    country: "country",
    townCity: "town",
    postcode: "post code",
    _dynamicsAddress: {
      defra_uprn: null,
      defra_buildingname: null,
      defra_subbuildingname: null,
      defra_premises: "defra premisis",
      defra_street: "defra street",
      defra_locality: null,
      defra_dependentlocality: null,
      defra_towntext: "town text",
      defra_county: "defra country",
      defra_postcode: "defra postcode",
      _defra_country_value: "defra country value",
      defra_internationalpostalcode: null,
      defra_fromcompanieshouse: false,
      defra_addressid: "96773387-81a2-eb11-b1ac-000d3a4addcd",
      _defra_country_value_OData_Community_Display_V1_FormattedValue:
        "defra country",
      _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
        "defra_Country",
      _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
        "defra_country",
      defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue: "No",
    },
    _dynamicsUser: {
      firstName: "defra first name",
      lastName: "defra last name",
    },
  };

  it("should return an updated back end PS exporter detail", () => {
    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      backEndOldFormatExporterDetails
    );

    expect(result.contactId).toBe("some contact id");
    expect(result.exporterCompanyName).toBe("Private");
    expect(result.addressOne).toBe(
      "defra premises, defra sub building name, defra building name, defra street, defra locality, defra dependent locality"
    );
    expect(result.addressTwo).toBeUndefined();
    expect(result.buildingNumber).toBe("defra premises");
    expect(result.subBuildingName).toBe("defra sub building name");
    expect(result.buildingName).toBe("defra building name");
    expect(result.streetName).toBe("defra street");
    expect(result.townCity).toBe("defra town");
    expect(result.county).toBe("defra county");
    expect(result.country).toBe("defra country value");
    expect(result.postcode).toBe("defra postcode");
  });

  it("should return an updated address one omitting null values", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: null,
        defra_subbuildingname: null,
        defra_premises: "defra premises",
        defra_street: "defra street",
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue:
          "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
          "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
          "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue:
          "No",
      },
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("defra premises, defra street");
  });

  it("should return the same back end PS exporter detail", () => {
    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      backEndNewFormatExporterDetails
    );

    expect(result).toStrictEqual(backEndNewFormatExporterDetails);
  });

  it("should return an updated address one omitting null values with defra sub building name", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: null,
        defra_subbuildingname: "defra_subbuildingname",
        defra_premises: null,
        defra_street: "defra street",
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue:
          "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
          "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
          "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue:
          "No",
      },
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("defra_subbuildingname, defra street");
  });

  it("should return an updated address one omitting null values with defra building name", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: "defra_buildname",
        defra_subbuildingname: "defra_subbuildingname",
        defra_premises: null,
        defra_street: "defra street",
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue:
          "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
          "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
          "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue:
          "No",
      },
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("defra_subbuildingname, defra_buildname, defra street");
  });

  it("should return an updated address one omitting null values with no defra street", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: "defra_buildname",
        defra_subbuildingname: "defra_subbuildingname",
        defra_premises: null,
        defra_street: null,
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue:
          "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
          "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
          "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue:
          "No",
      },
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("defra_subbuildingname, defra_buildname");
  });

  it("should return an updated address one omitting null values with no defra premises", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: {
        defra_uprn: null,
        defra_buildingname: null,
        defra_subbuildingname: null,
        defra_premises: null,
        defra_street: "defra street",
        defra_locality: null,
        defra_dependentlocality: null,
        defra_towntext: "defra town",
        defra_county: "defra county",
        defra_postcode: "defra postcode",
        _defra_country_value: "defra county value",
        defra_internationalpostalcode: null,
        defra_fromcompanieshouse: false,
        defra_addressid: "defra address id",
        _defra_country_value_OData_Community_Display_V1_FormattedValue:
          "defra country value",
        _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
          "defra_Country",
        _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
          "defra_country",
        defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue:
          "No",
      },
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("defra street");
  });

  it("should return an updated address one omitting null values with no defra address", () => {
    const nullAddressOneValues = {
      ...backEndOldFormatExporterDetails,
      _dynamicsAddress: undefined,
    };

    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      nullAddressOneValues
    );

    expect(result.addressOne).toBe("");
  });
});

describe("when mapping from an old back end PS ExporterDetail to a new back end PS ExporterDetail for an organisation", () => {
  const backEndOldFormatExporterDetails: ExporterDetails = {
    contactId: "some contact id",
    accountId: "some account id",
    exporterCompanyName: "Private",
    addressOne: "45 Leopold Street",
    addressTwo: "",
    townCity: "Town",
    postcode: "DE1 2HF",
    _dynamicsAddress: {
      defra_uprn: null,
      defra_buildingname: null,
      defra_subbuildingname: null,
      defra_premises: "null",
      defra_street: "defra street",
      defra_locality: "defra locality",
      defra_dependentlocality: null,
      defra_towntext: null,
      defra_county: null,
      defra_postcode: "defra postcode",
      _defra_country_value: "f49cf73a-fa9c-e811-a950-000d3a3a2566",
      defra_internationalpostalcode: null,
      defra_fromcompanieshouse: true,
      defra_addressid: "b774357d-1447-e911-a969-000d3a28d1a0",
      _defra_country_value_OData_Community_Display_V1_FormattedValue:
        "United Kingdom of Great Britain and Northern Ireland",
      _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
        "defra_Country",
      _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
        "defra_country",
      defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue: "Yes",
    },
    _dynamicsUser: {
      firstName: "Organsation first name",
      lastName: "Organisation last name",
    },
  };

  const backEndNewFormatExporterDetails: ExporterDetails = {
    contactId: "some contact id",
    accountId: "some account id",
    exporterCompanyName: "Private",
    addressOne: "address one",
    buildingNumber: "building numbner",
    subBuildingName: "subbuilding name",
    buildingName: "building name",
    streetName: "street name",
    county: "county",
    country: "country",
    townCity: "town",
    postcode: "post code",
    _dynamicsAddress: {
      defra_uprn: null,
      defra_buildingname: null,
      defra_subbuildingname: null,
      defra_premises: "null",
      defra_street: "45 Leopold Street",
      defra_locality: "Derby",
      defra_dependentlocality: null,
      defra_towntext: null,
      defra_county: null,
      defra_postcode: "DE1 2HF",
      _defra_country_value: "f49cf73a-fa9c-e811-a950-000d3a3a2566",
      defra_internationalpostalcode: null,
      defra_fromcompanieshouse: true,
      defra_addressid: "b774357d-1447-e911-a969-000d3a28d1a0",
      _defra_country_value_OData_Community_Display_V1_FormattedValue:
        "United Kingdom of Great Britain and Northern Ireland",
      _defra_country_value_Microsoft_Dynamics_CRM_associatednavigationproperty:
        "defra_Country",
      _defra_country_value_Microsoft_Dynamics_CRM_lookuplogicalname:
        "defra_country",
      defra_fromcompanieshouse_OData_Community_Display_V1_FormattedValue: "Yes",
    },
    _dynamicsUser: {
      firstName: "defra first name",
      lastName: "defra last name",
    },
  };

  it("should return an updated back end PS exporter detail", () => {
    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      backEndOldFormatExporterDetails
    );

    expect(result.contactId).toBe("some contact id");
    expect(result.accountId).toBe("some account id");
    expect(result.exporterCompanyName).toBe("Private");
    expect(result.addressOne).toBe("defra street, defra locality");
    expect(result.addressTwo).toBeUndefined();
    expect(result.buildingNumber).toBeNull();
    expect(result.subBuildingName).toBeNull();
    expect(result.buildingName).toBeNull();
    expect(result.streetName).toBe("defra street");
    expect(result.townCity).toBeNull();
    expect(result.county).toBeNull();
    expect(result.country).toBe(
      "United Kingdom of Great Britain and Northern Ireland"
    );
    expect(result.postcode).toBe("defra postcode");
  });

  it("should return the same back end PS exporter detail", () => {
    const result: ExporterDetails = FrontEndExporter.toBackEndNewPsAndSdExporterDetails(
      backEndNewFormatExporterDetails
    );

    expect(result).toStrictEqual(backEndNewFormatExporterDetails);
  });
});


describe('Mapping  Exporter Details for Storage Documents ExporterDetail from backend to front end', () => {
  it('should return exporterDetails in the format that FE expects', () => {
    const expectedResult: FrontEndExporter.Exporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingNumber: '123',
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        user_id: "",
        journey: "",
        currentUri: "",
        nextUri: "",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        },
        _updated: true
      }
    };

    const backendExporter: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "FSociety",
      addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      buildingNumber: '123',
      subBuildingName: 'Unit 1',
      buildingName: 'CJC Fish Ltd',
      streetName: '17  Old Edinburgh Road',
      county: 'West Midlands',
      country: 'England',
      townCity: 'Aberdeen',
      postcode: 'AB1 2XX',
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      },
      _updated: true
    };

    const result = FrontEndExporter.toFrontEndPsAndSdExporterDetails(backendExporter);
    expect(result).toStrictEqual(expectedResult);
  });
});

describe("when mapping from a front end SD exporterDetails to a backend SD exporterDetails", () => {
  it("will contain all relevant properties for a processing statement details object", () => {
    const myFrontEndExporter: FrontEndExporter.Exporter = {
      model: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "FSociety",
        addressOne: "Fake St",
        buildingNumber: "123",
        subBuildingName: "Unit 1",
        buildingName: "CJC Fish Ltd",
        streetName: "17  Old Edinburgh Road",
        county: "West Midlands",
        country: "England",
        townCity: "Nuevo Jamon",
        postcode: "NE1 0HI",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
        _updated: true,
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
      },
    };

    const expectedResult: ExporterDetails = {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "FSociety",
      addressOne: "Fake St",
      buildingNumber: "123",
      subBuildingName: "Unit 1",
      buildingName: "CJC Fish Ltd",
      streetName: "17  Old Edinburgh Road",
      county: "West Midlands",
      country: "England",
      townCity: "Nuevo Jamon",
      postcode: "NE1 0HI",
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      }
    };

    const result = FrontEndExporter.toBackEndPsAndSdExporterDetails(myFrontEndExporter);

    expect(result).toStrictEqual(expectedResult);
  });

  it("will deal with optional data", () => {
    const myFrontEndExporter: FrontEndExporter.Exporter = {
      model: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "FSociety",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingName: "CJC Fish Ltd",
        streetName: "17  Old Edinburgh Road",
        county: "West Midlands",
        country: "England",
        townCity: "Aberdeen",
        postcode: "AB1 2XX",
        user_id: "4023482347523382523",
        journey: "catchCertificate",
        currentUri: "test/test.html",
        nextUri: "test/test.asx",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
      },
    };

    const result = FrontEndExporter.toBackEndPsAndSdExporterDetails(
      myFrontEndExporter
    );

    expect(result.buildingNumber).toBeUndefined();
    expect(result.subBuildingName).toBeUndefined();
    expect(result._updated).toBeUndefined();
  });

  it("should return an updated address one omitting null values with no exporter details", () => {
    // @ts-expect-error testing empty object
    const result = FrontEndExporter.toBackEndPsAndSdExporterDetails({});

    expect(result).toBeUndefined();
  })
});