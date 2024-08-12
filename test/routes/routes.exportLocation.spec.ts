import {serverTest} from '../testHelpers';

serverTest('[POST] /v1/export-location (United Kingdom) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/export-location',
    headers: {accept: 'application/json'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      exportedFrom: 'United Kingdom',
      exportedTo: 'SPAIN'
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});