import GeneralRoutes from '../../src/routes/general';
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

describe('GeneralRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new GeneralRoutes().register;
    expect(typeof register).toBe("function");
  });
});
