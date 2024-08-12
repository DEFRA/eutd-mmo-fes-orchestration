import * as test from 'tape';
import * as Hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import Services from '../../src/services/commodity.service';
import CommodityController from '../../src/controllers/commodity.controller';

test('CommodityController.searchCC - Should call CommodityService.searchCC and respond with the result', async (t) => {
  try {
    const mockReq = mock(Hapi.Request);
    mockReq.headers = {};
    const CommodityServiceStub = sinon.stub(Services, 'searchCC').resolves('foo');
    const mockResponse = sinon.spy();
    await CommodityController.searchCC(mockReq, mockResponse);
    t.assert(mockResponse.called);
    t.equals(mockResponse.getCall(0).args[0], 'foo');
    CommodityServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CommodityController.searchCC - Should call CommodityService.searchCC and redirect the user', async (t) => {
  try {
    const mockReq = mock(Hapi.Request);
    mockReq.headers = {
      accept: 'text/html'
    };
    mockReq.payload = {
      redirect: '/foobar'
    };
    const CommodityServiceStub = sinon.stub(Services, 'searchCC').resolves('foo');
    const mockResponse = { redirect: sinon.spy() };
    await CommodityController.searchCC(mockReq, mockResponse as any);
    t.assert(mockResponse.redirect.called);
    t.equals(mockResponse.redirect.getCall(0).args[0], mockReq.payload.redirect);
    CommodityServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});