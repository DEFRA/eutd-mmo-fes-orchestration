import * as test from 'tape';
import * as Hapi from 'hapi';
import { serverTest } from '../testHelpers';
import { mock } from 'ts-mockito';


import { redirectTo } from '../../src/helpers/redirectTo';

test('when redirect attribute is set in payload redirectTo should return redirect URI', t => {
  let mockReq: Hapi.Request = mock(Hapi.Request);
  mockReq.headers = {
    accept: 'text/html'
  };

  mockReq.payload = {
    redirect: '/add-landings'
  };

  //
  let redirectUri = redirectTo(mockReq);
  t.equal(redirectUri, '/add-landings');
  t.end();
});


test('when redirect attribute is NOT set in payload but header is set to accept html redirectTo should return null', t => {
  let mockReq: Hapi.Request = mock(Hapi.Request);
  mockReq.headers = {
    accept: 'text/html'
  };

  mockReq.payload = {};

  //
  let redirectUri = redirectTo(mockReq);
  t.equal(redirectUri, null);
  t.end();
});

test('when redirect attribute is NOT set in payload and header is NOT set to accept html redirectTo should return null', t => {
  let mockReq: Hapi.Request = mock(Hapi.Request);
  mockReq.headers = {};
  mockReq.payload = {};

  //
  let redirectUri = redirectTo(mockReq);
  t.equal(redirectUri, null);
  t.end();
});