import * as Hapi from "@hapi/hapi";
import * as DocumentOwnershipValidator from "../validators/documentOwnershipValidator";
import ProgressRoutes from "./progress";
import ProgressService from "../services/progress.service";
import { Progress } from "../persistence/schema/frontEndModels/payload";
import { ProgressStatus } from "../persistence/schema/common";
import logger from "../logger";

describe("Progress routes", () => {
  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new ProgressRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("GET /v1/progress/catchCertificate", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/catchCertificate",
      app: {
        claims: {
          sub: "Bob",
          contactId: 'contactBob',
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeAll(() => {
      mockGetProgress = jest.spyOn(ProgressService, "get");
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(
        DocumentOwnershipValidator,
        "validateDocumentOwnership"
      );
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    it("will return 204 if there is no errors", async () => {
      mockGetProgress.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();
    });

    it("will return 200 if there is no error", async () => {
      mockGetProgress.mockResolvedValue("error");

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-PROGRESS][ERROR][${e.stack || e}]`
      );
    });

    it("will call ProgressService get with document number", async () => {
      mockGetProgress.mockResolvedValue(null);

      await server.inject(request);

      expect(mockGetProgress).toHaveBeenCalledWith("Bob", "DOCUMENT123", 'contactBob');
    });
  });

  describe("GET /v1/progress/processingStatement", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/processingStatement",
      app: {
        claims: {
          sub: "Bob",
          contactId: "contactBob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeAll(() => {
      mockGetProgress = jest.spyOn(ProgressService, "getProcessingStatementProgress");
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(
        DocumentOwnershipValidator,
        "validateDocumentOwnership"
      );
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    it("will return 204 if there is no errors", async () => {
      mockGetProgress.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();
    });

    it("will return 200 if there is no error", async () => {
      mockGetProgress.mockResolvedValue("error");

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-PROGRESS][ERROR][${e.stack || e}]`
      );
    });

    it("will call ProgressService get with document number", async () => {
      mockGetProgress.mockResolvedValue(null);

      await server.inject(request);

      expect(mockGetProgress).toHaveBeenCalledWith("Bob", "DOCUMENT123", "contactBob");
    });
  });

  describe("GET /v1/progress/storageNotes", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/storageNotes",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeAll(() => {
      mockGetProgress = jest.spyOn(ProgressService, "getStorageDocumentProgress");
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(
        DocumentOwnershipValidator,
        "validateDocumentOwnership"
      );
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    it("will return 204 if there is no errors", async () => {
      mockGetProgress.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();
    });

    it("will return 200 if there is no error", async () => {
      mockGetProgress.mockResolvedValue("noerror");

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-PROGRESS][ERROR][${e.stack || e}]`
      );
    });

    it("will call ProgressService get with document number", async () => {
      mockGetProgress.mockResolvedValue(null);

      await server.inject(request);

      expect(mockGetProgress).toHaveBeenCalledWith("Bob", "DOCUMENT123", undefined);
    });
  });

  describe("GET /v1/progress/invalid", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/invalid",
      app: {
        claims: {
          sub: "Bob",
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    let mockValidateDocumentOwnership;
    let mockGetProgress;
    let mockGetProcessingStatementProgress;

    beforeAll(() => {
      mockGetProgress = jest.spyOn(ProgressService, "get");
      mockGetProcessingStatementProgress = jest.spyOn(ProgressService, "getProcessingStatementProgress");
      mockValidateDocumentOwnership = jest.spyOn(
        DocumentOwnershipValidator,
        "validateDocumentOwnership"
      );
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    it("will return 204 if there is no errors", async () => {
      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();

      expect(mockGetProgress).not.toHaveBeenCalled();
      expect(mockGetProcessingStatementProgress).not.toHaveBeenCalled();
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /v1/progress/complete/catchCertificate", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/complete/catchCertificate",
      app: {
        claims: {
          sub: "Bob",
          contactId: 'contactBob',
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    const error = {
      products: 'error.products.incomplete',
      landings: 'error.landings.incomplete',
      conservation: 'error.conservation.incomplete',
      exportJourney: 'error.exportJourney.incomplete',
      transportType:  'error.transportType.incomplete',
      transportDetails: 'error.transportDetails.incomplete',
    };

    const data: Progress = {
      progress: {
        reference: ProgressStatus.OPTIONAL,
        exporter: ProgressStatus.COMPLETED,
        products: ProgressStatus.COMPLETED,
        landings: ProgressStatus.COMPLETED,
        conservation: ProgressStatus.COMPLETED,
        exportJourney: ProgressStatus.COMPLETED,
        transportType: ProgressStatus.COMPLETED,
        transportDetails: ProgressStatus.COMPLETED,
      },
      completedSections: 7,
      requiredSections: 7
    }

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeEach(() => {
      mockGetProgress = jest.spyOn(ProgressService, "get");
      mockGetProgress.mockResolvedValue(data);
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    })

    it("will return 200 if all sections are complete", async () => {
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(mockLogError).not.toHaveBeenCalled();
    });

    it("will return 400 if all mandatory sections are not ‘Complete’ on CC application", async () => {
      const incompleteData: Progress = {
        progress: {
          reference: ProgressStatus.OPTIONAL,
          exporter: ProgressStatus.COMPLETED,
          products: ProgressStatus.INCOMPLETE,
          landings: ProgressStatus.CANNOT_START,
          conservation: ProgressStatus.INCOMPLETE,
          exportJourney: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 1,
        requiredSections: 7
      }

      mockGetProgress.mockResolvedValue(incompleteData);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(400);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(response.payload).toStrictEqual(JSON.stringify(error));
    });

    it("will not return an error for datUpload on CC application", async () => {
      const incompleteData: Progress = {
        progress: {
          reference: ProgressStatus.OPTIONAL,
          exporter: ProgressStatus.COMPLETED,
          dataUpload: '',
          products: ProgressStatus.INCOMPLETE,
          landings: ProgressStatus.CANNOT_START,
          conservation: ProgressStatus.INCOMPLETE,
          exportJourney: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 1,
        requiredSections: 7
      }

      mockGetProgress.mockResolvedValue(incompleteData);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(400);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(response.payload).toStrictEqual(JSON.stringify(error));
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);
      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-COMPLETE-PROGRESS][ERROR][${e.stack || e}]`
      );
    });
  });

  describe("GET /v1/progress/complete/processingStatement", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/complete/processingStatement",
      app: {
        claims: {
          sub: "Bob",
          contactId: 'contactBob',
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    const error = {
      exporter: 'error.exporter.incomplete',
      consignmentDescription: 'error.consignmentDescription.incomplete',
      catches: 'error.catches.incomplete',
      processingPlant: 'error.processingPlant.incomplete',
      processingPlantAddress:  'error.processingPlantAddress.incomplete',
      exportHealthCertificate: 'error.exportHealthCertificate.incomplete',
      exportDestination: 'error.exportDestination.incomplete',
    };

    const data = {
      progress: {
        reference: ProgressStatus.OPTIONAL,
        exporter: ProgressStatus.COMPLETED,
        consignmentDescription: ProgressStatus.COMPLETED,
        catches: ProgressStatus.COMPLETED,
        processingPlant: ProgressStatus.COMPLETED,
        processingPlantAddress: ProgressStatus.COMPLETED,
        exportHealthCertificate: ProgressStatus.COMPLETED,
        exportDestination: ProgressStatus.COMPLETED,
      },
      completedSections: 7,
      requiredSections: 7,
    };

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeEach(() => {
      mockGetProgress = jest.spyOn(ProgressService, "getProcessingStatementProgress");
      mockGetProgress.mockResolvedValue(data);
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    })

    it("will return 200 if all sections are complete", async () => {
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(mockLogError).not.toHaveBeenCalled();
    });

    it("will return 400 if all mandatory sections are not ‘Complete’ on PS application", async () => {
      const incompleteData = {
        progress: {
          reference: ProgressStatus.OPTIONAL,
          exporter: ProgressStatus.INCOMPLETE,
          consignmentDescription: ProgressStatus.INCOMPLETE,
          catches: ProgressStatus.INCOMPLETE,
          processingPlant: ProgressStatus.INCOMPLETE,
          processingPlantAddress: ProgressStatus.INCOMPLETE,
          exportHealthCertificate: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
        },
        completedSections: 0,
        requiredSections: 7,
      };

      mockGetProgress.mockResolvedValue(incompleteData);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(400);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(response.payload).toStrictEqual(JSON.stringify(error));
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);
      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-COMPLETE-PROGRESS][ERROR][${e.stack || e}]`
      );
    });
  });

  describe("GET /v1/progress/complete/storageNotes", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/complete/storageNotes",
      app: {
        claims: {
          sub: "Bob",
          contactId: 'contactBob',
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    const error = {
      exporter: 'error.exporter.incomplete',
      catches: 'error.catches.incomplete',
      storageFacilities: 'error.storageFacilities.incomplete',
      exportDestination: 'error.exportDestination.incomplete',
      transportType: 'error.transportType.incomplete',
      transportDetails: 'error.transportDetails.incomplete',
    };

    const data: Progress = {
      progress: {
        reference: ProgressStatus.OPTIONAL,
        exporter: ProgressStatus.COMPLETED,
        catches: ProgressStatus.COMPLETED,
        storageFacilities: ProgressStatus.COMPLETED,
        exportDestination: ProgressStatus.COMPLETED,
        transportType: ProgressStatus.COMPLETED,
        transportDetails: ProgressStatus.COMPLETED,
      },
      completedSections: 6,
      requiredSections: 6,
    };

    let mockGetProgress;
    let mockValidateDocumentOwnership;
    let mockLogError;

    beforeEach(() => {
      mockGetProgress = jest.spyOn(ProgressService, "getStorageDocumentProgress");
      mockGetProgress.mockResolvedValue(data);
      mockLogError = jest.spyOn(logger, "error");
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    })

    it("will return 200 if all sections are complete", async () => {
      const response = await server.inject(request);
      expect(response.statusCode).toBe(200);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(mockLogError).not.toHaveBeenCalled();
    });

    it("will return 400 if all mandatory sections are not ‘Complete’ on SD application", async () => {
      const incompleteData: Progress = {
        progress: {
          exporter: ProgressStatus.INCOMPLETE,
          reference: ProgressStatus.OPTIONAL,
          catches: ProgressStatus.INCOMPLETE,
          storageFacilities: ProgressStatus.INCOMPLETE,
          exportDestination: ProgressStatus.INCOMPLETE,
          transportType: ProgressStatus.INCOMPLETE,
          transportDetails: ProgressStatus.CANNOT_START,
        },
        completedSections: 0,
        requiredSections: 6,
      };

      mockGetProgress.mockResolvedValue(incompleteData);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(400);
      expect(mockGetProgress).toHaveBeenCalledWith('Bob', 'DOCUMENT123', 'contactBob');
      expect(response.payload).toStrictEqual(JSON.stringify(error));
    });

    it("will return 403 if the user does not own the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(request);
      expect(response.statusCode).toBe(403);
    });

    it("will log and return 500 if the get function throws an error", async () => {
      const e = new Error("an error occurred");

      mockGetProgress.mockRejectedValue(e);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith(
        `[GET-COMPLETE-PROGRESS][ERROR][${e.stack || e}]`
      );
    });
  });

  describe("GET /v1/progress/complete/blah", () => {
    const request: any = {
      method: "GET",
      url: "/v1/progress/complete/blah",
      app: {
        claims: {
          sub: "Bob",
          contactId: 'contactBob',
        },
      },
      headers: {
        documentnumber: "DOCUMENT123",
      },
    };

    const error = {
      progress: 'error.progress.invalid'
    };

    let mockValidateDocumentOwnership;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("will return 400 if an invalid journey is provided", async () => {
      const response = await server.inject(request);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toStrictEqual(JSON.stringify(error));
    });
  });
});
