import { serverTest } from '../testHelpers';


serverTest('[GET] / getPS / should return 200 status', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/presentation-state/search?speciesFaoCode=AGN',
    app: {
    claims: {
      sub: '123456789'
    }
  }

});
  t.equals(response.statusCode, 200, 'Status code is 200');
});
