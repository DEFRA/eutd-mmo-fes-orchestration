import { CatchCertificate, DocumentStatuses, toFrontEndCatchCertificateDocumentNumber, cloneCatchCertificate, ExportData, cloneExportData, cloneProductData, Product, Catch, cloneCatch, LandingStatuses, LandingsEntryOptions } from './catchCert';
import { DocumentNumber } from '../schema/frontEndModels/documentNumber';
import { BasicTransportDetails } from './common';

describe('toFrontEndDocumentNumber mapping back end to front end', () => {
  it('should return a valid document number data object when called with a catch certificate', () => {
    const expected: DocumentNumber = {
      documentNumber: "GBR-2020-CC-E0DE238CB",
      status: "DRAFT",
      startedAt: "05 Feb 2020"
    }

    const catchCertificate: CatchCertificate = {
      documentNumber: "GBR-2020-CC-E0DE238CB",
      createdAt: "05 Feb 2020",
      createdBy: "User Id  to be done ",
      createdByEmail: "User email  to be done ",
      draftData: {},
      requestByAdmin: true,
      exportData: {
        products: [
          {
            species: "test-species-label",
            speciesId: "test-product-id",
            speciesCode: "test-species-code",
            commodityCode: "test-commodityCode",
            state: {
              code: "test-state-code",
              name: "test-state-label"
            },
            presentation: {
              code: "test-presentation-code",
              name: "test-presentation-label"
            },
            caughtBy: [
              {
                vessel: "test-vesselName",
                pln: "test-pln",
                id: "test-id",
                date: "2020-02-04",
                weight: 150,
                gearCategory: "Category 1",
                gearType: "Type 1",
                highSeasArea: 'yes',
                exclusiveEconomicZones: [],
                faoArea: "test-fao",
                numberOfSubmissions: 0,
                rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
              }
            ]
          }
        ],
        transportation: {
          vehicle: "truck",
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          exportedFrom: "United Kingdom"
        },
        transportations: [{
          id: 0,
          vehicle: "truck",
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          freightBillNumber: 'AA1234567'
        }, {
          id: 1,
          vehicle: 'Train',
        }],
        exportedFrom: "United Kingdom",
        conservation: {
          conservationReference: "UK Fisheries Policy, Common Fisheries Policy, dsf"
        },
        exporterDetails: {
          contactId : 'a contact Id',
          accountId  : 'an account id',
          exporterFullName: "Mr. Robot",
          exporterCompanyName: "FSociety",
          addressOne: '123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road',
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Nuevo Jamon",
          postcode: "NE1 0HI",
          _dynamicsAddress : {},
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe"
          }
        },
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      },
      status: "DRAFT",
      documentUri: "",
      userReference : ''
    }

    expect(toFrontEndCatchCertificateDocumentNumber(catchCertificate)).toStrictEqual(expected);
  });
});

describe('cloneCatchCertificate', () => {
  const defaultExcludeLandings = false;
  const voidOriginal = false;

  const original: CatchCertificate = {
    createdBy: 'Bob',
    createdByEmail: 'bob@bob',
    createdAt: '2021-01-01T00:00:00.000+00:00',
    status: DocumentStatuses.Complete,
    documentNumber: 'DOC1',
    exportData: {
      exporterDetails: {
        accountId: 'accountId',
        exporterFullName: 'exporterFullName',
        exporterCompanyName: 'exporterCompanyName',
        buildingNumber: 'buildingNumber',
        subBuildingName: 'subBuildingName',
        buildingName: 'buildingName',
        streetName: 'streetName',
        county: 'county',
        country: 'country',
        townCity: 'townCity',
        postcode: 'postcode',
        addressOne: 'addressOne',
        _dynamicsAddress: null,
        _dynamicsUser: null
      },
      products: [
        {
          speciesId: 'DOC1-RANDOMUUID'
        }
      ],
      transportation: {
        vehicle: 'Truck',

      },
      transportations: [{
        id: 0,
        vehicle: "truck",
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        freightBillNumber: 'AA1234567'
      }, {
        id: 1,
        vehicle: 'Truck',
      }],
      conservation: {
        conservationReference: 'conservationReference'
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry,
      exportedFrom: "United Kingdom"
    },
    userReference: 'userReference',
    requestByAdmin: false
  }

  const clone = cloneCatchCertificate(original, 'DOC2', defaultExcludeLandings, 'contactBob', false, voidOriginal);

  it('will copy the author details', () => {
    expect(clone.createdBy).toBe(original.createdBy);
    expect(clone.createdByEmail).toBe(original.createdByEmail);
  });

  it('will copy the user reference', () => {
    expect(clone.userReference).toBe(original.userReference);
  });

  it('will update the created at date', () => {
    expect(clone.createdAt).not.toBe(original.createdAt);
  });

  it('will set the document status to draft', () => {
    expect(clone.status).toBe(DocumentStatuses.Draft);
  });

  it('will update the document number', () => {
    expect(clone.documentNumber).toBe('DOC2');
  });

  it('will set requestByAdmin to be false', () => {
    expect(clone.requestByAdmin).toBeFalsy();
  });

  it('will update the export data details', () => {
    expect(clone.exportData).not.toBe(original.exportData);
  });

  it('will not copy undefined properties', () => {
    const noUserReference = {
      createdBy: original.createdBy,
      createdByEmail: original.createdByEmail,
      createdAt: original.createdAt,
      status: DocumentStatuses.Complete,
      documentNumber: 'DOC1',
      exportData: original.exportData
    }

    const clone = cloneCatchCertificate(noUserReference, 'DOC2', defaultExcludeLandings, 'contactBob', true, voidOriginal);

    expect(Object.keys(clone)).not.toContain('userReference');
    expect(clone.requestByAdmin).toBe(true);
  });

});

describe('cloneExportData - with an old exportedTo', () => {
  const defaultExcludeLandings = false;

  const original: any = {
    exporterDetails: {
      accountId: 'accountId',
      exporterFullName: 'exporterFullName',
      exporterCompanyName: 'exporterCompanyName',
      buildingNumber: 'buildingNumber',
      subBuildingName: 'subBuildingName',
      buildingName: 'buildingName',
      streetName: 'streetName',
      county: 'county',
      country: 'country',
      townCity: 'townCity',
      postcode: 'postcode',
      addressOne: 'addressOne',
      _dynamicsAddress: null,
      _dynamicsUser: null
    },
    products: [
      {
        speciesId: 'DOC1-RANDOMUUID1'
      },
      {
        speciesId: 'DOC1-RANDOMUUID2'
      }
    ],
    transportation: {
      vehicle: 'Truck',
      exportedTo: 'Nigeria'
    },
    transportations: [{
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
      freightBillNumber: 'AA1234567',
      exportedFrom: "United Kingdom"
    }, {
      vehicle: 'Truck',
    }],
    conservation: {
      conservationReference: 'conservationReference'
    },
    favouriteProducts: [
      {
        speciesId: 'PRD467'
      },
      {
        speciesId: 'PRD468'
      }
    ]
  };

  const clone = cloneExportData(original, 'DOC2', defaultExcludeLandings);


  it('will copy and map exportedTo into the currently supported format', () => {
    const expected: BasicTransportDetails  = {
      vehicle: 'Truck',
      exportedTo: {
        officialCountryName: original.transportation.exportedTo
      }
    };

    expect(clone.transportation).toStrictEqual(expected);
  });
});

describe('cloneExportData', () => {
  const defaultExcludeLandings = false;

  const original: ExportData = {
    exporterDetails: {
      accountId: 'accountId',
      exporterFullName: 'exporterFullName',
      exporterCompanyName: 'exporterCompanyName',
      buildingNumber: 'buildingNumber',
      subBuildingName: 'subBuildingName',
      buildingName: 'buildingName',
      streetName: 'streetName',
      county: 'county',
      country: 'country',
      townCity: 'townCity',
      postcode: 'postcode',
      addressOne: 'addressOne',
      _dynamicsAddress: null,
      _dynamicsUser: null
    },
    products: [
      {
        speciesId: 'DOC1-RANDOMUUID1'
      },
      {
        speciesId: 'DOC1-RANDOMUUID2'
      }
    ],
    transportation: {
      vehicle: 'Truck'
    },
    transportations: [{
      id: 0,
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
      freightBillNumber: 'AA1234567'
    }, {
      id: 1,
      vehicle: 'Truck',
    }],
    conservation: {
      conservationReference: 'conservationReference'
    },
    landingsEntryOption: LandingsEntryOptions.ManualEntry,
    exportedFrom: "United Kingdom"
  };

  const clone = cloneExportData(original, 'DOC2', defaultExcludeLandings);

  it('will copy the conservation details', () => {
    expect(clone.conservation).toBe(original.conservation);
  });

  it('will copy the exporter details', () => {
    expect(clone.exporterDetails).toBe(original.exporterDetails);
  });

  it('will copy the transportation details', () => {
    expect(clone.transportation).toBe(original.transportation);
  });

  it('will update the product details if there are any', () => {
    expect(clone.products).not.toBe(original.products);
  });

  it('will leave the product details if they are empty', () => {
    const original: ExportData = {
      exporterDetails: {
        accountId: 'accountId',
        exporterFullName: 'exporterFullName',
        exporterCompanyName: 'exporterCompanyName',
        buildingNumber: 'buildingNumber',
        subBuildingName: 'subBuildingName',
        buildingName: 'buildingName',
        streetName: 'streetName',
        county: 'county',
        country: 'country',
        townCity: 'townCity',
        postcode: 'postcode',
        addressOne: 'addressOne',
        _dynamicsAddress: null,
        _dynamicsUser: null
      },
      products: [],
      transportation: {
        vehicle: 'Truck'
      },
      transportations: [{
        id: 0,
        vehicle: "truck",
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        freightBillNumber: 'AA1234567'
      }, {
        id: 1,
        vehicle: 'Truck',
      }],
      conservation: {
        conservationReference: 'conservationReference'
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry,
      exportedFrom: "United Kingdom"
    };

    const clone = cloneExportData(original, 'cc2', defaultExcludeLandings);

    expect(clone.products).toBe(original.products);
  });

  it('will not exclude landings when not specified to do so', () => {
    const original: ExportData = {
      exporterDetails: {
        accountId: 'accountId',
        exporterFullName: 'exporterFullName',
        exporterCompanyName: 'exporterCompanyName',
        buildingNumber: 'buildingNumber',
        subBuildingName: 'subBuildingName',
        buildingName: 'buildingName',
        streetName: 'streetName',
        county: 'county',
        country: 'country',
        townCity: 'townCity',
        postcode: 'postcode',
        addressOne: 'addressOne',
        _dynamicsAddress: null,
        _dynamicsUser: null
      },
      products: [{
        speciesId: 'DOC1-RANDOMUUID',
        species: 'Fish',
        speciesCode: 'FISH',
        commodityCode: '1234',
        commodityCodeDescription: 'Fishy fish',
        scientificName: 'Fish',
        state: {
          code: 'FRE',
          name: 'Fresh'
        },
        presentation: {
          code: 'FIL',
          name: 'Filleted'
        },
        factor : 1,
        caughtBy: [
          {
            id: 'DOC1-UNIXTIME1',
          },
          {
            id: 'DOC1-UNIXTIME2',
          }
        ]
      }],
      transportation: {
        vehicle: 'Truck'
      },
      transportations: [{
        id: 0,
        vehicle: "truck",
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        freightBillNumber: 'AA1234567'
      }, {
        id: 1,
        vehicle: 'Truck',
      }],
      conservation: {
        conservationReference: 'conservationReference'
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry,
      exportedFrom: "United Kingdom"
    };

    const expected: Catch[] = [
      {
        id: 'cc21-UNIXTIME1',
      },
      {
        id: 'cc21-UNIXTIME2',
      }
    ];

    const clone = cloneExportData(original, 'cc2', defaultExcludeLandings);

    expect(clone.products[0].caughtBy).toStrictEqual(expected);
  });

  it('will exclude landings if specified to do so', () => {
    const original: ExportData = {
      exporterDetails: {
        accountId: 'accountId',
        exporterFullName: 'exporterFullName',
        exporterCompanyName: 'exporterCompanyName',
        buildingNumber: 'buildingNumber',
        subBuildingName: 'subBuildingName',
        buildingName: 'buildingName',
        streetName: 'streetName',
        county: 'county',
        country: 'country',
        townCity: 'townCity',
        postcode: 'postcode',
        addressOne: 'addressOne',
        _dynamicsAddress: null,
        _dynamicsUser: null
      },
      products: [{
        speciesId: 'DOC1-RANDOMUUID',
        species: 'Fish',
        speciesCode: 'FISH',
        commodityCode: '1234',
        commodityCodeDescription: 'Fishy fish',
        scientificName: 'Fish',
        state: {
          code: 'FRE',
          name: 'Fresh'
        },
        presentation: {
          code: 'FIL',
          name: 'Filleted'
        },
        factor : 1,
        caughtBy: [
          {
            id: 'DOC1-UNIXTIME1',
          },
          {
            id: 'DOC1-UNIXTIME2',
          }
        ]
      }],
      transportation: {
        vehicle: 'Truck'
      },
      transportations: [{
        id: 0,
        vehicle: "truck",
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        freightBillNumber: 'AA1234567'
      }, {
        id: 1,
        vehicle: 'Truck',
      }],
      conservation: {
        conservationReference: 'conservationReference'
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry,
      exportedFrom: "United Kingdom"
    };

    const clone = cloneExportData(original, 'cc2', true);

    expect(clone.products[0].caughtBy).toBeUndefined();
  });

});

describe('cloneProductData', () => {
  const defaultExcludeLandings = false;

  const original: Product = {
    speciesId: 'DOC1-RANDOMUUID',
    species: 'Fish',
    speciesCode: 'FISH',
    commodityCode: '1234',
    commodityCodeDescription: 'Fishy fish',
    scientificName: 'Fish',
    state: {
      code: 'FRE',
      name: 'Fresh'
    },
    presentation: {
      code: 'FIL',
      name: 'Filleted'
    },
    factor : 1,
    caughtBy: [
      {
        id: 'DOC1-UNIXTIME1',
      },
      {
        id: 'DOC1-UNIXTIME2',
      }
    ]
  };

  const clone = cloneProductData(original, 'DOC2', defaultExcludeLandings);

  it('will exclude landings if specified to do so', () => {
    const clone = cloneProductData(original, 'DOC2', true);
    expect(clone.caughtBy).toBeUndefined();
  });

  it('will update the species id with the new document number', () => {
    expect(clone.speciesId).toBe('DOC2-RANDOMUUID')
  });

  it('will update the landings if there are any', () => {
    expect(clone.caughtBy).not.toBe(original.caughtBy);
  });

  it('will leave the landings alone if there are none', () => {
    const original: Product = {
      speciesId: 'DOC1-RANDOMUUID',
      species: 'Fish',
      speciesCode: 'FISH',
      commodityCode: '1234',
      commodityCodeDescription: 'Fishy fish',
      scientificName: 'Fish',
      state: {
        code: 'FRE',
        name: 'Fresh'
      },
      presentation: {
        code: 'FIL',
        name: 'Filleted'
      },
      factor : 1,
      caughtBy: []
    };

    const clone = cloneProductData(original, 'DOC2', defaultExcludeLandings);

    expect(clone.caughtBy).toBe(original.caughtBy);
  });

  it('will keep all the other fields the same', () => {
    expect(clone.species).toBe(original.species);
    expect(clone.speciesCode).toBe(original.speciesCode);
    expect(clone.commodityCode).toBe(original.commodityCode);
    expect(clone.commodityCodeDescription).toBe(original.commodityCodeDescription);
    expect(clone.scientificName).toBe(original.scientificName);
    expect(clone.state).toBe(original.state);
    expect(clone.presentation).toBe(original.presentation);
    expect(clone.factor).toBe(original.factor);
  });

  it('will not return any fields which are undefined', () => {
    const original: Product = {
      speciesId: '123'
    };

    const clone = cloneProductData(original, 'cc2', defaultExcludeLandings);

    expect(Object.keys(clone).length).toBe(1);
  });

});

describe('cloneCatch', () => {

  const original: Catch = {
    id: 'DOC1-UNIXTIME',
    vessel: 'VESSEL',
    pln: 'PLN',
    homePort: 'PORT',
    flag: 'FLAG',
    cfr: 'CFR',
    imoNumber: 'IMO',
    licenceNumber: 'LICENSE',
    licenceValidTo: 'LICENSE VALID TO',
    licenceHolder: 'LICENSE HOLDER NAME',
    date: 'DATE',
    faoArea: 'FAO1',
    gearCategory: "Category 1",
    gearType: "Type 1",
    weight: 100,
    _status: LandingStatuses.Complete,
    numberOfSubmissions: 1,
    vesselOverriddenByAdmin: true,
    vesselNotFound: true
  };

  const clone = cloneCatch(original, 'DOC2');

  it('will update the catch id with the new document number', () => {
    expect(clone.id).toBe('DOC2-UNIXTIME');
  });

  it('will remove the status field', () => {
    expect(clone._status).toBeUndefined();
  });

  it('will remove the number of submissions field', () => {
    expect(clone.numberOfSubmissions).toBeUndefined();
  });

  it('will remove the vessel overridden by admin field', () => {
    expect(clone.vesselOverriddenByAdmin).toBeUndefined();
  });

  it('will remove the vessel not found field', () => {
    expect(clone.vesselNotFound).toBeUndefined();
  });

  it('will keep all the other fields the same', () => {
    expect(clone.vessel).toBe(original.vessel);
    expect(clone.pln).toBe(original.pln);
    expect(clone.homePort).toBe(original.homePort);
    expect(clone.flag).toBe(original.flag);
    expect(clone.cfr).toBe(original.cfr);
    expect(clone.imoNumber).toBe(original.imoNumber);
    expect(clone.licenceNumber).toBe(original.licenceNumber);
    expect(clone.licenceHolder).toBe(original.licenceHolder);
    expect(clone.licenceValidTo).toBe(original.licenceValidTo);
    expect(clone.date).toBe(original.date);
    expect(clone.gearCategory).toBe(original.gearCategory);
    expect(clone.gearType).toBe(original.gearType);
    expect(clone.weight).toBe(original.weight);
  });

  it('will not return any fields which are undefined', () => {
    const original: Catch = {
      id: '123'
    };

    const clone = cloneCatch(original, 'cc2');

    expect(Object.keys(clone).length).toBe(1);
  });

});