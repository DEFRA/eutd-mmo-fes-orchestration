import * as Hapi from '@hapi/hapi';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import ExporterRoutes from './exporter';
import ExporterController from '../controllers/exporter.controller';

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
    return {isValid, credentials};
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

describe('exporter routes', () => {

  let server;

  beforeAll(async () => {
    server = await createServerInstance();
    const routes = await new ExporterRoutes()
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('GET /v1/exporter/{journey}', () => {

    let mockValidateDocumentOwnership;
    let mockGetExporterDetails;

    beforeAll(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockGetExporterDetails = jest.spyOn(ExporterController, 'getExporterDetails')
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });
      mockGetExporterDetails.mockImplementation((_req, _userPrincipal, _documentNumber, _contactId) => {
        return Promise.resolve({some: 'data'});
      });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    const request: any = {
      method: 'GET',
      url: '/v1/exporter/catchCertificate',
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentNumber: 'DOCUMENT123',
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      }
    };

    it('will return 200', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual({some: 'data'});
      expect(mockGetExporterDetails).toHaveBeenCalledWith(
        expect.any(Object),
        'Bob',
        'DOCUMENT123',
        undefined
      );
    });

    it('will return 500', async () => {
      mockGetExporterDetails.mockRejectedValue(new Error('error'))

      const response = await server.inject(request);
      expect(response.statusCode).toBe(500);
      expect(response.result).toEqual(null);
    });

  })

  describe('POST /v1/exporter/catchCertificate', () => {

    let mockValidateDocumentOwnership;
    let mockAddExporterDetails;

    beforeAll(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockAddExporterDetails = jest.spyOn(ExporterController, 'addExporterDetails');
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });
      mockAddExporterDetails.mockImplementation((_req, _h, _saveAsDraft, _userPrincipal, _documentNumber, _contactId) => {
        return Promise.resolve('success');
      });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    const request: any = {
      method: 'POST',
      url: '/v1/exporter/catchCertificate',
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentNumber: 'DOCUMENT123',
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: {

      }
    };

    it('will return 200 if the required fields are included', async () => {
      const payload = {
        exporterFullName: 'Bob',
        exporterCompanyName: 'Bob Co.',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(200);
    });

    it('will return 400 if the required fields are missing', async () => {
      const response = await server.inject({...request});

      const expected = {
        exporterFullName: 'error.exporterFullName.any.required',
        exporterCompanyName: 'error.exporterCompanyName.any.required',
        postcode: 'error.postcode.any.required'
      };

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual(expected);
    });

    it('will return 400 if exporterFullName exceeds 70 characters', async () => {
      const payload = {
        exporterFullName: 'A'.repeat(71),
        exporterCompanyName: 'Bob Co.',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterFullName).toBe('error.exporterFullName.string.max');
    });

    it('will return 400 if exporterFullName contains invalid characters', async () => {
      const payload = {
        exporterFullName: 'Bob@123',
        exporterCompanyName: 'Bob Co.',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterFullName).toBe('error.exporterFullName.string.pattern.base');
    });

    it('will return 400 if exporterCompanyName exceeds 250 characters', async () => {
      const payload = {
        exporterFullName: 'Bob',
        exporterCompanyName: 'A'.repeat(251),
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterCompanyName).toBe('error.exporterCompanyName.string.max');
    });

    it('will return 400 if exporterCompanyName contains invalid characters', async () => {
      const payload = {
        exporterFullName: 'Bob',
        exporterCompanyName: 'Bob & Co!',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterCompanyName).toBe('error.exporterCompanyName.string.pattern.base');
    });

    it('will accept valid exporterFullName with letters, spaces, apostrophes and periods', async () => {
      const payload = {
        exporterFullName: "Mary O'Connor Jr.",
        exporterCompanyName: 'Bob Co.',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(200);
    });

    it('will accept valid exporterCompanyName with letters, numbers, spaces, apostrophes, periods, hyphens and brackets', async () => {
      const payload = {
        exporterFullName: 'Bob',
        exporterCompanyName: "O'Reilly's Co. (UK) Ltd [2024]",
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(200);
    });

  })

  describe("POST /v1/exporter/processingStatement", () => {
    let mockValidateDocumentOwnership;
    let mockAddExporterDetails;

    beforeAll(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        DocumentOwnershipValidator,
        "validateDocumentOwnership"
      );
      mockAddExporterDetails = jest.spyOn(ExporterController, "addExporterDetails");
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });
      mockAddExporterDetails.mockImplementation((_req, _h, _saveAsDraft, _userPrincipal, _documentNumber, _contactId) => {
        return Promise.resolve("success");
      });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    const request: any = {
      method: "POST",
      url: "/v1/exporter/processingStatement",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentNumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: {},
    };

    it("will return 200 if the required fields are included", async () => {
      const payload = {
        exporterCompanyName: "Bob Co.",
        townCity: "Town",
        postcode: "Bob123",
      };

      const response = await server.inject({ ...request, payload });

      expect(response.statusCode).toBe(200);
    });

    it("will return 400 if the required fields are missing", async () => {
      const response = await server.inject({ ...request });

      const expected = {
        exporterCompanyName: "error.exporterCompanyName.any.required",
        postcode: "error.postcode.any.required",
      };

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual(expected);
    });

    it('will return 400 if exporterCompanyName exceeds 250 characters', async () => {
      const payload = {
        exporterCompanyName: 'A'.repeat(251),
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterCompanyName).toBe('error.exporterCompanyName.string.max');
    });

    it('will return 400 if exporterCompanyName contains invalid characters', async () => {
      const payload = {
        exporterCompanyName: 'Bob & Co!',
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(400);
      expect(response.result.exporterCompanyName).toBe('error.exporterCompanyName.string.pattern.base');
    });

    it('will accept valid exporterCompanyName with letters, numbers, spaces, apostrophes, periods, hyphens and brackets', async () => {
      const payload = {
        exporterCompanyName: "O'Reilly's Co. (UK) Ltd [2024]",
        townCity: 'Town',
        postcode: 'Bob123'
      };

      const response = await server.inject({...request, payload});

      expect(response.statusCode).toBe(200);
    });
  });

});