import { CatchCertificate, LandingsEntryOptions } from "../catchCert";
import * as FrontEnd from "./catchCertificate"

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
