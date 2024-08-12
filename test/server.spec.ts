import * as test from 'tape';
import  sinon from 'sinon';
import { Issuer } from 'openid-client';

import Server from '../src/server';
import logger from '../src/logger';
import applicationConfig from '../src/applicationConfig';

test('makes successful auth attempt', async(t) => {
  const serverSpy = sinon.spy(Server);
  const loggerSpy = sinon.spy(logger);

  applicationConfig._disableAuth = false;
  applicationConfig._maxAuthRetries = 3;
  
  Server.start();

  t.assert(serverSpy.setUpAuth.calledOnce);
  //can we check if discoverAuth() was called
  t.assert(loggerSpy.info.calledWith('Issuer discovering'));
  t.assert(loggerSpy.info.calledWith('Issuer discovered'));
});

test('makes limited number of auth retries', async(t) => {
  const serverSpy = sinon.spy(Server);
  const loggerSpy = sinon.spy(logger);

  applicationConfig._disableAuth = false;
  applicationConfig._maxAuthRetries = 3;
  
  Server.start();

  t.assert(serverSpy.setUpAuth.calledOnce);
  //can we check if discoverAuth() was called 3 times
  t.assert(loggerSpy.info.calledWith('Issuer discovering'));
  t.assert(loggerSpy.warn.calledWith('Issuer discovery timed out'));
  t.assert(loggerSpy.warn.calledWith('Issuer discovery timed out'));
  t.assert(loggerSpy.warn.calledWith('Issuer discovery timed out'));
  t.assert(loggerSpy.error.calledWith('Maximum number of authentication discovery attempts reached'));
  t.assert(serverSpy.setUpAuth.threw('Maximum number of authentication discovery attempts reached'));
});

test('failed auth attempts throw standard errs', async(t) => {
  const serverSpy = sinon.spy(Server);
  const loggerSpy = sinon.spy(logger);

  const issuerMock = sinon.stub(Issuer, 'discover').callsFake(function(){
    const err = {
      code: 'ERR_HTTP_REQUEST_TIMEOUT'
    };

    throw err;
  })

  applicationConfig._disableAuth = false;
  applicationConfig._maxAuthRetries = 3;
  
  Server.start();

  t.assert(serverSpy.setUpAuth.toHaveThrown);
  t.assert(loggerSpy.info.calledWith('Issuer discovering'));
  t.assert(issuerMock.calledOnce());
  t.assert(loggerSpy.error.calledWith('An unexpected error occurred during auth discovery - '));
  t.equals(serverSpy.setUpAuth.exceptions.length, 1);

});