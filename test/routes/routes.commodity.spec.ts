import { serverTest } from '../testHelpers';

describe('Commodity routes check', () => {
  serverTest('[GET] /v1/commodity/search should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/commodity/search',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  });
});
