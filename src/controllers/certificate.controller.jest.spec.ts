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
  userReference: "user-ref-123",
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

  let mockError: jest.SpyInstance;
  let mockInfo: jest.SpyInstance;
  let mockGetDocument: jest.SpyInstance;
  let mockGetSummaryErrors: jest.SpyInstance;

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
        userReference: 'user-ref-123',
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
          exportDate: ""
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
        userReference: "",
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
          exportDate: ""
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
        userReference: "user-ref-123",
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
          exportDate: ""
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

  describe('getEuDataIntegrationStatus', () => {

    let mockGetPSDocument: jest.SpyInstance;
    let mockGetNMDDocument: jest.SpyInstance;
    let mockGetServiceNameFromDocumentNumber: jest.SpyInstance;

    beforeEach(() => {
      mockGetPSDocument = jest.spyOn(require('../persistence/services/processingStatement'), 'getDocument');
      mockGetNMDDocument = jest.spyOn(require('../persistence/services/storageDoc'), 'getDocument');
      mockGetServiceNameFromDocumentNumber = jest.spyOn(require('../services/documentNumber.service').default, 'getServiceNameFromDocumentNumber');
    });

    afterEach(() => {
      mockGetPSDocument.mockRestore();
      mockGetNMDDocument.mockRestore();
      mockGetServiceNameFromDocumentNumber.mockRestore();
    });

    it('will return null if the document cannot be found', async () => {
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(null);

      const result = await CertificateController.getEuDataIntegrationStatus(req, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toBeNull();
      expect(mockInfo).toHaveBeenCalledWith('[GET-EU-DATA-INTEGRATION-STATUS][GBR-X-CC-1][NOT-FOUND]');
    });

    it('will return null if the document has no catchSubmission', async () => {
      const docWithoutEuRef = { ...backEndCc };
      delete docWithoutEuRef.catchSubmission;
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(docWithoutEuRef);

      const result = await CertificateController.getEuDataIntegrationStatus(req, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toBeNull();
      expect(mockInfo).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][NOT-FOUND]`);
    });

    it('will return null if catchSubmission status does not match params status', async () => {
      const docWithEuRef: BackEnd.CatchCertificate = {
        ...backEndCc,
        catchSubmission: { status: 'SUCCESS', reference: 'EU-CATCH-2024-12345' }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(docWithEuRef);

      const reqWithDifferentStatus = {
        ...req,
        params: { status: 'FAILURE' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithDifferentStatus, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toBeNull();
      expect(mockInfo).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][NOT-FOUND]`);
    });

    it('will return catchSubmission when available and status matches', async () => {
      const docWithEuRef: BackEnd.CatchCertificate = {
        ...backEndCc,
        catchSubmission: { status: 'SUCCESS', reference: 'EU-CATCH-2024-12345' }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(docWithEuRef);

      const reqWithMatchingStatus = {
        ...req,
        params: { status: 'SUCCESS' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithMatchingStatus, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toEqual({
        reference: 'EU-CATCH-2024-12345',
        status: "SUCCESS"
      });
    });

    it('will return catchSubmission with FAILURE status when status matches', async () => {
      const docWithFailure: BackEnd.CatchCertificate = {
        ...backEndCc,
        catchSubmission: {
          status: 'FAILURE',
          faultCode: 'S:Client',
          faultString: 'Validation error',
          validationErrors: [{
            id: 'ERR-001',
            message: 'Invalid field',
            field: '/field/path'
          }]
        }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(docWithFailure);

      const reqWithFailureStatus = {
        ...req,
        params: { status: 'FAILURE' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithFailureStatus, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toEqual({
        status: 'FAILURE',
        faultCode: 'S:Client',
        faultString: 'Validation error',
        validationErrors: [{
          id: 'ERR-001',
          message: 'Invalid field',
          field: '/field/path'
        }]
      });
    });

    it('will return catchSubmission with IN_PROGRESS status when status matches', async () => {
      const docWithInProgress: BackEnd.CatchCertificate = {
        ...backEndCc,
        catchSubmission: {
          status: 'IN_PROGRESS',
          reasonInformation: 'Processing certificate'
        }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockResolvedValue(docWithInProgress);

      const reqWithInProgressStatus = {
        ...req,
        params: { status: 'IN_PROGRESS' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithInProgressStatus, 'Bob', documentNumber);

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(result).toEqual({
        status: 'IN_PROGRESS',
        reasonInformation: 'Processing certificate'
      });
    });

    it('will catch and log errors when getting the document', async () => {
      const error = new Error('Database error');
      mockGetServiceNameFromDocumentNumber.mockReturnValue('CC');
      mockGetDocument.mockRejectedValue(error);

      await expect(CertificateController.getEuDataIntegrationStatus(req, 'Bob', documentNumber)).rejects.toThrow('Database error');

      expect(mockGetDocument).toHaveBeenCalledWith(documentNumber, 'Bob', contactId);
      expect(mockError).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][GBR-X-CC-1][ERROR][${error}]`);
    });

    it('will handle PS document type and return catchSubmission when available', async () => {
      const psDocumentNumber = 'GBR-X-PS-1';
      const docWithEuRef = {
        documentNumber: psDocumentNumber,
        catchSubmission: { status: 'SUCCESS', reference: 'EU-PS-2024-12345' }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('PS');
      mockGetPSDocument.mockResolvedValue(docWithEuRef);

      const reqWithMatchingStatus = {
        ...req,
        params: { status: 'SUCCESS' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithMatchingStatus, 'Bob', psDocumentNumber);

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(psDocumentNumber);
      expect(mockGetPSDocument).toHaveBeenCalledWith(psDocumentNumber, 'Bob', contactId);
      expect(result).toEqual({
        reference: 'EU-PS-2024-12345',
        status: 'SUCCESS'
      });
    });

    it('will handle PS document type and return null when document not found', async () => {
      const psDocumentNumber = 'GBR-X-PS-1';
      mockGetServiceNameFromDocumentNumber.mockReturnValue('PS');
      mockGetPSDocument.mockResolvedValue(null);

      const result = await CertificateController.getEuDataIntegrationStatus(req, 'Bob', psDocumentNumber);

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(psDocumentNumber);
      expect(mockGetPSDocument).toHaveBeenCalledWith(psDocumentNumber, 'Bob', contactId);
      expect(result).toBeNull();
      expect(mockInfo).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${psDocumentNumber}][NOT-FOUND]`);
    });

    it('will handle PS document type and catch errors', async () => {
      const psDocumentNumber = 'GBR-X-PS-1';
      const error = new Error('PS Database error');
      mockGetServiceNameFromDocumentNumber.mockReturnValue('PS');
      mockGetPSDocument.mockRejectedValue(error);

      await expect(CertificateController.getEuDataIntegrationStatus(req, 'Bob', psDocumentNumber)).rejects.toThrow('PS Database error');

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(psDocumentNumber);
      expect(mockGetPSDocument).toHaveBeenCalledWith(psDocumentNumber, 'Bob', contactId);
      expect(mockError).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${psDocumentNumber}][ERROR][${error}]`);
    });

    it('will handle SD document type and return catchSubmission when available', async () => {
      const sdDocumentNumber = 'GBR-X-SD-1';
      const docWithEuRef = {
        documentNumber: sdDocumentNumber,
        catchSubmission: { status: 'SUCCESS', reference: 'EU-SD-2024-12345' }
      };
      mockGetServiceNameFromDocumentNumber.mockReturnValue('SD');
      mockGetNMDDocument.mockResolvedValue(docWithEuRef);

      const reqWithMatchingStatus = {
        ...req,
        params: { status: 'SUCCESS' }
      };

      const result = await CertificateController.getEuDataIntegrationStatus(reqWithMatchingStatus, 'Bob', sdDocumentNumber);

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(sdDocumentNumber);
      expect(mockGetNMDDocument).toHaveBeenCalledWith(sdDocumentNumber, 'Bob', contactId);
      expect(result).toEqual({
        reference: 'EU-SD-2024-12345',
        status: 'SUCCESS'
      });
    });

    it('will handle SD document type and return null when document not found', async () => {
      const sdDocumentNumber = 'GBR-X-SD-1';
      mockGetServiceNameFromDocumentNumber.mockReturnValue('SD');
      mockGetNMDDocument.mockResolvedValue(null);

      const result = await CertificateController.getEuDataIntegrationStatus(req, 'Bob', sdDocumentNumber);

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(sdDocumentNumber);
      expect(mockGetNMDDocument).toHaveBeenCalledWith(sdDocumentNumber, 'Bob', contactId);
      expect(result).toBeNull();
      expect(mockInfo).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${sdDocumentNumber}][NOT-FOUND]`);
    });

    it('will handle SD document type and catch errors', async () => {
      const sdDocumentNumber = 'GBR-X-SD-1';
      const error = new Error('SD Database error');
      mockGetServiceNameFromDocumentNumber.mockReturnValue('SD');
      mockGetNMDDocument.mockRejectedValue(error);

      await expect(CertificateController.getEuDataIntegrationStatus(req, 'Bob', sdDocumentNumber)).rejects.toThrow('SD Database error');

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(sdDocumentNumber);
      expect(mockGetNMDDocument).toHaveBeenCalledWith(sdDocumentNumber, 'Bob', contactId);
      expect(mockError).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${sdDocumentNumber}][ERROR][${error}]`);
    });

    it('will log info for unsupported document type and return null', async () => {
      const unsupportedDocumentNumber = 'GBR-X-XX-1';
      mockGetServiceNameFromDocumentNumber.mockReturnValue('XX');

      const result = await CertificateController.getEuDataIntegrationStatus(req, 'Bob', unsupportedDocumentNumber);

      expect(mockGetServiceNameFromDocumentNumber).toHaveBeenCalledWith(unsupportedDocumentNumber);
      expect(mockInfo).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][${unsupportedDocumentNumber}][UNSUPPORTED-DOCUMENT-TYPE]`);
      expect(result).toBeNull();
    });

  });

});
