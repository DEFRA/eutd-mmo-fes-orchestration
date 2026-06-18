import { SessionStoreFactory } from '../../src/session_store/factory';
import { getRedisOptions } from '../../src/session_store/redis';

import Service from '../../src/services/transport.service';

import * as test from 'tape';

import logger from '../../src/logger';
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

test('Add transport', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});

    let transport = {
      journey: 'catchCertificate',
      vehicle: 'train',
      user_id: USER_ID
    };

    await Service.addTransport(transport);

    let catchCertificate: any = await sessionStore.readAllFor(USER_ID, 'catchCertificate');

    t.equals(catchCertificate.transport['vehicle'], transport['vehicle']);
    t.equals(catchCertificate.transport['user_id'], transport['user_id']);
    t.equals(!!catchCertificate, true);
    t.equals(typeof catchCertificate.transport, 'object', 'transport is an object');
    t.equals(catchCertificate.transport['journey'], transport['journey'], 'journey matches input');
    t.end();
  } catch (e) {
    logger.error(e);
  }
});

test('Add transport Details', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});

    let transport = {
      journey: 'catchCertificate',
      vehicle: 'train',
      user_id: USER_ID
    };

    await Service.addTransport(transport);

    let transportDetails = {
      journey: 'catchCertificate',
      departurePlace: 'North Shields',
      railwayBillNumber: "123456",
      vehicle: 'train',
      user_id: USER_ID
    };

    await Service.addTransport(transportDetails);

    let catchCertificate: any = await sessionStore.readAllFor(USER_ID, 'catchCertificate');

    t.equals(catchCertificate.transport['railwayBillNumber'], transportDetails['railwayBillNumber']);
    t.equals(catchCertificate.transport['user_id'], transportDetails['user_id']);
    t.equals(catchCertificate.transport['departurePlace'], transportDetails['departurePlace']);
    t.equals(catchCertificate.transport['vehicle'], 'train');

    t.equals(!!catchCertificate, true);
    t.equals(typeof catchCertificate.transport, 'object', 'transport is an object');
    t.ok(catchCertificate.transport['railwayBillNumber'], 'railwayBillNumber is truthy');
    t.end();
  } catch (e) {
    logger.error(e);
  }
});

test('Get transport Details', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});

    let transport = {
      journey: 'catchCertificate',
      departurePlace: 'North Shields',
      vehicle: 'train',
      user_id: USER_ID
    };

    await Service.addTransport(transport);

    let transportDetails = {
      journey: 'catchCertificate',
      railwayBillNumber: "123456",
      vehicle: 'train',
      user_id: USER_ID
    };

    await Service.addTransport(transportDetails);

    let savedTransport = await Service.getTransportDetails(USER_ID, 'catchCertificate');

    t.equals(savedTransport['railwayBillNumber'], transportDetails['railwayBillNumber']);
    t.equals(savedTransport['user_id'], transportDetails['user_id']);
    t.equals(savedTransport['departurePlace'], transport['departurePlace']);
    t.equals(savedTransport['vehicle'], 'train');
    t.equals(!!savedTransport, true);
    t.equals(typeof savedTransport, 'object', 'savedTransport is an object');
    t.ok(Object.keys(savedTransport).length > 0, 'savedTransport has properties');
    t.end();

  } catch (e) {
    logger.error(e);
  }
});