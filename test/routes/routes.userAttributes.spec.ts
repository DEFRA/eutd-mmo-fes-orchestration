import { serverTest } from '../testHelpers';

serverTest('[GET] /v1/userAttributes 200 - no user attribute', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/userAttributes',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  t.equals(JSON.parse(response.payload).length, 0, 'Empty payload');
  
});

serverTest('[POST] /v1/userAttributes 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/userAttributes',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      key: 'foo',
      value: 'boo'
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[GET] /v1/userAttributes 200 - with user attribute', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/userAttributes',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  t.equals(JSON.parse(response.payload).length, 1, 'Has one user attribute');
});

serverTest('[POST] /v1/userAttributes 403', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/userAttributes',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      key: 'language',
      value: 'fr_FR'
    }
  });
  t.equals(response.statusCode, 403, 'Status code is 403');
});