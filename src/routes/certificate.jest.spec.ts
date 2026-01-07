import * as Hapi from '@hapi/hapi';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import CertificateRoutes from './certificate';
import CertificateController from '../controllers/certificate.controller';
import logger from '../logger';

import { CertificateSummary } from '../persistence/schema/frontEndModels/payload';
import { LandingsEntryOptions } from '../persistence/schema/catchCert';

describe('Certificates routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new CertificateRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('GET /v1/certificate', () => {

    const request: any = {
      method: 'GET',
      url: '/v1/certificate/catchCertificate',
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentnumber: 'DOCUMENT123'
      }
    };

    const document = {
      documentNumber: 'GBR-2020-CC-0E42C2DA5'
    };

    let mockSummaryCertificate: jest.SpyInstance;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockLogError: jest.SpyInstance;

    beforeAll(() => {
      mockSummaryCertificate = jest.spyOn(CertificateController, 'getSummaryCertificate');
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockLogError = jest.spyOn(logger, 'error');
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(document);
    });

    it('will return 404 if a document summary can not be found', async () => {
      mockSummaryCertificate.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(mockSummaryCertificate).toHaveBeenCalled();
      expect(response.statusCode).toBe(404);
      expect(response.result).toBeNull();
    });

    it('will return 200 if there is summary data', async () => {
      const summaryData: CertificateSummary = {
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
            townCity: 'Aberdeen',
            postcode: 'AB1 2XX',
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
                label: "Whole"
              },
              state: {
                code: "FRE",
                label: "Fresh"
              },
              species: {
                code: "COD",
                label: "Atlantic cod (COD)"
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
        transportations: [{
          id: "0",
          vehicle: "directLanding"
        }],
        exportLocation: {
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
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
        landingsEntryOption: LandingsEntryOptions.ManualEntry
      }

      mockSummaryCertificate.mockResolvedValue(summaryData);

      const response = await server.inject(request);

      expect(mockSummaryCertificate).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('will return 403 if the user does not own the document', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(mockSummaryCertificate).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it('will log and return 500 if there the get summary data function throws an error', async () => {
      const e = new Error('an error occurred')

      mockSummaryCertificate.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockSummaryCertificate).toHaveBeenCalled();
      expect(mockLogError).toHaveBeenCalledWith(`[GET-CERTIFICATE-SUMMARY][ERROR][${e.stack || e}]`);
    });

  });

  describe('GET /v1/certificate/eu-data-integration/{status}', () => {

    const request: any = {
      method: 'GET',
      url: '/v1/certificate/eu-data-integration/SUCCESS',
      app: {
        claims: {
          sub: 'Bob',
          contactId: 'contactBob'
        }
      },
      headers: {
        documentnumber: 'GBR-2020-CC-0E42C2DA5'
      }
    };

    let mockGetEuDataIntegrationStatus: jest.SpyInstance;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockLogError: jest.SpyInstance;

    beforeAll(() => {
      mockGetEuDataIntegrationStatus = jest.spyOn(CertificateController, 'getEuDataIntegrationStatus');
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockLogError = jest.spyOn(logger, 'error');
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue({
        documentNumber: 'GBR-2020-CC-0E42C2DA5'
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('will return 403 if EU CATCH reference data cannot be found', async () => {
      mockGetEuDataIntegrationStatus.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(mockGetEuDataIntegrationStatus).toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it('will return 200 with EU CATCH reference number', async () => {
      const euCatchData = {
        reference: 'EU-CATCH-2024-12345'
      };

      mockGetEuDataIntegrationStatus.mockResolvedValue(euCatchData);

      const response = await server.inject(request);

      expect(mockGetEuDataIntegrationStatus).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(euCatchData);
    });

    it('will return 403 if the user does not own the document', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(mockGetEuDataIntegrationStatus).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it('will log and return 500 if there is an error retrieving EU integration data', async () => {
      const e = new Error('Database connection failed');

      mockGetEuDataIntegrationStatus.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockGetEuDataIntegrationStatus).toHaveBeenCalled();
      expect(mockLogError).toHaveBeenCalledWith(`[GET-EU-DATA-INTEGRATION-STATUS][ERROR][${e.stack || e}]`);
    });

  });

});
