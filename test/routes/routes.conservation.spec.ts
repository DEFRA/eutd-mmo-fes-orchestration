import { serverTest } from '../testHelpers';
import ExportPayloadService from '../../src/services/export-payload.service';
const _ = require("lodash");
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'conservation';

serverTest('[GET] /v1/conservation should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/conservation',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] a conservation caught in UK Waters', async (server, t) => {

  let mockConservation = _.cloneDeep(conservation1);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...conservation1
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.legislation.length, 1);
  t.equals(result.legislation[0], 'UK Fisheries Policy');
});

serverTest('[POST] a conservation caught in EU Waters', async (server, t) => {

  let mockConservation = _.cloneDeep(conservation1);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...conservation2
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.legislation.length, 1);
  t.equals(result.legislation[0], 'Common Fisheries Policy');
});

serverTest('[POST] a conservation caught in EU Waters', async (server, t) => {

  let mockConservation = _.cloneDeep(conservation1);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...conservation3
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.legislation.length, 1);
  t.equals(result.legislation[0], 'Deep Waters');
});

serverTest('[POST] a conservation with no valid data returns a 400', async (server, t) => {

  let mockConservation = _.cloneDeep(conservation1);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {}
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[POST] a conservation with no valid data for Non JS returns a 302', async (server, t) => {

  let mockConservation = _.cloneDeep(conservation1);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {}
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest('[POST] a conservation with no incomplete other waters data for Non JS returns a 302', async (server, t) => {

  let mockConservation = _.cloneDeep(incompleteConservation);
  await ExportPayloadService.save({}, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/conservation',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...mockConservation
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

const conservation1 = {
  "documentNumber": "DOC-ID-1",
  "caughtInUKWaters": "Y"
};

const conservation2 = {
  "documentNumber": "DOC-ID-1",
  "caughtInEUWaters": "Y"
};

const conservation3 = {
  "documentNumber": "DOC-ID-1",
  "caughtInOtherWaters": "Y",
  "otherWaters": "Deep Waters"
};

const incompleteConservation = {
  "documentNumber": "DOC-ID-1",
  "caughtInOtherWaters": "Y"
};