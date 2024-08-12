import * as Hapi from "@hapi/hapi";
import UserReferenceRoutes from "./userReference";
import UserReferenceController from "../controllers/userReference.controller";

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

describe("User Reference Payload", () => {
  let server;

  let mockAddUserReference;
  let mockGetUserReference;

  beforeAll(async () => {
    server = await createServerInstance();
    const routes = await new UserReferenceRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();

    mockAddUserReference = jest.spyOn(
      UserReferenceController,
      "addUserReference"
    );

    mockGetUserReference = jest.spyOn(
      UserReferenceController,
      "getUserReference"
    );
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    mockAddUserReference.mockResolvedValue("Valid User Reference");
  });

  describe("GET /v1/userReference", () => {
    const request: any = {
      method: "GET",
      url: "/v1/userReference",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
    };

    it("should GET /v1/userReference complete successfully with 200", async () => {
      mockGetUserReference.mockResolvedValue({some:"data"})
      const response = await server.inject(request);
      expect(mockGetUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
    });

    it("should GET /v1/userReference complete with 204", async () => {
      mockGetUserReference.mockResolvedValue(undefined)
      const response = await server.inject(request);
      expect(mockGetUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(204);
    });

    it("should GET /v1/userReference complete with 404", async () => {
      mockGetUserReference.mockResolvedValue(null)
      const response = await server.inject(request);
      expect(mockGetUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(404);
    });

    it("should GET /v1/userReference FAIL with 500", async () => {
      mockGetUserReference.mockRejectedValue(new Error('error'))
      const response = await server.inject(request);
      expect(mockGetUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
    });
  })

  describe("POST /userReference::Valid Payload", () => {
    const request: any = {
      method: "POST",
      url: "/v1/userReference",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: { userReference: "Valid User Reference" },
    };

    it("should call userReference and complete successfully", async () => {
      const response = await server.inject({
        ...request,
        payload: request.payload,
      });
      expect(mockAddUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
    });

    it("should call userReference and give 404", async () => {
      mockAddUserReference.mockResolvedValue(null)
      const response = await server.inject({
        ...request,
        payload: request.payload,
      });
      expect(mockAddUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(404);
    });

    it("should call userReference, error and give 404", async () => {
      mockAddUserReference.mockRejectedValue(new Error('error'))
      const response = await server.inject({
        ...request,
        payload: request.payload,
      });
      expect(mockAddUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
    });

    request.payload = { userReference: "Valid User Reference ./-123" }
    it("should call userReference and allow letters, numbers, hyphens, slashes and periods", async () => {
      const response = await server.inject({
        ...request,
        payload: request.payload,
      });
      expect(mockAddUserReference).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("POST /userReference::Invalid Payload", () => {
    const request: any = {
      method: "POST",
      url: "/v1/userReference",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      payload: { userReference: "Invalid User Reference **" },
    };

    it("should call userReference and fail", async () => {
      const response = await server.inject({
        ...request,
        payload: request.payload,
      });
      expect(mockAddUserReference).not.toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
    });

    it("should call userReference and fail (acceptsHtml)", async () => {
      const response = await server.inject({
        ...request,
        payload: request.payload,
        headers: {...request.headers, accept: "text/html"}
      });
      expect(mockAddUserReference).not.toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(302);
    });
  });
});
