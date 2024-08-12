import { CatchCertificate, LandingsEntryOptions } from "../catchCert";

import { toBackEndCatchCert } from "./catchCertificate";
import { DocumentNumber } from "./documentNumber";
import { ProductsLanded } from "./payload";
import { Transport } from "./transport";
import { ExportLocation } from "./export-location";
import { CcExporter } from "./exporterDetails";
import { Conservation } from "./conservation";
import * as FrontEnd from "./catchCertificate"

describe('toBackEndCatchCert Mapping frontEnd Certificate to BackEnd', () => {

  const documentNumber: DocumentNumber = {
    documentNumber: "GBR-2020-CC-E0DE238CB",
    status: "DRAFT",
    startedAt: "05 Feb 2020"
  };

  const requestByAdmin: boolean = true;

  const transport: Transport = {
    vehicle: "truck",
    cmr: "false",
    exportedTo: {
      officialCountryName: "SPAIN",
      isoCodeAlpha2: "A1",
      isoCodeAlpha3: "A3",
      isoNumericCode: "SP"
    },
    nationalityOfVehicle: "adsf",
    registrationNumber: "asdsfsd",
    departurePlace: "Aylesbury",
    user_id: "UID",
    journey: "Journey",
    currentUri: "some/uri",
    nextUri: "next/uri"
  };

  const exportLocation: ExportLocation = {
    "exportedFrom": "United Kingdom",
    "exportedTo": {
      officialCountryName: "SPAIN",
      isoCodeAlpha2: "A1",
      isoCodeAlpha3: "A3",
      isoNumericCode: "SP"
    }
  };

  const conservation: Conservation = {
    conservationReference: "UK Fisheries Policy, Common Fisheries Policy, dsf",
    caughtInUKWaters: 'Y',
    caughtInEUWaters: 'Y',
    caughtInOtherWaters: 'Y',
    legislation: ["UK Fisheries", "Common Market", "Iranian Waters"],
    otherWaters: "Iranian Waters",
    user_id: "4308324093284230958203532",
    currentUri: "test/test.html",
    nextUri: "test/test.asx"
  };

  const exporterDetails: CcExporter = {
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
      townCity: "Aberdeen",
      postcode: "AB1 2XX",
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      },
      user_id: "4023482347523382523",
      journey: "catchCertificate",
      currentUri: "test/test.html",
      nextUri: "test/test.asx"
    }
  };

  it('should return a valid back end catch certificate', () => {
    const productsLanded: ProductsLanded = {
      items: [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeDescription: "test-commodityCode-description",
          factor: 2.3,
          scientificName: "test-scientific-name",
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code'
          },
          state: {
            label: 'test-state-label',
            code: 'test-state-code'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code'
          }
        },
        landings: [{
          model: {
            id: 'test-id',
            numberOfSubmissions: 0,
            vessel: {
              pln: 'test-pln',
              vesselName: 'test-vesselName',
              homePort: 'test-homePort',
              flag: 'test-flag',
              licenceNumber: 'test-licenceNumber',
              imoNumber: 'test-imoNumber',
              licenceValidTo: '2020-02-05',
              rssNumber: 'test-rssNumber',
              vesselLength: 100,
              label: 'test-label',
              domId: 'test-domId'
            },
            dateLanded: '2020-02-04',
            exportWeight: 150,
            faoArea: 'test-fao'
          }
        }]
      }]
    };

    const expected: CatchCertificate = {
      documentNumber: "GBR-2020-CC-E0DE238CB",
      createdAt: "05 Feb 2020",
      createdBy: "User Id  to be done ",
      createdByEmail: "User email  to be done ",
      requestByAdmin: true,
      draftData: {},
      exportData: {
        products: [
          {
            species: "test-species-label",
            speciesAdmin: undefined,
            speciesId: "test-product-id",
            speciesCode: "test-species-code",
            commodityCode: "test-commodityCode",
            commodityCodeAdmin: undefined,
            commodityCodeDescription: "test-commodityCode-description",
            factor: 2.3,
            scientificName: "test-scientific-name",
            state: {
              code: "test-state-code",
              name: "test-state-label",
              admin: undefined
            },
            presentation: {
              code: "test-presentation-code",
              name: "test-presentation-label",
              admin: undefined
            },
            caughtBy: [
              {
                vessel: "test-vesselName",
                pln: "test-pln",
                id: "test-id",
                date: "2020-02-04",
                weight: 150,
                faoArea: "test-fao",
                numberOfSubmissions: 0,
                homePort: "test-homePort",
                flag: "test-flag",
                imoNumber: "test-imoNumber",
                licenceNumber: "test-licenceNumber",
                licenceValidTo: "2020-02-05"
              }
            ]
          }
        ],
        transportation: {
          vehicle: "truck",
          cmr: false,
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        conservation: {
          conservationReference: "UK Fisheries Policy, Common Fisheries Policy, dsf"
        },
        exporterDetails: {
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
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: {},
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe"
          }
        },
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      },
      status: "DRAFT",
      documentUri: "",
      userReference: ''
    };

    const result = toBackEndCatchCert(documentNumber, productsLanded, transport, exportLocation, conservation, exporterDetails, LandingsEntryOptions.ManualEntry, requestByAdmin);

    expect(result).toStrictEqual(expected);
  });

  it('should return a valid back end catch certificate with admin values', () => {
    const productsLanded: ProductsLanded = {
      items: [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeAdmin: 'test-commodityCode-admin',
          commodityCodeDescription: "test-commodityCode-description",
          factor: 2.3,
          scientificName: "test-scientific-name",
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code',
            admin: 'test-presentation-admin'
          },
          state: {
            label: 'test-state-label',
            code: 'test-state-code',
            admin: 'test-state-admin'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code',
            admin: 'test-species-admin'
          }
        },
        landings: [{
          model: {
            id: 'test-id',
            numberOfSubmissions: 0,
            vessel: {
              pln: 'test-pln',
              vesselName: 'test-vesselName',
              homePort: 'test-homePort',
              flag: 'test-flag',
              licenceNumber: 'test-licenceNumber',
              imoNumber: 'test-imoNumber',
              licenceValidTo: '2020-02-05',
              rssNumber: 'test-rssNumber',
              vesselLength: 100,
              label: 'test-label',
              domId: 'test-domId'
            },
            dateLanded: '2020-02-04',
            exportWeight: 150,
            faoArea: 'test-fao'
          }
        }]
      }]
    };

    const expected: CatchCertificate = {
      documentNumber: "GBR-2020-CC-E0DE238CB",
      createdAt: "05 Feb 2020",
      createdBy: "User Id  to be done ",
      createdByEmail: "User email  to be done ",
      requestByAdmin: true,
      draftData: {},
      exportData: {
        products: [
          {
            species: "test-species-label",
            speciesAdmin: "test-species-admin",
            speciesId: "test-product-id",
            speciesCode: "test-species-code",
            commodityCode: "test-commodityCode",
            commodityCodeAdmin: "test-commodityCode-admin",
            commodityCodeDescription: "test-commodityCode-description",
            factor: 2.3,
            scientificName: "test-scientific-name",
            state: {
              code: "test-state-code",
              name: "test-state-label",
              admin: "test-state-admin"
            },
            presentation: {
              code: "test-presentation-code",
              name: "test-presentation-label",
              admin: "test-presentation-admin"
            },
            caughtBy: [
              {
                vessel: "test-vesselName",
                pln: "test-pln",
                id: "test-id",
                date: "2020-02-04",
                weight: 150,
                faoArea: "test-fao",
                numberOfSubmissions: 0,
                homePort: "test-homePort",
                flag: "test-flag",
                imoNumber: "test-imoNumber",
                licenceNumber: "test-licenceNumber",
                licenceValidTo: "2020-02-05"
              }
            ]
          }
        ],
        transportation: {
          vehicle: "truck",
          cmr: false,
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        conservation: {
          conservationReference: "UK Fisheries Policy, Common Fisheries Policy, dsf"
        },
        exporterDetails: {
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
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: {},
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe"
          }
        },
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      },
      status: "DRAFT",
      documentUri: "",
      userReference: ''
    };

    const result = toBackEndCatchCert(documentNumber, productsLanded, transport, exportLocation, conservation, exporterDetails, LandingsEntryOptions.ManualEntry, requestByAdmin);

    expect(result).toStrictEqual(expected);
  });

});

describe('toFrontEndCatchCert Mapping BackEnd Certificate to frontEnd', () => {

  it('should return a valid front end catch certificate', () => {
    const backEndCc: CatchCertificate = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: ''
        },
        products: [{
          species: "Atlantic cod (COD)",
          speciesId: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
          speciesCode: "COD",
          commodityCode: "03024310",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "WHL",
            name: "Whole"
          },
          caughtBy: [{
            numberOfSubmissions: 0,
            vessel: "AGAN BORLOWEN",
            pln: "SS229",
            homePort: "NEWLYN",
            flag: "GBR",
            imoNumber: null,
            licenceNumber: "25072",
            licenceValidTo: "2382-12-31T00:00:00",
            id: "GBR-X-CC-1-1610013801",
            date: "2021-01-07",
            faoArea: "FAO27",
            weight: 12
          }]
        }],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "directLanding",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      },
      draftData: {},
      documentUri: 'some document uri'
    };

    const expected: FrontEnd.CatchCertificate = {
      exporter: {
        model: {
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          currentUri: "",
          exporterCompanyName: "Company name",
          exporterFullName: "Joe Blogg",
          journey: "",
          nextUri: "",
          user_id: "",
          _dynamicsUser: "",
          _dynamicsAddress: "",
          accountId: ""
        }
      },
      exportPayload: {
        items: [{
          product: {
            id: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
            commodityCode: "03024310",
            presentation: {
              code: "WHL",
              label: "Whole",
              admin: undefined
            },
            state: {
              code: "FRE",
              label: "Fresh",
              admin: undefined
            },
            species: {
              code: "COD",
              label: "Atlantic cod (COD)",
              admin: undefined
            }
          },
          landings: [{
            model: {
              id: "GBR-X-CC-1-1610013801",
              vessel: {
                pln: "SS229",
                vesselName: "AGAN BORLOWEN",
                label: "AGAN BORLOWEN (SS229)",
                homePort: "NEWLYN",
                flag: "GBR",
                imoNumber: null,
                licenceNumber: "25072",
                licenceValidTo: "2382-12-31T00:00:00"
              },
              faoArea: "FAO27",
              dateLanded: "2021-01-07",
              exportWeight: 12,
              numberOfSubmissions: 0
            }
          }]
        }]
      },
      conservation: {
        conservationReference: "UK Fisheries Policy",
        legislation: ["UK Fisheries Policy"],
        caughtInUKWaters: "Y",
        user_id: "Test",
        currentUri: "Test",
        nextUri: "Test"
      },
      transport: {
        vehicle: "directLanding",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      exportLocation: {
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry
    };

    const result = FrontEnd.toFrontEndCatchCert(backEndCc);

    expect(result).toStrictEqual(expected);
  });

  it('should return a valid front end catch certificate with admin values', () => {
    const backEndCc: CatchCertificate = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: ''
        },
        products: [{
          species: "Atlantic cod (COD)",
          speciesAdmin: "ADMIN SPECIES",
          speciesId: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
          speciesCode: "COD",
          commodityCode: "03024310",
          commodityCodeAdmin: "ADMIN COMMODITY CODE",
          state: {
            code: "FRE",
            name: "Fresh",
            admin: "ADMIN STATE"
          },
          presentation: {
            code: "WHL",
            name: "Whole",
            admin: "ADMIN PRESENTATION"
          },
          caughtBy: [{
            numberOfSubmissions: 0,
            vessel: "AGAN BORLOWEN",
            pln: "SS229",
            homePort: "NEWLYN",
            flag: "GBR",
            imoNumber: null,
            licenceNumber: "25072",
            licenceValidTo: "2382-12-31T00:00:00",
            id: "GBR-X-CC-1-1610013801",
            date: "2021-01-07",
            faoArea: "FAO27",
            weight: 12
          }]
        }],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "directLanding",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      },
      draftData: {},
      documentUri: 'some document uri'
    }

    const expected: FrontEnd.CatchCertificate = {
      exporter: {
        model: {
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          currentUri: "",
          exporterCompanyName: "Company name",
          exporterFullName: "Joe Blogg",
          journey: "",
          nextUri: "",
          user_id: "",
          _dynamicsUser: "",
          _dynamicsAddress: "",
          accountId: ""
        }
      },
      exportPayload: {
        items: [{
          product: {
            id: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
            commodityCode: "03024310",
            commodityCodeAdmin: "ADMIN COMMODITY CODE",
            presentation: {
              code: "WHL",
              label: "Whole",
              admin: "ADMIN PRESENTATION"
            },
            state: {
              code: "FRE",
              label: "Fresh",
              admin: "ADMIN STATE"
            },
            species: {
              code: "COD",
              label: "Atlantic cod (COD)",
              admin: "ADMIN SPECIES",
            }
          },
          landings: [{
            model: {
              id: "GBR-X-CC-1-1610013801",
              vessel: {
                pln: "SS229",
                vesselName: "AGAN BORLOWEN",
                label: "AGAN BORLOWEN (SS229)",
                homePort: "NEWLYN",
                flag: "GBR",
                imoNumber: null,
                licenceNumber: "25072",
                licenceValidTo: "2382-12-31T00:00:00"
              },
              faoArea: "FAO27",
              dateLanded: "2021-01-07",
              exportWeight: 12,
              numberOfSubmissions: 0
            }
          }]
        }]
      },
      conservation: {
        conservationReference: "UK Fisheries Policy",
        legislation: ["UK Fisheries Policy"],
        caughtInUKWaters: "Y",
        user_id: "Test",
        currentUri: "Test",
        nextUri: "Test"
      },
      transport: {
        vehicle: "directLanding",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      exportLocation: {
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      landingsEntryOption: LandingsEntryOptions.ManualEntry
    };

    const result = FrontEnd.toFrontEndCatchCert(backEndCc);

    expect(result).toStrictEqual(expected);
  });

  it('should return null when no details have been added', () => {
    const backEndCc: CatchCertificate = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "",
      exportData: undefined,
      draftData: {},
      documentUri: 'some document uri'
    }

    const result = FrontEnd.toFrontEndCatchCert(backEndCc);

    expect(result).toStrictEqual(null);
  });

});
