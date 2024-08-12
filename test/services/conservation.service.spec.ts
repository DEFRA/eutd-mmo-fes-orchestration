import { getRedisOptions } from '../../src/session_store/redis';
import { SessionStoreFactory } from '../../src/session_store/factory';
import ConservationService from '../../src/services/conservation.service';
import * as test from 'tape';
import logger from '../../src/logger';
const _ = require("lodash");
import { CONSERVATION_KEY } from '../../src/session_store/constants';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'catchCertificate/export-payload';

test('Conservation service - get conservation', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await sessionStore.writeAllFor('USERID', CONSERVATION_KEY, mockConservation1 as any);
    let conservation:any = await ConservationService.getConservation({ user_id: 'USERID' });
    t.deepEquals(conservation, mockConservation1);
    t.assert(conservation);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('Conservation service - Add conservation', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await ConservationService.addConservation({
      ...mockConservation1,
      caughtInEUWaters: 'Y',
      caughtInOtherWaters: 'Y',
      otherWaters: 'foo'
    });
    let conservation:any = await sessionStore.readAllFor('USERID', CONSERVATION_KEY);
    t.deepEquals(conservation, {
      user_id: 'USERID',
      caughtInUKWaters: 'Y',
      caughtInEUWaters: 'Y',
      caughtInOtherWaters: 'Y',
      otherWaters: 'foo',
      legislation: [ 'UK Fisheries Policy', 'Common Fisheries Policy', 'foo' ],
      conservationReference: 'UK Fisheries Policy, Common Fisheries Policy, foo'
    });
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('Conservation service - Add conservation nothing caught', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await ConservationService.addConservation({
      ...mockConservation1,
      caughtInUKWaters: false,
      caughtInEUWaters: false,
      caughtInOtherWaters: false,
      otherWaters: 'foo'
    });
    let conservation:any = await sessionStore.readAllFor('USERID', CONSERVATION_KEY);
    t.deepEquals(conservation, {
      user_id: 'USERID',
      legislation: [],
      conservationReference: ''
    });
    t.end();
  } catch (e) {
    t.end(e);
  }
});

const mockConservation1 = {
  "user_id": "USERID",
  "caughtInUKWaters": "Y"
};
