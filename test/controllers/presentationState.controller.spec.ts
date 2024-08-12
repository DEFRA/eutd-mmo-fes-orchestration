import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import Services from '../../src/services/presentationState.service';
import Controller from '../../src/controllers/presentationState.controller';

const getPsTest = (nonJs = false) =>
  test('PresentationStateController.getPS - parses speciesFaoCode from query and calls Service.getPS', async (t) => {
    try {
      const mockReq = mock(hapi.Request);
      mockReq.query = "speciesFaoCode=FAO_CODE";
      mockReq.headers = nonJs ? { accept: 'text/html' } : {};
      mockReq.payload = {
        redirect: 'redirectUri'
      };
      const mockRes = nonJs ? { redirect: sinon.fake() } : sinon.fake();
      const servicesStub = sinon.stub(Services, 'getPS').resolves('presentationState');
      await Controller.getPS(mockReq, mockRes);
      t.assert(servicesStub.called);
      t.deepEquals(servicesStub.getCall(0).args, ['FAO_CODE']);
      if (nonJs) {
        t.assert(mockRes.redirect.called);
        t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.payload.redirect]);
      } else {
        t.assert(mockRes.called);
        t.deepEquals(mockRes.getCall(0).args, ['presentationState']);
      }
      servicesStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });
  
getPsTest();
getPsTest(true);