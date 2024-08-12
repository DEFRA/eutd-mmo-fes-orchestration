import * as Hapi from '@hapi/hapi';
import * as DocumentLegitimatelyOwned from '../helpers/withDocumentLegitimatelyOwned';
import VoidRoutes from './void-certificate';

import logger from '../logger';
import applicationConfig from '../applicationConfig';

describe('void routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    applicationConfig._disableAuth = true;
    const routes = await new VoidRoutes()
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('POST /v1/void-certificate', () => {
    const documentNumber = "GBR-2020-PS-1";

    const request: any = {
      method: 'POST',
      url: '/v1/void-certificate',
      headers: {
        documentnumber:documentNumber,
      },
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      payload: {
        documentVoid: documentNumber
      }
    };

    let mockWithDocumentLegitimatelyOwned;
    let mockLoggerError;

    beforeAll(() => {
      mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentLegitimatelyOwned, 'withDocumentLegitimatelyOwned');
      mockLoggerError = jest.spyOn(logger, 'error');
    });

    afterAll(() => {
      mockWithDocumentLegitimatelyOwned.mockRestore();
      mockLoggerError.mockRestore();
    })

    it('should return 200 if document ownership passes', async () => {
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(true);

      const response = await server.inject(request);

      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should return 500 if an error occurs', async () => {
      const error = new Error('error');

      mockWithDocumentLegitimatelyOwned.mockRejectedValue(error);

      const response = await server.inject(request);

      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith(`[VOIDING-CERTIFICATE][ERROR][${error.stack}]`);
      expect(response.statusCode).toBe(500);
    });

    it('should return 400 if documentNumber is not given in payload', async () => {
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(true);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/void-certificate',
        headers: {
          documentNumber,
        },
        app: {
          claims: {
            app: 'Bob'
          }
        },
        payload: {}
      });

      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 302 if documentNumber is not given in payload (acceptsHtml)', async () => {
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(true);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/void-certificate',
        headers: {
          documentNumber,
          accept: "text/html"
        },
        app: {
          claims: {
            app: 'Bob'
          }
        },
        payload:{}
      });

      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(302);
    });

  });

});
