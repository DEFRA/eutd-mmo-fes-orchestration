import * as Hapi from '@hapi/hapi';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import DocumentPdfRoutes from './document-pdf';
import DocumentController from '../controllers/document.controller';
import logger from '../logger';

const createServerInstance = async () => {
  const server = Hapi.server();
  await server.register(require("@hapi/basic"));
  await server.register(require("hapi-auth-jwt2"));

  const fesApiValidate = async (
    _request: Hapi.Request,
    _username: string,
    _password: string
  ) => {
    const isValid = true;
    const credentials = { id: 'fesApi', name: 'fesApi' };
    return {isValid, credentials};
  };

  server.auth.strategy("fesApi", "basic", {
    validate: fesApiValidate,
  });

  server.auth.strategy("jwt", "jwt", {
    verify: (_decoded, _req) => {
      return { isValid: true };
    },
  });

  server.auth.default("jwt");

  return server;
};

describe('Document pdf routes', () => {

  let server;

  beforeAll(async () => {
    server = await createServerInstance();
    const routes = await new DocumentPdfRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('GET /v1/document/pdf', () => {

    const request: any = {
      method: 'GET',
      url: '/v1/document/pdf',
      app: {
        claims: {
          sub: 'Bob',
          contactId: 'contactBob'
        }
      },
      headers: {
        documentnumber: 'DOCUMENT123',
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz"
      }
    };

    const data = {
      documentUri: '_77440e30-4c98-4e7f-b5ab-b041b748b36d.pdf'
    };

    let mockGetDocumentPdf;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeEach(() => {
      mockGetDocumentPdf = jest.spyOn(DocumentController, 'getDocumentPdf');
      mockGetDocumentPdf.mockResolvedValue(data);

      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });

      mockLogError = jest.spyOn(logger, 'error');
    });

    afterEach(() => {
      mockGetDocumentPdf.mockRestore();
      mockValidateDocumentOwnership.mockRestore();
      mockLogError.mockRestore();
    })

    it('will return 200 if there is summary data', async () => {
      const response = await server.inject(request);
      expect(mockGetDocumentPdf).toHaveBeenCalledWith('DOCUMENT123', 'Bob', 'contactBob')
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(data);
    });

    it('will return 200 if a document summary can not be found', async () => {
      mockGetDocumentPdf.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toBeNull();
    });

    it('will return 403 if the user does not own the document', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it('will log and return 500 if there the get summary data function throws an error', async () => {
      const e = new Error('an error occurred');
      mockGetDocumentPdf.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(`[GET-DOCUMENT-PDF][ERROR][${e.stack || e}]`);
    });

    it('will log and return 500 if there the get summary data function throws a text error', async () => {
      mockGetDocumentPdf.mockRejectedValue('an error occurred');

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(`[GET-DOCUMENT-PDF][ERROR][an error occurred]`);
    });

  });

});
