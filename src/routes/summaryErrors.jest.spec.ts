import * as Hapi from '@hapi/hapi';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import SummaryErrorsRoutes from './summaryErrors';
import SummaryErrorsService from '../services/summaryErrors.service';
import logger from '../logger';

describe('Summary errors routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new SummaryErrorsRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('GET /v1/summary-errors', () => {

    const request: any = {
      method: 'GET',
      url: '/v1/summary-errors',
      app: {
        claims: {
          sub: 'Bob',
          contactId: 'contactBob'
        }
      },
      headers: {
        documentnumber: 'DOCUMENT123'
      }
    };

    let mockGetSummaryErrors;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeAll(() => {
      mockGetSummaryErrors = jest.spyOn(SummaryErrorsService, 'get');
      mockLogError = jest.spyOn(logger, 'error');
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });
    });

    it('will return 204 if there is no errors', async () => {
        mockGetSummaryErrors.mockResolvedValue(null);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(204);
        expect(response.result).toBeNull();
    });

    it('will return 200 if there all an error', async () => {
     mockGetSummaryErrors.mockResolvedValue('error');

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it('will return 403 if the user does not own the document', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it('will log and return 500 if there the get function throws an error', async () => {
      const e = new Error('an error occurred')

      mockGetSummaryErrors.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(`[GET-SUMMARY-ERRORS][ERROR][${e.stack || e}]`);
    });

    it('will call SummaryErrorService get with document number', async () => {
      mockGetSummaryErrors.mockResolvedValue(null);

      await server.inject(request);

      expect(mockGetSummaryErrors).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
    });

  });

});
