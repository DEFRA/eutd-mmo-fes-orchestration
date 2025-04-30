import DocumentRoutes from '../../src/routes/document';
import { serverTest } from '../testHelpers';

serverTest('[GET] /v1/documents?type=catchCertificate should return 200 as type in query param is correct', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/documents/2019/05?type=catchCertificate',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[GET] /v1/documents should return 404 as year and month are not provided as part of path params', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/documents/?type=foo',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 404, 'Status code is 404');
});


serverTest('[GET] /v1/documents should return 400 as type in query param not provided', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/documents/2019/05',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[GET] /v1/document should return 400 as service request param not provided', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/document',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[GET] /v1/document should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/document?service=catchCertificate',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  });

serverTest('[GET] /v1/document should return 400', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/document?service=wrongservicename',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

describe('DocumentRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new DocumentRoutes().register;
    expect(typeof register).toBe("function");
  });
});


