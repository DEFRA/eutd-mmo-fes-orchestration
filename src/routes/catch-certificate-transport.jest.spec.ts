
import * as Hapi from "@hapi/hapi";
import * as DocumentOwnershipValidator from "../validators/documentOwnershipValidator";
import CatchCertificateTransportRoutes from "./catch-certificate-transport";
import Controller from '../controllers/catch-certificate-transport.controller';
import { CatchCertificateTransport } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import { AddTransportation } from "../persistence/schema/catchCert";

const createServerInstance = async () => {
  const server = Hapi.server();
  await server.register(require("@hapi/basic"));
  await server.register(require("hapi-auth-jwt2"));

  const fesApiValidate = async (
    _request: Hapi.Request,
    _username: string,
    _password: string
  ) => {
    const isValid = true;
    const credentials = { id: 'fesApi', name: 'fesApi' };
    return { isValid, credentials };
  };

  server.auth.strategy("fesApi", "basic", {
    validate: fesApiValidate,
  });

  server.auth.strategy("jwt", "jwt", {
    verify: (_decoded, _req) => {
      return { isValid: true };
    },
  });

  server.auth.default("jwt");

  return server;
};

describe("Transport endpoints", () => {

  let server: Hapi.Server<Hapi.ServerApplicationState>;

  let mockWithDocumentLegitimatelyOwned: jest.SpyInstance;
  let mockAddTransport: jest.SpyInstance;
  let mockGetTransport: jest.SpyInstance;
  let mockUpdateTransport: jest.SpyInstance;
  let mockUpdateTransportDocuments: jest.SpyInstance;
  let mockSaveTransportDocuments: jest.SpyInstance;
  let mockGetTransportations: jest.SpyInstance;
  let mockRemoveTransportation: jest.SpyInstance;
  let mockAddTransportationCheck: jest.SpyInstance;
  let mockGetTransportationCheck: jest.SpyInstance;

  const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";

  const document = {
    documentNumber: "GBR-2021-CC-3434343434"
  }

  const transport: CatchCertificateTransport = {
    id: "0",
    vehicle: "train"
  }

  const transportWithDocuments: CatchCertificateTransport = {
    ...transport,
    documents: [{
      name: 'road-transport-document',
      reference: 'AA123456'
    }]
  }

  beforeAll(async () => {
    server = await createServerInstance()
    const routes = await new CatchCertificateTransportRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
    mockWithDocumentLegitimatelyOwned.mockResolvedValue(document);

    mockAddTransport = jest.spyOn(Controller, 'addTransport');
    mockAddTransport.mockResolvedValue(transport);

    mockGetTransport = jest.spyOn(Controller, 'getTransport');
    mockGetTransport.mockResolvedValue(transport);

    mockUpdateTransport = jest.spyOn(Controller, 'updateTransport');
    mockUpdateTransport.mockResolvedValue(transport);

    mockUpdateTransportDocuments = jest.spyOn(Controller, 'updateTransportDocuments');
    mockUpdateTransportDocuments.mockResolvedValue(transportWithDocuments);

    mockSaveTransportDocuments = jest.spyOn(Controller, 'saveTransportDocuments');
    mockSaveTransportDocuments.mockResolvedValue(transportWithDocuments);

    mockGetTransportations = jest.spyOn(Controller, 'getTransportations');
    mockGetTransportations.mockResolvedValue([transport]);

    mockRemoveTransportation = jest.spyOn(Controller, 'removeTransportationById');
    mockRemoveTransportation.mockResolvedValue(undefined);

    mockAddTransportationCheck = jest.spyOn(Controller, 'addTransportationCheck');
    mockAddTransportationCheck.mockResolvedValue({ addTransportation: AddTransportation.Yes });

    mockGetTransportationCheck = jest.spyOn(Controller, 'getTransportationCheck');
    mockGetTransportationCheck.mockResolvedValue({ addTransportation: AddTransportation.Yes });
  })

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createRequestObj(url, additionalPayloadParams = {}, method = 'POST', acceptHtml = false) {
    const request: any = {
      method,
      url,
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: DOCUMENT_NUMBER,
        accept: acceptHtml ? 'text/html' : 'application/json',
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: method === 'GET' ? undefined : {
        ...additionalPayloadParams
      },
    };

    return request
  }

  it('returns 200 and doesnt fail when we POST /v1/catch-certificate/transport/add', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "train"
    })

    const response = await server.inject(request);
    expect(mockAddTransport).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual(transport);
  });

  it('returns 500 and FAILS when we POST /v1/catch-certificate/transport/add', async () => {

    mockAddTransport.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "train"
    })

    const response = await server.inject(request);
    expect(mockAddTransport).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 500 and FAILS when we POST /v1/catch-certificate/transport/add on error with no stack', async () => {
    const error = new Error('an error');
    error.stack = undefined;

    mockAddTransport.mockRejectedValue(error);

    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "train"
    })

    const response = await server.inject(request);
    expect(mockAddTransport).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 400 and FAILS when we POST /v1/catch-certificate/transport/add without a vehicle', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport/add', {})

    const response = await server.inject(request);
    expect(mockAddTransport).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { vehicle: 'error.vehicle.any.required' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  it('returns 400 and FAILS when we POST /v1/catch-certificate/transport/add with an invalid a vehicle', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "blahblah"
    })

    const response = await server.inject(request);
    expect(mockAddTransport).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { vehicle: 'error.vehicle.any.only' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  it('returns 400 and fails when we POST /v1/catch-certificate/transport/add with a CMR flag for a truck transportation', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "truck",
      cmr: "true",
    })

    const response = await server.inject(request);
    expect(mockAddTransport).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.result).toEqual({
      cmr: "error.cmr.object.unknown",
    });
  });

  it('returns 400 and FAILS when we POST /v1/catch-certificate/transport/add with a CMR flag for non-truck transportation', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport/add', {
      vehicle: "plane",
      cmr: 'true',
    })

    const response = await server.inject(request);
    expect(mockAddTransport).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { cmr: 'error.cmr.object.unknown' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  it('returns 200 and doesnt fail when we GET /v1/catch-certificate/transport/check', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport/check', {}, 'GET')

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({ addTransportation: "yes" });
  });

  it('returns 500 and FAILS when we GET /v1/catch-certificate/transport/check', async () => {
    mockWithDocumentLegitimatelyOwned.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transport/check', {}, 'GET');

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 200 and doesnt fail when we POST /v1/catch-certificate/transport/check', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport/check', {
      addTransportation: "yes"
    })

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({ addTransportation: "yes" });
  });

  it('returns 500 and FAILS when we POST /v1/catch-certificate/transport/check', async () => {
    mockWithDocumentLegitimatelyOwned.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transport/check', {
      addTransportation: "yes"
    })

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 500 and FAILS when we POST /v1/catch-certificate/transport/check on error with no stack', async () => {
    const error = new Error('an error');
    error.stack = undefined;

    mockWithDocumentLegitimatelyOwned.mockRejectedValue(error);

    const request = createRequestObj('/v1/catch-certificate/transport/check', {
      addTransportation: "yes"
    })

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 400 and FAILS when we POST /v1/catch-certificate/transport/check without an answer', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport/check', {})

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { addTransportation: 'error.addTransportation.any.required' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  it('returns 400 and FAILS when we POST /v1/catch-certificate/transport/check with an invalid answer', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport/check', {
      addTransportation: "blah"
    })

    const response = await server.inject(request);
    expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { addTransportation: 'error.addTransportation.any.only' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  describe('/v1/catch-certificate/transport/:id', () => {
    it('returns 200 when we GET /v1/catch-certificate/transport/0', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'GET');

      const response = await server.inject(request);
      expect(mockGetTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport/0', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0', { id: '0', vehicle: 'train' }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we DELETE /v1/catch-certificate/transport/0', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'DELETE');

      const response = await server.inject(request);
      expect(mockRemoveTransportation).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toBeNull();
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport/0 with truck transportation and valid CMR flag', async () => {
      const request = createRequestObj('/v1/catch-certificate/transport/0', { id: '0', vehicle: 'truck', cmr: 'true' }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual({
        cmr: "error.cmr.object.unknown",
      });
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport/0 with non-truck transportation with CMR flag', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0', { id: '0', vehicle: 'train', cmr: 'true' }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual({
        cmr: "error.cmr.object.unknown",
      });
    });

    it('returns 404 when we GET /v1/catch-certificate/transport/NaN', async () => {
      mockGetTransport.mockResolvedValue(null);

      const request = createRequestObj('/v1/catch-certificate/transport/NaN', {}, 'GET');

      const response = await server.inject(request);
      expect(mockGetTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(404);
      expect(response.result).toBeNull();
    });

    it('returns 500 and FAILS when we PUT /v1/catch-certificate/transport/0', async () => {

      mockUpdateTransport.mockRejectedValue(new Error('an error'))

      const request = createRequestObj('/v1/catch-certificate/transport/0', { id: '0', vehicle: 'train' }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });

    it('returns 500 and FAILS when we PUT /v1/catch-certificate/transport/0 with no stack', async () => {
      const error = new Error('an error');
      error.stack = undefined;

      mockUpdateTransport.mockRejectedValue(error);

      const request = createRequestObj('/v1/catch-certificate/transport/0', { id: '0', vehicle: 'train' }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });

    it('returns 500 when we DELETE /v1/catch-certificate/transport/0', async () => {
      mockRemoveTransportation.mockRejectedValue(new Error("something has gone wrong"));

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'DELETE');

      const response = await server.inject(request);
      expect(mockRemoveTransportation).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toBeNull();
    });

    it('returns 500 when we DELETE /v1/catch-certificate/transport/0 with no stack', async () => {
      const error = new Error("something has gone wrong");
      error.stack = undefined;

      mockRemoveTransportation.mockRejectedValue(error);

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'DELETE');

      const response = await server.inject(request);
      expect(mockRemoveTransportation).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toBeNull();
    });

    it('returns 500 and FAILS when we GET /v1/catch-certificate/transport/0', async () => {

      mockGetTransport.mockRejectedValue(new Error('an error'))

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'GET');

      const response = await server.inject(request);
      expect(mockGetTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });

    it('returns 500 and FAILS when we GET /v1/catch-certificate/transport/0 on error with no stack', async () => {
      const error = new Error('an error');
      error.stack = undefined;

      mockGetTransport.mockRejectedValue(error);

      const request = createRequestObj('/v1/catch-certificate/transport/0', {}, 'GET');

      const response = await server.inject(request);
      expect(mockGetTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });
  });

  describe('/v1/catch-certificate/transport/:id/cmr', () => {
    it('returns 200 when we PUT /v1/catch-certificate/transport/0/cmr as true for truck transport', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0/cmr', {
        id: '0',
        vehicle: 'truck',
        cmr: 'true',
      }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport/0/cmr as false for truck transport', async () => {

      const request = createRequestObj('/v1/catch-certificate/transport/0/cmr', {
        id: '0',
        vehicle: 'truck',
        cmr: 'false',
      }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport/0/cmr with no cmr value provided', async () => {
      const request = createRequestObj('/v1/catch-certificate/transport/0/cmr', {
        id: '0',
        vehicle: "truck",
      }, 'PUT');

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response).toMatchObject({ statusCode: 400, result: { cmr: "error.cmr.any.required" } });
    
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport/0/cmr as invalid boolean string', async () => {
      const requests = ["tru", "yes", "no", "1", "0", "blah"].map(cmr => {
        const request = createRequestObj('/v1/catch-certificate/transport/0/cmr', {
          id: '0',
          vehicle: "truck",
          cmr,
        }, 'PUT');

        return server.inject(request);
      });
      const responses = await Promise.all(requests);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      responses.forEach(r => expect(r).toMatchObject({ statusCode: 400, result: { cmr: "error.cmr.any.only" } }))
    
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport/0/cmr with non-truck transport', async () => {

      const requests = ["plane", "train", "containerVessel"].map(vehicle => {
        const request = createRequestObj('/v1/catch-certificate/transport/0/cmr', {
          id: '0',
          vehicle,
          cmr: 'true',
        }, 'PUT');

        return server.inject(request);
      });
      const responses = await Promise.all(requests);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      responses.forEach(r => expect(r).toMatchObject({ statusCode: 400, result: { vehicle: "error.vehicle.any.only" } }))
    
    });
  });

  it('returns 400 and FAILS when we PUT /v1/catch-certificate/transport/0 with an invalid a vehicle', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport/0', {
      id: '0',
      vehicle: "blahblah"
    }, 'PUT')

    const response = await server.inject(request);
    expect(mockAddTransport).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    const error = { vehicle: 'error.vehicle.any.only' }
    expect(response.payload).toStrictEqual(JSON.stringify(error));
  });

  it('returns 200 when we GET /v1/catch-certificate/transportations', async () => {

    const request = createRequestObj('/v1/catch-certificate/transportations', {}, 'GET');

    const response = await server.inject(request);
    expect(mockGetTransportations).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual([transport]);
  });

  it('returns 500 and FAILS when we GET /v1/catch-certificate/transportations', async () => {

    mockGetTransportations.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transportations', {}, 'GET');

    const response = await server.inject(request);
    expect(mockGetTransportations).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 500 and FAILS when we GET /v1/catch-certificate/transportations on error with no stack', async () => {
    const error = new Error('an error');
    error.stack = undefined;

    mockGetTransportations.mockRejectedValue(error);

    const request = createRequestObj('/v1/catch-certificate/transportations', {}, 'GET');

    const response = await server.inject(request);
    expect(mockGetTransportations).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 200 when we PUT /v1/catch-certificate/transport-documents/0', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual(transportWithDocuments);
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with documents with empty name and reference', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: '', reference: '' }] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with name and reference for over 50 characters', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!', reference: 'ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!' }] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ "documents.0.name": "error.documents.0.name.string.max", "documents.0.reference": "error.documents.0.reference.string.max" }));
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with empty documents', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ documents: "error.documents.array.min" }));
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with name only', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'name' }] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ "documents.0.reference": "error.documents.0.reference.any.required" }));
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with reference only', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ reference: 'reference' }] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when we PUT /v1/catch-certificate/transport-documents/0 with reference only on second document', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'name', reference: 'reference' }, { reference: 'reference' }] }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('returns 500 and FAILS when we PUT /v1/catch-certificate/transport-documents/0', async () => {
    mockUpdateTransportDocuments.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 500 and FAILS with no error stack when we PUT /v1/catch-certificate/transport-documents/0', async () => {
    const error = new Error('an error');
    error.stack = undefined;

    mockUpdateTransportDocuments.mockRejectedValue(error);

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    }, 'PUT');

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 200 when we POST /v1/catch-certificate/transport-documents/0', async () => {
    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual(transportWithDocuments);
  });

  it('returns 200 when we POST /v1/catch-certificate/transport-documents/0 with empty documents', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [] });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual(transportWithDocuments);
  });

  it('returns 200 when we POST /v1/catch-certificate/transport-documents/0 with documents with empty name and reference', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: '', reference: '' }] });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it('returns 400 when we POST /v1/catch-certificate/transport-documents/0 with name only', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'name' }] });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ "documents.0": "error.documents.0.object.and" }));
  });

  it('returns 400 when we POST /v1/catch-certificate/transport-documents/0 with reference only', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ reference: 'reference' }] });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ "documents.0": "error.documents.0.object.and" }));
  });

  it('returns 400 when we POST /v1/catch-certificate/transport-documents/0 with name and reference for over 50 characters', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!', reference: 'ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!ZebraJumpsOverLazyFoxesWhileCodingInTheRain123!' }] });

    const response = await server.inject(request);
    expect(mockUpdateTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual(JSON.stringify({ "documents.0.name": "error.documents.0.name.string.max", "documents.0.reference": "error.documents.0.reference.string.max" }));
  });

  it('returns 400 when we POST /v1/catch-certificate/transport-documents/0 with reference only on second document', async () => {

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', { id: '0', vehicle: 'truck', documents: [{ name: 'name', reference: 'reference' }, { reference: 'reference' }] });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('returns 500 and FAILS when we POST /v1/catch-certificate/transport-documents/0', async () => {
    mockSaveTransportDocuments.mockRejectedValue(new Error('an error'))

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  it('returns 500 and FAILS with no error stack when we POST /v1/catch-certificate/transport-documents/0', async () => {
    const error = new Error('an error');
    error.stack = undefined;

    mockSaveTransportDocuments.mockRejectedValue(error);

    const request = createRequestObj('/v1/catch-certificate/transport-documents/0', {
      id: '0', vehicle: 'truck', documents: [{
        name: 'road-transport-document',
        reference: 'AA123456'
      }]
    });

    const response = await server.inject(request);
    expect(mockSaveTransportDocuments).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.result).toEqual(null);
  });

  describe('/v1/catch-certificate/transport-details', () => {
    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0 with complete truck details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0 with complete plane details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'plane',
          flightNumber: 'UI90UXB',
          containerNumber: '012345678',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0 with complete train details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'train',
          railwayBillNumber: '01234567',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0 with complete containerVessel details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'containerVessel',
          vesselName: 'WIRON 5',
          containerNumber: '0192394',
          flagState: 'UK',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete truck details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'truck',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete plane details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'plane',
          flightNumber: 'UI90UXBUI90UXBUI90UXBUI90UXBUI90UXBUI90UXBUI90UXB',
          containerNumber: '012345678',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete plane details on containerNumber', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'plane',
          flightNumber: '01234567',
          containerNumber: '@$%%$$%%',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete train details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'train',
          railwayBillNumber: '0123456789012345',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete containerVessel details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'containerVessel',
          vesselName: '&£*W(W$*$*(W$&',
          containerNumber: '0192394',
          flagState: 'UK',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with incomplete containerVessel details for containerNumber', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'containerVessel',
          vesselName: 'Wiron 5',
          containerNumber: '£%%%@%%@',
          flagState: 'UK',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0?draft=true with freight bill number which below the 60 character limit', async () => {
      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0?draft=true',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber:
            'VeryVeryVeryVeryVeryVeryVeryLengthyFreightBillNumber',
        },
        'PUT',
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 200 when we PUT /v1/catch-certificate/transport-details/0 with valid freight bill number containing allowed characters', async () => {
      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0', 
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'ABC-123/456.789',
        },
        'PUT'
      );
    
      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });
    
    it('returns 200 when freight bill number is not provided', async () => {
      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck', 
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull'
        },
        'PUT'
      );
    
      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled(); 
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(transport);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete truck details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { nationalityOfVehicle: "error.nationalityOfVehicle.any.required" };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete plane details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'plane',
          flightNumber: 'UI90UXBUI90UXBUI90UXBUI90UXBUI90UXBUI90UXBUI90UXB',
          containerNumber: '012345678',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { flightNumber: "error.flightNumber.string.max" };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete plane details on containerNumber', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'plane',
          flightNumber: '01234567',
          containerNumber: '@$%%$$%%',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { containerNumber: "error.containerNumber.string.pattern.base" };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete train details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'train',
          railwayBillNumber: '0123456789012345',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { railwayBillNumber: "error.railwayBillNumber.string.max" };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete containerVessel details', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'containerVessel',
          vesselName: '&£*W(W$*$*(W$&',
          containerNumber: '0192394',
          flagState: 'UK',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { vesselName: "error.vesselName.string.pattern.base" };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with incomplete containerVessel details for containerNumber', async () => {

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'containerVessel',
          vesselName: 'Wiron 5',
          containerNumber: '£%%%@%%@',
          flagState: 'UK',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = { containerNumber: "error.containerNumber.string.pattern.base", };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with freight bill number which exceeds the 60 character limit', async () => {
      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber:
            'VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLengthyFreightBillNumber',
        },
        'PUT',
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      const error = {
        freightBillNumber: 'error.freightBillNumber.string.max',
      };
      expect(response.result).toEqual(error);
    });

    it('returns 400 when we PUT /v1/catch-certificate/transport-details/0 with invalid characters in freight bill number', async () => {
      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'ABC#123@!',
        },
        'PUT'
      );
    
      const response = await server.inject(request);
      expect(mockUpdateTransport).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual({
        freightBillNumber: 'error.freightBillNumber.string.pattern.base',
      });
    });

    it('returns 500 when we PUT /v1/catch-certificate/transport-details/0 when the controller throws an error', async () => {
      mockUpdateTransport.mockRejectedValue(new Error("something has gone wrong"));

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });

    it('returns 500 when we PUT /v1/catch-certificate/transport-details/0 when the controller throws an error with no stack', async () => {
      const error = new Error("something has gone wrong");
      error.stack = undefined;

      mockUpdateTransport.mockRejectedValue(error);

      const request = createRequestObj(
        '/v1/catch-certificate/transport-details/0',
        {
          id: '0',
          vehicle: 'truck',
          nationalityOfVehicle: 'UK',
          registrationNumber: 'UI90UXB',
          departurePlace: 'Hull',
          freightBillNumber: 'AA1234567'
        },
        'PUT'
      );

      const response = await server.inject(request);
      expect(mockUpdateTransport).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });
  });
});