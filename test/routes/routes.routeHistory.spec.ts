import { serverTest } from '../testHelpers';
const _ = require("lodash");

serverTest('[GET] /v1/route-history should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/route-history',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] /v1/route-history should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/route-history/delete',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});