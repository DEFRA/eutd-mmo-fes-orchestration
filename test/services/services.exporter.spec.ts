import { SessionStoreFactory } from '../../src/session_store/factory';
import { getRedisOptions } from '../../src/session_store/redis';

import { EXPORTER_KEY } from '../../src/session_store/constants';
import Service from '../../src/services/exporter.service';

import * as test from 'tape';

import logger from '../../src/logger';
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';


  test('Get exporter details', async (t) => {
    try {
      const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

      let key = 'jounrey';
      let payload = {
        user_id: USER_ID
      };

      let exporter = {
        exporterFullName: 'exporterFullName',
        exporterCompanyName: 'exporterCompanyName',
        addressOne: 'addressOne',
        townCity: 'townCity',
        postcode: 'postcode'
      };

      await Service.save(exporter, USER_ID, key);

      let savedExport = await Service.get(USER_ID, key);

      t.equals(savedExport['exporterFullName'], exporter['exporterFullName']);
      t.equals(savedExport['exporterCompanyName'], exporter['exporterCompanyName']);
      t.equals(savedExport['addressOne'], exporter['addressOne']);
      t.equals(savedExport['townCity'], exporter['townCity']);
      t.equals(savedExport['postcode'], exporter['postcode']);
      t.equals(!!savedExport, true);

    } catch(e) {
      logger.error(e);
    }
    t.end();
  });