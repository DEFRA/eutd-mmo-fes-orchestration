import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import Controller from '../../src/controllers/transport.controller';
import Services from "../../src/services/transport.service";
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const transportPayload = {
  truckCmrUri: 'truckCmrUri',
  planeDetailsUri: 'planeDetailsUri',
  trainDetailsUri: 'trainDetailsUri',
  containerVesselDetailsUri: 'containerVesselDetailsUri',
  summaryUri: 'summaryUri',
  truckDetailsUri: 'truckDetailsUri'
}

const callsFunctionWithSaveAsDraft = (functionName, callsFunc, func ) =>
  test(`TransportController.${functionName} - calls ${callsFunc} with saveAsDraft true`, async (t) => {
    try {
      const controllerStub = sinon.stub(Controller, `${callsFunc}`).resolves(true);
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = {}
      const mockRes = sinon.fake();
      await func(mockReq, mockRes);
      t.deepEquals(controllerStub.getCall(0).args, [mockReq, mockRes, true]);
      controllerStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });


const commonTransportTest = (controllerFn, description, vehicle, nextUri, saveAsDraft = false, nonJs = false, cmr = 'true') =>
  test(description, async(t) => {
    try {
      const serviceStub = sinon.stub(Services, 'addTransport').resolves('transport');
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.payload = {
        dashboardUri: 'dashboardUri',
        currentUri: 'currentUri',
        ...transportPayload,
        vehicle,
        nextUri,
        cmr
      }
      mockReq.headers = nonJs ? { accept: 'text/html' } : {};
      const mockRes = nonJs ? { redirect: sinon.fake() } : sinon.fake();
      await controllerFn(mockReq, mockRes, saveAsDraft);

      t.deepEquals(serviceStub.getCall(0).args, [{ ...mockReq.payload, user_id: USER_ID }]);
      t.assert(historyStub.called);
      if (nonJs) {
        if (saveAsDraft) {
          t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.payload.dashboardUri]);
        } else {
          t.deepEquals(mockRes.redirect.getCall(0).args, [nextUri]);
        }
      } else {
        t.deepEquals(mockRes.getCall(0).args, ['transport']);
      }

      historyStub.restore();
      serviceStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details for truck',
  'truck',
  'truckCmrUri',
  false,
  true
);
commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details for plane',
  'plane',
  'planeDetailsUri',
  false,
  true
);

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details for train',
  'train',
  'trainDetailsUri',
  false,
  true
);

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details for containerVessel',
  'containerVessel',
  'containerVesselDetailsUri',
  false,
  true
);

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details for directLanding',
  'directLanding',
  'summaryUri',
  false,
  true
);

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should save as draft',
  'truck',
  'truckCmrUri',
  true,
  true
);

commonTransportTest(
  Controller.addTransport,
  'TransportController.addTransport - Should add transport details with js',
  'truck',
  'truckCmrUri'
);

commonTransportTest(
  Controller.addTransportDetails,
  'TransportController.addTransportDetails - Should add transport details with js',
  'truck',
  'truckCmrUri'
);

commonTransportTest(
  Controller.addTransportDetails,
  'TransportController.addTransportDetails - Should add transport details non js',
  'truck',
  'truckCmrUri',
  false,
  true
);

commonTransportTest(
  Controller.addTransportDetails,
  'TransportController.addTransportDetails - Should save as draft',
  'truck',
  'truckCmrUri',
  true,
  true
);

commonTransportTest(
  Controller.addTruckCMR,
  'TransportController.addTruckCMR - Should add truck details with js',
  'truck',
  'truckCmrUri'
);

commonTransportTest(
  Controller.addTruckCMR,
  'TransportController.addTruckCMR - Should get nextUri as summaryUri if cmr === true',
  'truck',
  'summaryUri',
  false,
  true
);

commonTransportTest(
  Controller.addTruckCMR,
  'TransportController.addTruckCMR - Should get nextUri as truckDetailsUri if cmr === false',
  'truck',
  'truckDetailsUri',
  false,
  true,
  'false'
);

commonTransportTest(
  Controller.addTruckCMR,
  'TransportController.addTruckCMR - Should save as draft',
  'truck',
  'truckCmrUri',
  true,
  true
);

test('TransportController.getTransportDetails - Should get transport details for a user journey', async (t) => {
  try {
    const mockReq = mock(hapi.Request);
    mockReq.app = {
      claims: {
        sub: USER_ID
      }
    };
    mockReq.payload = {
      dashboardUri: 'dashboardUri',
      currentUri: 'currentUri',
    };
    mockReq.params = {
      journey: 'catchCertificate'
    };
    const mockRes = sinon.fake();
    const serviceStub = sinon.stub(Services, 'getTransportDetails').resolves('transport_details');
    await Controller.getTransportDetails(mockReq, mockRes);

    t.deepEquals(serviceStub.getCall(0).args, [USER_ID, mockReq.params.journey]);
    t.deepEquals(mockRes.getCall(0).args, ['transport_details']);
    serviceStub.restore();
    t.end();
  } catch(e) {
    t.end(e);
  }
});

callsFunctionWithSaveAsDraft(
  'addTransportSaveAsDraft',
  'addTransport',
  Controller.addTransportSaveAsDraft
);
callsFunctionWithSaveAsDraft(
  'addTruckCMRSaveAsDraft',
  'addTruckCMR',
  Controller.addTruckCMRSaveAsDraft
);
callsFunctionWithSaveAsDraft(
  'addTransportDetailsSaveAsDraft',
  'addTransportDetails',
  Controller.addTransportDetailsSaveAsDraft
);