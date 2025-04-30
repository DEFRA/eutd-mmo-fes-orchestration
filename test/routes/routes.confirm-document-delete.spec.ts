import ConfirmDocumentDeleteRoutes from '../../src/routes/confirm-document-delete';
import { serverTest } from '../testHelpers';

serverTest('[POST] /v1/confirm-document-delete should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/confirm-document-delete',
      payload: {
        documentDelete: 'Yes',
      },
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  });

  serverTest('[POST] /v1/confirm-document-delete with no payload should return 400', async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/confirm-document-delete',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  });

describe('ConfirmDocumentDeleteRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new ConfirmDocumentDeleteRoutes().register;
    expect(typeof register).toBe("function");
  });
});