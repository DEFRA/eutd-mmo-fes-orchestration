import { serverTest } from '../testHelpers';
import ExporterService from '../../src/services/exporter.service';
import ExporterRoutes from '../../src/routes/exporter';
const _ = require("lodash");
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

serverTest('[POST] /v1/exporter/save should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/exporter/save',
    payload: {
      exporterFullName: 'exporterFullName',
      exporterCompanyName: 'exporterCompanyName',
      addressOne: 'addressOne',
      townCity: 'townCity',
      postcode: 'aa1 1aa'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] /v1/exporter/save should return 400', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/exporter/save',
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[GET] /v1/exporter for catch cert should return 200', async (server, t) => {

  let mockExporter = _.cloneDeep(exporter1);
  await ExporterService.save({}, USER_ID, 'catchCertificate/exporter');
  await ExporterService.save(mockExporter, USER_ID, 'catchCertificate/exporter');

    const response = await server.inject({
      method: 'GET',
      url: '/v1/exporter/catchCertificate',
      app: {
        claims: {
          sub: USER_ID
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
    const result = JSON.parse(response.payload);
    t.equals(result.exporterFullName, exporter1.exporterFullName);
});

serverTest('[GET] /v1/exporter for storgae doc should return 200', async (server, t) => {

  let mockExporter = _.cloneDeep(exporter1);
  await ExporterService.save({}, USER_ID, 'storageNotes/exporter');
  await ExporterService.save(mockExporter, USER_ID, 'storageNotes/exporter');

    const response = await server.inject({
      method: 'GET',
      url: '/v1/exporter/storageNotes',
      app: {
        claims: {
          sub: USER_ID
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
    const result = JSON.parse(response.payload);
    t.equals(result.exporterFullName, exporter1.exporterFullName);
});

serverTest('[GET] /v1/exporter for processing stmnt should return 200', async (server, t) => {

  let mockExporter = _.cloneDeep(exporter1);
  await ExporterService.save({}, USER_ID, 'processingStatement/exporter');
  await ExporterService.save(mockExporter, USER_ID, 'processingStatement/exporter');

    const response = await server.inject({
      method: 'GET',
      url: '/v1/exporter/processingStatement',
      app: {
        claims: {
          sub: USER_ID
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
    const result = JSON.parse(response.payload);
    t.equals(result.exporterFullName, exporter1.exporterFullName);
});

const exporter1 = {
  exporterFullName: 'exporterFullName',
  exporterCompanyName: 'exporterCompanyName',
  addressOne: 'addressOne',
  townCity: 'townCity',
  postcode: 'aa1 1aa'
}

describe('ExporterRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new ExporterRoutes().register;
    expect(typeof register).toBe("function");
  });
});