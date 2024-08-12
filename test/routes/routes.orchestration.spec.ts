import {serverTest} from './../testHelpers';

serverTest(
  '[GET] /v1/processingStatement should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/processingStatement',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest('[GET] /v1/storageNotes should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/storageNotes',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] /v1/processingStatement/saveAndValidate should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url:
        '/v1/processingStatement/saveAndValidate?n=/next&c=/create-processing-statement/add-consignment-details',
      payload: {
        catches: [{}],
        consignmentDescription: 'Consignment',
        healthCertificateNumber: 'HC1232323',
        healthCertificateDate: '31/01/2019',
        errors: {}
      },
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });

    t.equals(response.statusCode, 200, 'Status code is 200');
    const result = JSON.parse(response.payload);
    t.equals(result.consignmentDescription, 'Consignment');
    t.equals(result.healthCertificateNumber, 'HC1232323');
    t.equals(result.healthCertificateDate, '31/01/2019');
  }
);

serverTest('[POST] /v1/processingStatement/saveAndValidate with invalid payload should return 200 with errors',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/processingStatement/saveAndValidate?n=/next&c=/create-processing-statement/add-consignment-details',
      payload: {
        catches: [{}],
        consignmentDescription: 'Consignment',
        errors: {}
      },
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });

    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest('[GET] /v1/processingStatement/back should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/processingStatement/back?n=nextUrlWouldBe=/next&c=/create-processing-statement/add-consignment-details',
      payload: {
        catches: [{}],
        consignmentDescription: 'Consignment',
        healthCertificateNumber: 'HC1232323',
        healthCertificateDate: '32/03/2018',
        errors: {}
      },
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });

    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest('[POST] /orchestration/api/v1/processingStatement/removeKey?n=${route.path}&key=catches.${index}`} should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/processingStatement/removeKey?n/create-processing-statement/add-consignment-details&key=catches.1',
      payload: {},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });

    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest('[POST] /orchestration/api/v1/processingStatement/generatePdf should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/processingStatement/generatePdf',
      payload: {},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });

    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);
