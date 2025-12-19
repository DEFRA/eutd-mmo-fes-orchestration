import * as Hapi from "@hapi/hapi";
import CertificateController from './certificate.controller';
import SummaryErrors from '../services/summaryErrors.service';
import * as CatchCertificate from '../persistence/services/catchCert';
import * as BackEnd from '../persistence/schema/catchCert';
import { ValidationFailure, CertificateSummary } from '../persistence/schema/frontEndModels/payload';

import logger from '../logger';

const documentNumber = 'GBR-X-CC-1';
const contactId = 'contactBob';

const req: any = {
  app: { claims: { sub: 'Bob', contactId } },
  headers: {},
  params: {
    journey: 'catchCertificate'
  },
  payload: {}
}

const h = {
  response: () => {
    function code(httpCode) {
      return httpCode;
    }

    return { code: code }
  },
  redirect: () => { }
} as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

const backEndCc: BackEnd.CatchCertificate = {
  createdAt: "2021-01-05T16:59:29.190Z",
  createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
  createdByEmail: "foo@foo.com",
  status: "LOCKED",
  documentNumber: "GBR-X-CC-1",
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
    transportations: [{
      id: 0,
      vehicle: "truck"
    }],
    landingsEntryOption: BackEnd.LandingsEntryOptions.ManualEntry,
    exportedFrom: "United Kingdom",
    exportedTo: {
      officialCountryName: "SPAIN",
      isoCodeAlpha2: "A1",
      isoCodeAlpha3: "A3",
      isoNumericCode: "SP"
    },
    pointOfDestination: "Seville Port"
  },
  draftData: {},
  documentUri: 'some document uri',
}

const backEndCcAdmin: BackEnd.CatchCertificate = {
  createdAt: "2021-01-05T16:59:29.190Z",
  createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
  createdByEmail: "foo@foo.com",
  status: "LOCKED",
  documentNumber: "GBR-X-CC-1",
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
      commodityCodeDescription: "some description",
      state: {
        code: "FRE",
        name: "Fresh",
        admin: "ADMIN"
      },
      presentation: {
        code: "WHL",
        name: "Whole",
        admin: "ADMIN"
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
    transportations: [{
      id: 0,
      vehicle: "truck"
    }],
    landingsEntryOption: BackEnd.LandingsEntryOptions.ManualEntry,
    exportedFrom: "United Kingdom",
    exportedTo: {
      officialCountryName: "SPAIN",
      isoCodeAlpha2: "A1",
      isoCodeAlpha3: "A3",
      isoNumericCode: "SP"
    },
    pointOfDestination: "Seville Port"
  },
  draftData: {},
  documentUri: 'some document uri',
}

const summaryErrors: ValidationFailure[] = [{
  state: "ALI",
  species: "LBE",
  presentation: "WHL",
  date: new Date("2020-11-23T00:00:00.000Z"),
  vessel: "WIRON 5",
  rules: [
    "noDataSubmitted"
  ]
}];

describe('Certificate Controller', () => {

  let mockError;
  let mockInfo;
  let mockGetDocument;
  let mockGetSummaryErrors;

  beforeEach(() => {
    mockError = jest.spyOn(logger, 'error');
    mockInfo = jest.spyOn(logger, 'info');
    mockGetDocument = jest.spyOn(CatchCertificate, 'getDocument');
    mockGetSummaryErrors = jest.spyOn(SummaryErrors, 'get')
  });

  afterEach(() => {
    mockError.mockRestore();
    mockInfo.mockRestore();
    mockGetDocument.mockRestore();
    mockGetSummaryErrors.mockRestore();
  });

  describe('getSummaryCertificate', () => {

    it('will return the summary data for a catch certificate', async () => {
      mockGetDocument.mockResolvedValue(backEndCc);
      mockGetSummaryErrors.mockResolvedValue(summaryErrors);

      const expected: CertificateSummary = {
        documentNumber: "GBR-X-CC-1",
        status: 'LOCKED',
        startedAt: "2021-01-05T16:59:29.190Z",
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
          exportedTo: {
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP",
            officialCountryName: "SPAIN",
          },
          vehicle: "directLanding",
        },
        transportations: [{
          id: "0",
          vehicle: "truck"
        }],
        exportLocation: {
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          },
          pointOfDestination: "Seville Port"
        },
        validationErrors: [{
          state: "ALI",
          species: "LBE",
          presentation: "WHL",
          date: new Date("2020-11-23T00:00:00.000Z"),
          vessel: "WIRON 5",
          rules: [
            "noDataSubmitted"
          ]
        }],
        landingsEntryOption: BackEnd.LandingsEntryOptions.ManualEntry
      };

      const result = await CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).toHaveBeenCalledWith('Bob', documentNumber, contactId);
      expect(result).toStrictEqual(expected);
    });

    it('will return the summary data for a catch certificate with admin values', async () => {
      mockGetDocument.mockResolvedValue(backEndCcAdmin);
      mockGetSummaryErrors.mockResolvedValue(summaryErrors);

      const expected: CertificateSummary = {
        documentNumber: "GBR-X-CC-1",
        status: 'LOCKED',
        startedAt: "2021-01-05T16:59:29.190Z",
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
              commodityCodeDescription: "some description",
              presentation: {
                code: "WHL",
                label: "Whole",
                admin: "ADMIN"
              },
              state: {
                code: "FRE",
                label: "Fresh",
                admin: "ADMIN"
              },
              species: {
                code: "COD",
                label: "Atlantic cod (COD)",
                admin: "ADMIN SPECIES"
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
          exportedTo: {
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP",
            officialCountryName: "SPAIN",
          },
          vehicle: "directLanding",
        },
        transportations: [{
          id: "0",
          vehicle: "truck"
        }],
        exportLocation: {
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          },
          pointOfDestination: "Seville Port"
        },
        validationErrors: [{
          state: "ALI",
          species: "LBE",
          presentation: "WHL",
          date: new Date("2020-11-23T00:00:00.000Z"),
          vessel: "WIRON 5",
          rules: [
            "noDataSubmitted"
          ]
        }],
        landingsEntryOption: BackEnd.LandingsEntryOptions.ManualEntry
      };

      const result = await CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).toHaveBeenCalledWith('Bob', documentNumber, contactId);
      expect(result).toStrictEqual(expected);
    });

    it('will return null if document can not be found', async () => {
      mockGetDocument.mockResolvedValue(null);
      mockGetSummaryErrors.mockResolvedValue(null);

      await expect(CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber)).resolves.toEqual(null)

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).not.toHaveBeenCalledWith(documentNumber);
      expect(mockInfo).toHaveBeenCalledWith('[GET-SUMMARY-CERTIFICATE][GET-DOCUMENT][NOT-FOUND]');
    });

    it('will return no validation errors if summary errors can not be found', async () => {
      mockGetDocument.mockResolvedValue(backEndCc);
      mockGetSummaryErrors.mockResolvedValue(null);

      const expected: CertificateSummary = {
        documentNumber: "GBR-X-CC-1",
        status: 'LOCKED',
        startedAt: "2021-01-05T16:59:29.190Z",
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
          exportedTo: {
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP",
            officialCountryName: "SPAIN",
          },
          vehicle: "directLanding",
        },
        transportations: [{
          id: "0",
          vehicle: "truck"
        }],
        exportLocation: {
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          },
          pointOfDestination: "Seville Port"
        },
        validationErrors: null,
        landingsEntryOption: BackEnd.LandingsEntryOptions.ManualEntry
      };

      const result = await CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).toHaveBeenCalledWith('Bob', documentNumber, contactId);
      expect(result).toStrictEqual(expected);
    });

    it('will catch any errors thrown when getting document', async () => {
      const error = new Error('error');
      mockGetDocument.mockRejectedValue(error);
      mockGetSummaryErrors.mockResolvedValue(summaryErrors);

      await expect(CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber)).rejects.toThrow('error');

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).not.toHaveBeenCalledWith(documentNumber);
      expect(mockError).toHaveBeenCalledWith(`[GET-SUMMARY-CERTIFICATE][GET-DOCUMENT][ERROR][${error}]`);
    });

    it('will catch any errors thrown when getting certificate errors', async () => {
      const error = new Error('error');
      mockGetDocument.mockResolvedValue(backEndCc);
      mockGetSummaryErrors.mockRejectedValue(error);

      await expect(CertificateController.getSummaryCertificate(req, h, 'Bob', documentNumber)).rejects.toThrow('error');

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockGetSummaryErrors).toHaveBeenCalledWith('Bob', documentNumber, contactId);
      expect(mockError).toHaveBeenCalledWith(`[GET-SUMMARY-CERTIFICATE][GET-SUMMARY-ERRORS][ERROR][${error}]`);
    });

  });

});
