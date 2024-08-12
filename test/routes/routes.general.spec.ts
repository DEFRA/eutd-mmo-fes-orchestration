import { serverTest } from '../testHelpers';


serverTest('[GET] / general / should return 200 status', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});
