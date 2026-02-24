import * as Hapi from "@hapi/hapi";
import * as moment from 'moment';
import Routes from "./export-payload";
import Controller from "../controllers/export-payload.controller";
import ExportPayloadService from "../services/export-payload.service";
import * as Ownership from "../validators/documentOwnershipValidator";
import * as FishValidator from "../validators/fish.validator";
import * as SessionManager from "../helpers/sessionManager";
import * as CatchCertService from "../persistence/services/catchCert";
import { LandingsEntryOptions } from "../persistence/schema/catchCert";
import * as CountriesValidator from "../validators/countries.validator";
import VesselValidator from "../services/vesselValidator.service";
import * as ProductValidator from "../validators/ccProductValidator";
import * as LandingValidator from "../validators/ccLandingValidator";

const Joi = require('joi');

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
    verify: (_decoded: any, _req: any) => {
      return { isValid: true };
    },
  });

  server.auth.default("jwt");

  return server;
};

describe("exporter-payload routes", () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = await createServerInstance();

    const routes = await new Routes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("GET /v1/export-certificates/landings-type", () => {
    const request: any = {
      method: "GET",
      url: "/v1/export-certificates/landings-type",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "GBR-XXXX-CC-XXXXXXXXX",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };

    const document = {
      documentNumber: 'GBR-2020-CC-0E42C2DA5'
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockIsDirectLanding: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockValidateDocumentOwnership.mockResolvedValue(document);
      mockIsDirectLanding = jest.spyOn(Controller, "getLandingsType");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 400 if not catch cert", async () => {
      const mockRequest = {
        ...request,
        headers: {
          documentnumber: "GBR-XXXX-SD-XXXXXXXXX",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
      };
      const response = await server.inject(mockRequest);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual([
        "error.landingsEntryOption.any.invalid",
      ]);
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 and isDirect if direct landing", async () => {
      mockIsDirectLanding.mockResolvedValue({ isDirectLanding: true });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ isDirectLanding: true });
    });

    it("should return 200 and notDirect if is not direct landing", async () => {
      mockIsDirectLanding.mockResolvedValue({ isDirectLanding: false });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ isDirectLanding: false });
    });

    it("should return 200 and emptyData if no landings found", async () => {
      mockIsDirectLanding.mockResolvedValue({ isDirectLanding: undefined });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ isDirectLanding: undefined });
    });

    it("should return 403 no valid user", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });
  });

  describe("POST /v1/export-certificates/landings-type", () => {
    const document = {
      documentNumber: 'GBR-2020-CC-0E42C2DA5'
    };

    const request: any = {
      method: "POST",
      url: "/v1/export-certificates/landings-type",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "GBR-XXXX-CC-XXXXXXXXX",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: {
        landingsEntryOption: "manualEntry",
      },
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockAddLandingsEntryOption: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockValidateDocumentOwnership.mockResolvedValue(document);
      mockAddLandingsEntryOption = jest.spyOn(
        Controller,
        "addLandingsEntryOption"
      );
      mockAddLandingsEntryOption.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 200 with landings options entry", async () => {
      const response = await server.inject(request);
      const expected = {
        generatedByContent: false,
        landingsEntryOption: "manualEntry",
      };

      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(expected);
    });

    describe("when landings entry option is direct landing", () => {
      it("should return 200 with landings options entry", async () => {
        const mockRequest = {
          ...request,
          payload: {
            landingsEntryOption: "directLanding",
          },
        };
        const response = await server.inject(mockRequest);
        const expected = {
          generatedByContent: false,
          landingsEntryOption: "directLanding",
        };

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });
    });

    describe("when landings entry option is upload entry", () => {
      it("should return 200 with landings options entry", async () => {
        const mockRequest = {
          ...request,
          payload: {
            landingsEntryOption: "uploadEntry",
          },
        };
        const response = await server.inject(mockRequest);
        const expected = {
          generatedByContent: false,
          landingsEntryOption: "uploadEntry",
        };

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });
    });

    describe("when landings entry option is invalid", () => {
      it("should return 400", async () => {
        const mockRequest = {
          ...request,
          payload: {
            landingsEntryOption: "blah blah",
          },
        };

        const response = await server.inject(mockRequest);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual([
          "error.landingsEntryOption.any.invalid",
        ]);
      });
    });

    it("should return 400 if user is valid and payload is missing", async () => {
      const mockRequest = {
        method: "POST",
        url: "/v1/export-certificates/landings-type",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "GBR-XXXX-CC-XXXXXXXXX",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
      };

      const response = await server.inject(mockRequest);

      expect(response.statusCode).toBe(400);
    });

    it("should return 403 if user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 if there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("POST /v1/export-certificates/landing/validate", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockUpsertExportPayloadProductLanding: jest.SpyInstance;
    let mockValidateCountriesName: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockUpsertExportPayloadProductLanding = jest.spyOn(
        Controller,
        "upsertExportPayloadProductLanding"
      );

      mockValidateCountriesName = jest.spyOn(
        CountriesValidator,
        "validateCountriesName"
      );
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
      });

      jest.spyOn(SessionManager, 'getCurrentSessionData')
        .mockResolvedValue({
          documentNumber: "DOCUMENT123",
          currentUri: "test/test.html",
          nextUri: "testNext/testNext.html"
        });

      jest.spyOn(CatchCertService, 'getExportPayload')
        .mockResolvedValue({
          items: []
        });

      jest.spyOn(ExportPayloadService, 'get')
        .mockResolvedValue({
          items: [],
          error: undefined,
          errors: undefined
        } as any);

      request = {
        method: "POST",
        url: "/v1/export-certificates/landing/validate",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          product: "some",
          vessel: { vesselName: "a vessel" },
          dateLanded: moment().utc().format('YYYY-MM-DD'),
          exportWeight: "123",
          faoArea: "FAO18",
          gearCategory: "Category 1",
          gearType: "Type 1",
          rfmo: undefined,
          highSeasArea: "No",
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
          exclusiveEconomicZones: [
            {
              officialCountryName: "Afghanistan",
              isoCodeAlpha2: "AF",
              isoCodeAlpha3: "AFG",
              isoNumericCode: "004"
            },
            {
              officialCountryName: "Åland Islands",
              isoCodeAlpha2: "AX",
              isoCodeAlpha3: "ALA",
              isoNumericCode: "248",
            }
          ],
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 400 for a request payload containing an invalid FAO area", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          faoArea: 'invalid'
        }
      }
      const response = await server.inject(_request);

      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for a request payload containing a FAO area not on the list of areas", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          faoArea: 'FAO89'
        }
      }
      const response = await server.inject(_request);

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          faoArea: "error.faoArea.any.only"
        }
      };

      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload containing a start date after the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().utc().add(1, 'day').format('YYYY-MM-DD')
        }
      }

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          startDate: "error.startDate.date.max"
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload containing an invalid start date", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: 'an-invalid-date'
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.startDate).toBe('error.startDate.date.base');
    });

    it("should return 400 for a request payload containing a non-existent start date", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: '2025-02-31'
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.startDate).toBe('error.startDate.date.base');
    });

    it("should return 400 for a request payload containing an incomplete start date", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: '-5-'
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.startDate).toBe('error.startDate.date.base');
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 500 user is no valid and no valid payload", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(new Error("error"));

      request.payload.exportWeight = "INVALID - NO DIGITS";
      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid and valid payload", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });

    it("should return 200 for a request payload containing a start date equal to the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().utc().format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductLanding).toHaveBeenCalled();
    });

    it('returns 400 with short key when adding a landing pushes total >= 10,000,000', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const currentPayload = {
        items: [
          {
            product: { id: 'p-other' },
            landings: [{ model: { exportWeight: 9900000 } }],
          },
        ],
      } as any;

      jest.spyOn(ExportPayloadService, 'get' as any).mockResolvedValue(currentPayload as any);
      jest.spyOn(LandingValidator, 'validateLanding').mockResolvedValue(undefined as any);

      const req = {
        ...request,
        payload: {
          ...request.payload,
          product: 'product-1',
          exportWeight: '200000',
        },
      };

      const response = await server.inject(req);

      expect(response.statusCode).toBe(400);
      const parsed = JSON.parse(response.payload as string);
      expect(parsed.errors.exportWeight).toBe('ccAddLandingTotalExportWeightLessThan');
    });

    it('returns 400 with short key when editing a landing still exceeds limit after adjusting original weight', async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const currentPayload = {
        items: [
          {
            product: { id: 'product-1' },
            landings: [
              { model: { id: 'land-1', exportWeight: 5000000 } },
              { model: { id: 'land-2', exportWeight: 5000000 } },
            ],
          },
        ],
      } as any;

      jest.spyOn(ExportPayloadService, 'get' as any).mockResolvedValue(currentPayload as any);
      jest.spyOn(LandingValidator, 'validateLanding').mockResolvedValue(undefined as any);

      const req = {
        ...request,
        payload: {
          ...request.payload,
          product: 'product-1',
          id: 'land-1',
          exportWeight: '6000000',
        },
      };

      const response = await server.inject(req);

      expect(response.statusCode).toBe(400);
      const parsed = JSON.parse(response.payload as string);
      expect(parsed.errors.exportWeight).toBe('ccAddLandingTotalExportWeightLessThan');
    });

    it("should return 200 for a request payload containing a start date before the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductLanding).toHaveBeenCalled();
    });

    it("should return 400 not containing a Gear Category and containing a Gear Type after the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: 'Type 1',
        }
      }
      const response = await server.inject(_request);

      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it("should return 400 when startDate is missing (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: undefined
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.startDate).toBe('error.startDate.any.required');
    });

    it("should return 400 when gearCategory is missing (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: undefined,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.gearCategory).toBe('error.gearCategory.any.required');
    });

    it("should return 400 when gearCategory is empty string (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: '',
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.gearCategory).toBe('error.gearCategory.string.empty');
    });

    it("should return 400 when gearType is missing (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: undefined,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.gearType).toBe('error.gearType.any.required');
    });

    it("should return 400 when gearType is empty string (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: '',
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.gearType).toBe('error.gearType.string.empty');
    });

    it("should return 400 when highSeasArea is missing (required field)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: undefined,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.highSeasArea).toBe('error.highSeasArea.any.required');
    });

    it("should return 400 when highSeasArea has invalid value (must be Yes or No)", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: 'Maybe',
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.highSeasArea).toBe('error.highSeasArea.any.only');
    });

    it("should return 400 when highSeasArea is No but exclusiveEconomicZones is missing", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: 'No',
          exclusiveEconomicZones: undefined,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.exclusiveEconomicZones).toBe('error.exclusiveEconomicZones.any.required');
    });

    it("should return 400 when highSeasArea is No but exclusiveEconomicZones is empty array", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: 'No',
          exclusiveEconomicZones: [],
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors.exclusiveEconomicZones).toBe('error.exclusiveEconomicZones.array.min');
    });

    it("should return 200 when highSeasArea is Yes and exclusiveEconomicZones is not provided", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: 'Yes',
          exclusiveEconomicZones: undefined,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductLanding).toHaveBeenCalled();
    });

    it("should return 200 when all required fields are provided correctly", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: 'Type 1',
          highSeasArea: 'No',
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
          exclusiveEconomicZones: [
            {
              officialCountryName: "Afghanistan",
              isoCodeAlpha2: "AF",
              isoCodeAlpha3: "AFG",
              isoNumericCode: "004"
            }
          ]
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductLanding).toHaveBeenCalled();
    });
  });

  describe("POST /v1/export-certificates/direct-landing/validate", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockUpsertExportPayloadProductDirectLanding: jest.SpyInstance;
    let mockValidateCountriesName: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockUpsertExportPayloadProductDirectLanding = jest.spyOn(
        Controller,
        "upsertExportPayloadProductDirectLanding"
      );

      mockValidateCountriesName = jest.spyOn(
        CountriesValidator,
        "validateCountriesName"
      );
      mockValidateCountriesName.mockResolvedValue({
        isError: false,
      });

      jest.spyOn(SessionManager, 'getCurrentSessionData')
        .mockResolvedValue({
          documentNumber: "DOCUMENT123",
          currentUri: "test/test.html",
          nextUri: "testNext/testNext.html"
        });

      jest.spyOn(CatchCertService, 'getExportPayload')
        .mockResolvedValue({
          items: []
        });

      request = {
        method: "POST",
        url: "/v1/export-certificates/direct-landing/validate",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          vessel: { vesselName: "a vessel" },
          dateLanded: moment().utc().format('YYYY-MM-DD'),
          startDate: moment().utc().format('YYYY-MM-DD'),
          faoArea: "FAO18",
          weights: [
            {
              speciesId: "an id",
              exportWeight: 23,
            },
          ],
          gearCategory: "Category 1",
          gearType: "Type 1",
          highSeasArea: "Yes",
          exclusiveEconomicZones: [
            {
              officialCountryName: "Afghanistan",
              isoCodeAlpha2: "AF",
              isoCodeAlpha3: "AFG",
              isoNumericCode: "004"
            },
            {
              officialCountryName: "Åland Islands",
              isoCodeAlpha2: "AX",
              isoCodeAlpha3: "ALA",
              isoNumericCode: "248",
            }
          ],
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 400 for a request payload containing an invalid FAO area", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          faoArea: 'invalid'
        }
      }
      const response = await server.inject(_request);

      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for a request payload missing a start date", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: undefined
        }
      }

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          startDate: "error.startDate.any.required"
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload missing high seas", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: undefined
        }
      }

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          highSeasArea: "error.highSeasArea.any.required"
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload when high seas 'no' and exclusive economic zones are empty", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: 'No',
          exclusiveEconomicZones: []
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"exclusiveEconomicZones":"error.exclusiveEconomicZones.array.min"});
    });

    it("should return 200 for a request payload when high seas 'yes' and exclusive economic zones are empty", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: 'Yes',
          exclusiveEconomicZones: []
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductDirectLanding).toHaveBeenCalled();
    });

    it("should return 200 for a request payload when high seas 'no' and exclusive economic zones has an empty official country name", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: 'No',
          exclusiveEconomicZones: [{ officialCountryName: 'Nigeria' }]
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductDirectLanding).toHaveBeenCalled();
    });

    it("should return 400 for a request payload when high seas 'no' and exclusive economic zones has an empty official country name", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: 'No',
          exclusiveEconomicZones: [{ officialCountryName: undefined }]
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"eez.0":"error.eez.0.any.required"});
    });

    it("should return 400 for a request payload when high seas 'no' and exclusive economic zones is invalid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Joi.ValidationError('invalid country', [
        { message: 'error.eez.0.any.invalid', path: ['exclusiveEconomicZones', 0], type: 'any.invalid', context: { label: 'exclusiveEconomicZones[0].officialCountryName', key: 'officialCountryName' } }
      ], null) });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          highSeasArea: 'No',
          exclusiveEconomicZones: [{ officialCountryName: "Invalid Country" }]
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"exclusiveEconomicZones.0":"error.exclusiveEconomicZones.0.any.invalid"});
    });

    it("should return 400 for a request payload when high seas 'no' and exclusive economic zones is invalid and missing st", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockValidateCountriesName.mockResolvedValue({ isError: true, error: new Joi.ValidationError('invalid country', [
        { message: 'error.exclusiveEconomicZones.array.invalidCountry', path: ['exclusiveEconomicZones', 0], type: 'any.invalid', context: { label: 'exclusiveEconomicZones[0].officialCountryName', key: 'officialCountryName' } }
      ], null) });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: undefined,
          highSeasArea: 'No',
          exclusiveEconomicZones: [{ officialCountryName: "Invalid Country" }]
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"exclusiveEconomicZones.0":"error.exclusiveEconomicZones.0.any.invalid", "startDate": "error.startDate.any.required"});
    });

    it("should return 400 for a request payload containing a FAO area not on the list of areas", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          faoArea: 'FAO89'
        }
      }
      const response = await server.inject(_request);

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          faoArea: "error.faoArea.any.only"
        }
      };

      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload containing a start date after the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().utc().add(1, 'day').format('YYYY-MM-DD')
        }
      }

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          startDate: "error.startDate.date.max"
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload containing an invalid start date", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: 'an-invalid-date'
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).errors.startDate).toBe('error.startDate.date.base');
    });

    it("should return 400 for a request payload containing a date landed without a year", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          dateLanded: '-08-01'
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 500 user is no valid and no valid payload", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(new Error("error"));

      request.payload.exportWeight = "INVALID - NO DIGITS";
      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid and valid payload", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({
        some: "data",
      });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });

    it("should return 200 for a request payload containing a start date equal to the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().utc().format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductDirectLanding).toHaveBeenCalled();
    });

    it("should return 200 for a request payload containing a start date before the dateLanded", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockUpsertExportPayloadProductDirectLanding).toHaveBeenCalled();
    });

    it("should return 400 for a request payload not contain gear category and contain type an invalid gear category", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductDirectLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: 'Type 1',
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
    });

    it("should return 400 for a request payload not containing gear type", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: 'Category 1',
          gearType: '',
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"gearType":"error.gearType.string.empty"});
    });

    it("should return 400 for a request payload not containing gear category", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: 'Type 1',
        }
      }

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductDirectLanding).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).errors).toStrictEqual({"gearCategory":"error.gearCategory.string.empty"});
    });
  });

  describe("POST /v1/export-certificates/export-payload/product", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockAddExportPayloadProduct: jest.SpyInstance;
    let mockValidateSpeciesName: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockAddExportPayloadProduct = jest.spyOn(
        Controller,
        "addExportPayloadProduct"
      );
      mockValidateSpeciesName = jest.spyOn(
        FishValidator,
        "validateSpeciesName"
      );

      request = {
        method: "POST",
        url: "/v1/export-certificates/export-payload/product",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          species: { label: "a vessel" },
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      mockValidateSpeciesName.mockResolvedValue({ isError: false });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));
      mockValidateSpeciesName.mockResolvedValue({ isError: false });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 400 user is no valid and no valid payload", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(new Error("error"));

      request.payload.species.label = undefined;
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockAddExportPayloadProduct.mockResolvedValue({ some: "data" });
      mockValidateSpeciesName.mockResolvedValue({ isError: false });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("GET /v1/export-certificates/export-payload", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockGetExportPayload: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockGetExportPayload = jest.spyOn(Controller, "getExportPayload");

      request = {
        method: "GET",
        url: "/v1/export-certificates/export-payload",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockGetExportPayload.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("GET /v1/export-certificates/export-payload/direct-landings", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockGetExportPayloadDirectLandings: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockGetExportPayloadDirectLandings = jest.spyOn(
        Controller,
        "getDirectLandingExportPayload"
      );
      request = {
        method: "GET",
        url: "/v1/export-certificates/export-payload/direct-landings",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));
      const response = await server.inject(request);
      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockGetExportPayloadDirectLandings.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("POST /v1/export-certificates/export-payload/validate", () => {
    const request: any = {
      method: "POST",
      url: "/v1/export-certificates/export-payload/validate",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockValidate: jest.SpyInstance;
    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockValidate = jest.spyOn(Controller, "validate");
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(403);
    });
    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));
      const response = await server.inject(request);
      expect(response.statusCode).toBe(500);
    });
    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockValidate.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("POST /v1/export-certificates/export-payload/validate/saveAsDraft", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockValidateExportPayloadAndSaveAsDraft: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockValidateExportPayloadAndSaveAsDraft = jest.spyOn(
        Controller,
        "validateExportPayloadAndSaveAsDraft"
      );

      request = {
        method: "POST",
        url: "/v1/export-certificates/export-payload/validate/saveAsDraft",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          currentUri: "some url",
          journey: "CatchCert",
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockValidateExportPayloadAndSaveAsDraft.mockResolvedValue({
        some: "data",
      });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("POST /v1/export-certificates/confirm-change-landings-type", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockConfirmLandingsType: jest.SpyInstance;
    let mockSaveLandingsEntryType: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockValidateDocumentOwnership.mockResolvedValue(true);

      mockConfirmLandingsType = jest.spyOn(Controller, "confirmLandingsType");
      mockConfirmLandingsType.mockResolvedValue({});

      mockSaveLandingsEntryType = jest.spyOn(
        Controller,
        "addLandingsEntryOption"
      );
      mockSaveLandingsEntryType.mockResolvedValue(undefined);

      request = {
        method: "POST",
        url: "/v1/export-certificates/confirm-change-landings-type",
        app: {
          claims: {
            sub: "Bob",
            contactId: 'contactBob'
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          landingsEntryOption: "manualEntry",
          landingsEntryConfirmation: "Yes",
          currentUri: ":documentNumber/landings-type-confirmation",
          journey: "catchCertificate",
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 200 for a valid landings entry option confirmation", async () => {
      const response = await server.inject(request);

      expect(mockConfirmLandingsType).toHaveBeenCalledWith(
        "Bob",
        "DOCUMENT123",
        LandingsEntryOptions.ManualEntry,
        'contactBob'
      );
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        landingsEntryOption: "manualEntry",
        generatedByContent: false,
      });
    });

    it("should redirect 302 to payload.currentUri if the accept header is text/html", async () => {
      const mockReq: any = {
        ...request,
        headers: {
          ...request.headers,
          accept: "text/html",
        },
      };

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(302);
    });

    it("should return 200 for a valid landings entry option confirmation but not save", async () => {
      const mockReq: any = {
        ...request,
        payload: {
          ...request.payload,
          landingsEntryConfirmation: "No",
          landingsEntryOption: "manualEntry",
        },
      };

      const response = await server.inject(mockReq);

      expect(mockConfirmLandingsType).not.toHaveBeenCalledWith();
      expect(response.statusCode).toBe(200);
    });

    it("should return 400 if the landingsEntryOptions is invalid", async () => {
      const mockReq: any = {
        ...request,
        payload: {
          ...request.payload,
          landingsEntryOption: "invalidLandingsEntryOption",
        },
      };
      const response = await server.inject(mockReq);

      expect(mockConfirmLandingsType).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual([
        "error.landingsEntryOption.any.invalid",
      ]);
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(mockConfirmLandingsType).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockConfirmLandingsType.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("POST /v1/export-certificates/export-payload/product/{productId}/landing", () => {
    let request: any;
    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockUpsertExportPayloadProductLanding: jest.SpyInstance;
    let mockUpsertLanding: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockUpsertExportPayloadProductLanding = jest.spyOn(
        Controller,
        "upsertExportPayloadProductLanding"
      );
      mockUpsertLanding = jest.spyOn(
        ExportPayloadService,
        "upsertLanding"
      );

      request = {
        method: "POST",
        url: "/v1/export-certificates/export-payload/product/productId/landing",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        headers: {
          documentnumber: "DOCUMENT123",
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        payload: {
          vessel: { vesselName: "a vessel" },
          dateLanded: moment().utc().format('YYYY-MM-DD'),
          startDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
          exportWeight: "12",
          faoArea: "12",
          gearCategory: "Category 1",
          gearType: "Type 1",
          highSeasArea: "Yes",
          exclusiveEconomicZones: [
            {
              officialCountryName: "Afghanistan",
              isoCodeAlpha2: "AF",
              isoCodeAlpha3: "AFG",
              isoNumericCode: "004"
            },
            {
              officialCountryName: "Åland Islands",
              isoCodeAlpha2: "AX",
              isoCodeAlpha3: "ALA",
              isoNumericCode: "248",
            }
          ],
        },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 400 for a request payload containing a date landed without a year", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertLanding.mockResolvedValue({ some: "data" });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          dateLanded: '-08-01'
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
    });

    it("should return 400 for a request payload containing an invalid gear category and containing gear type", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertLanding.mockResolvedValue({
        items: [],
        error: "invalid",
        errors: {
          gearCategory: "error.gearCategory.string.empty"
        }
      });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: 'Type 1',
        }
      };

      const expected = {
        items: [],
        error: "invalid",
        errors: {
          gearCategory: "error.gearCategory.string.empty"
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
      expect(response.payload).toStrictEqual(JSON.stringify(expected));
    });

    it("should return 400 for a request payload not containing gear category and containing gear type", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertLanding.mockResolvedValue({
        items: [],
        error: "invalid",
        errors: {
          gearCategory: "error.gearCategory.string.empty"
        }
      });

      const _request = {
        ...request,
        payload: {
          ...request.payload,
          gearCategory: '',
          gearType: 'Type 1',
        }
      };

      const response = await server.inject(_request);

      expect(response.statusCode).toBe(400);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
    });

    it("should return 500 if there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockUpsertExportPayloadProductLanding).not.toHaveBeenCalled();
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockUpsertExportPayloadProductLanding.mockResolvedValue({ some: "data" });

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("POST /v1/export-certificates/create", () => {
    const request: any = {
      method: "POST",
      url: "/v1/export-certificates/create",
      app: {
        claims: {
          sub: "Bob",
          email: "bob@example.com",
          auth_time: 123456789,
          contactId: "contactBob"
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: {
        data: "127.0.0.1",
        completeUri: "/complete",
        submittedUri: "/submitted"
      }
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockExportPayloadServiceGet: jest.SpyInstance;
    let mockInvalidateDraftCache: jest.SpyInstance;
    let mockGetCertificateStatus: jest.SpyInstance;
    let mockCreateExportCertificate: jest.SpyInstance;
    let mockIsSubmissionFailure: jest.SpyInstance;
    let mockClearErrors: jest.SpyInstance;
    let mockClearSystemError: jest.SpyInstance;
    let mockVesselsNotFound: jest.SpyInstance;
    let mockInvalidLandingDates: jest.SpyInstance;
    let mockVesselsAreValid: jest.SpyInstance;
    let mockProductsAreValid: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockExportPayloadServiceGet = jest.spyOn(
        ExportPayloadService,
        "get"
      );
      mockInvalidateDraftCache = jest.spyOn(
        CatchCertService,
        "invalidateDraftCache"
      );
      mockGetCertificateStatus = jest.spyOn(
        ExportPayloadService,
        "getCertificateStatus"
      );
      mockCreateExportCertificate = jest.spyOn(
        ExportPayloadService,
        "createExportCertificate"
      );
      mockIsSubmissionFailure = jest.spyOn(
        ExportPayloadService,
        "isSubmissionFailure"
      );
      mockClearErrors = jest.spyOn(
        require("../services/summaryErrors.service").default,
        "clearErrors"
      );
      mockClearSystemError = jest.spyOn(
        require("../services/summaryErrors.service").default,
        "clearSystemError"
      );
      mockVesselsNotFound = jest.spyOn(
        VesselValidator,
        "vesselsNotFound"
      );
      mockInvalidLandingDates = jest.spyOn(
        VesselValidator,
        "invalidLandingDates"
      );
      mockVesselsAreValid = jest.spyOn(
        VesselValidator,
        "vesselsAreValid"
      );
      mockProductsAreValid = jest.spyOn(
        ProductValidator,
        "productsAreValid"
      );

      // Default mocks
      mockInvalidateDraftCache.mockResolvedValue(undefined);
      mockExportPayloadServiceGet.mockResolvedValue({ items: [] });
      mockGetCertificateStatus.mockResolvedValue("DRAFT");
      mockClearErrors.mockResolvedValue(undefined);
      mockClearSystemError.mockResolvedValue(undefined);
      mockIsSubmissionFailure.mockReturnValue(false);
      mockVesselsNotFound.mockReturnValue([]);
      mockInvalidLandingDates.mockReturnValue([]);
      mockVesselsAreValid.mockResolvedValue(true);
      mockProductsAreValid.mockResolvedValue([]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it('should return 500 and a system error if there is an error', async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error('my error'));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(response.result).toStrictEqual([{ error: 'SYSTEM_ERROR' }]);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockCreateExportCertificate.mockResolvedValue({ 
        documentNumber: "DOCUMENT123", 
        uri: "some-uri",
        report: [],
        isBlockingEnabled: false
      });
      
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual({
        offlineValidation: false,
        documentNumber: "DOCUMENT123",
        uri: "some-uri"
      });
    });
  });

  describe("PUT /v1/export-certificates/export-payload/product/{productId}/landing/{landingId}", () => {
    const request: any = {
      method: "PUT",
      url: "/v1/export-certificates/export-payload/product/productId/landing/landingId",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockEditExportPayloadProductLanding: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockEditExportPayloadProductLanding = jest.spyOn(
        Controller,
        "editExportPayloadProductLanding"
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockEditExportPayloadProductLanding.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("DELETE /v1/export-certificates/export-payload/product/{productId}/landing/{landingId}", () => {
    const request: any = {
      method: "DELETE",
      url: "/v1/export-certificates/export-payload/product/productId/landing/landingId",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockRemoveExportPayloadProductLanding: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockRemoveExportPayloadProductLanding = jest.spyOn(
        Controller,
        "removeExportPayloadProductLanding"
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockRemoveExportPayloadProductLanding.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });

  describe("DELETE /v1/export-certificates/export-payload/product/{productId}", () => {
    const request: any = {
      method: "DELETE",
      url: "/v1/export-certificates/export-payload/product/productId",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };

    let mockValidateDocumentOwnership: jest.SpyInstance;
    let mockRemoveExportPayloadProduct: jest.SpyInstance;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(
        Ownership,
        "validateDocumentOwnership"
      );
      mockRemoveExportPayloadProduct = jest.spyOn(
        Controller,
        "removeExportPayloadProduct"
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 403 user is not valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("should return 500 of there is an error", async () => {
      mockValidateDocumentOwnership.mockRejectedValue(Error("my error"));

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
    });

    it("should return 200 user is valid", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
      mockRemoveExportPayloadProduct.mockResolvedValue({ some: "data" });
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({ some: "data" });
    });
  });
});
