import ConservationService from '../../src/services/conservation.service';
import * as test from 'tape';
const sinon = require('sinon');
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as sessionManager from '../../src/helpers/sessionManager';

test('Conservation service - get conservation', async (t) => {
  let getConservationStub;
  let getCurrentSessionDataStub;
  try {
    const persistedConservation = {
      caughtInUKWaters: 'Y',
      legislation: ['UK Fisheries Policy'],
      conservationReference: 'UK Fisheries Policy'
    };
    getConservationStub = sinon.stub(CatchCertService, 'getConservation').resolves(persistedConservation);
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves({
      documentNumber: 'DOC-1',
      nextUri: '/next-uri',
      currentUri: '/current-uri'
    });

    const conservation: any = await ConservationService.getConservation({ user_id: 'USERID' }, 'DOC-1', undefined);

    t.assert(conservation);
    t.deepEquals(conservation.legislation, ['UK Fisheries Policy']);
    t.equals(conservation.conservationReference, 'UK Fisheries Policy', 'conservation reference is returned');
    t.equals(conservation.user_id, 'USERID', 'user id is injected into returned conservation');
    t.equals(conservation.nextUri, '/next-uri', 'nextUri is read from session data');
    t.equals(conservation.currentUri, '/current-uri', 'currentUri is read from session data');
    t.equals(getConservationStub.calledOnceWithExactly('USERID', 'DOC-1', undefined), true, 'persistence lookup called with expected args');
    t.equals(getCurrentSessionDataStub.calledOnceWithExactly('USERID', 'DOC-1', undefined), true, 'session lookup called with expected args');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (getConservationStub) getConservationStub.restore();
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
  }
});

test('Conservation service - Add conservation', async (t) => {
  let withUserSessionDataStoredStub;
  let upsertConservationStub;
  try {
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_userId, _sessionData, _contactId, nextAction) => nextAction());
    upsertConservationStub = sinon.stub(CatchCertService, 'upsertConservation').resolves();

    const result: any = await ConservationService.addConservation({
      ...mockConservation1,
      caughtInEUWaters: 'Y',
      caughtInOtherWaters: 'Y',
      otherWaters: 'foo',
      currentUri: '/current',
      nextUri: '/next'
    }, 'DOC-1', undefined);

    t.deepEquals(result, {
      user_id: 'USERID',
      caughtInUKWaters: 'Y',
      caughtInEUWaters: 'Y',
      caughtInOtherWaters: 'Y',
      otherWaters: 'foo',
      currentUri: '/current',
      nextUri: '/next',
      legislation: [ 'UK Fisheries Policy', 'Common Fisheries Policy', 'foo' ],
      conservationReference: 'UK Fisheries Policy, Common Fisheries Policy, foo'
    });
    t.equals(withUserSessionDataStoredStub.calledOnce, true, 'session wrapper called');
    t.deepEquals(withUserSessionDataStoredStub.firstCall.args[1], {
      documentNumber: 'DOC-1',
      nextUri: '/next',
      currentUri: '/current'
    }, 'session data passed to wrapper');
    t.equals(upsertConservationStub.calledOnce, true, 'conservation persistence upsert called');
    t.equals(upsertConservationStub.firstCall.args[0], 'USERID', 'upsert called with user principal');
    t.equals(upsertConservationStub.firstCall.args[2], 'DOC-1', 'upsert called with document number');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (upsertConservationStub) upsertConservationStub.restore();
  }
});

test('Conservation service - Add conservation nothing caught', async (t) => {
  let withUserSessionDataStoredStub;
  let upsertConservationStub;
  try {
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_userId, _sessionData, _contactId, nextAction) => nextAction());
    upsertConservationStub = sinon.stub(CatchCertService, 'upsertConservation').resolves();

    const result: any = await ConservationService.addConservation({
      ...mockConservation1,
      caughtInUKWaters: false,
      caughtInEUWaters: false,
      caughtInOtherWaters: false,
      otherWaters: 'foo'
    }, 'DOC-2', undefined);

    t.deepEquals(result, {
      user_id: 'USERID',
      legislation: [],
      conservationReference: ''
    });
    t.equals(result.caughtInUKWaters, undefined, 'caughtInUKWaters is removed when not truthy');
    t.equals(result.caughtInEUWaters, undefined, 'caughtInEUWaters is removed when not truthy');
    t.equals(result.caughtInOtherWaters, undefined, 'caughtInOtherWaters is removed when not truthy');
    t.equals(result.otherWaters, undefined, 'otherWaters is removed unless caughtInOtherWaters is Y');
    t.equals(upsertConservationStub.calledOnce, true, 'conservation persistence upsert called once');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (upsertConservationStub) upsertConservationStub.restore();
  }
});

const mockConservation1 = {
  "user_id": "USERID",
  "caughtInUKWaters": "Y"
};
