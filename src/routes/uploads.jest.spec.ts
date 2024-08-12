import * as Hapi from "@hapi/hapi";
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import UploadsController from "../controllers/uploads.controller";
import logger from '../logger';
import * as UploadsRoutes from "./uploads";
import { IUploadedLanding } from "../persistence/schema/uploads";
import { Readable } from "stream";
import * as GetStream from "get-stream";
import * as FormData from "form-data";
import ApplicationConfig from "../applicationConfig";
import * as DRS from "../services/reference-data.service"

describe("uploads routes", () => {
  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new UploadsRoutes.default();
    ApplicationConfig.loadProperties();
    ApplicationConfig._maxLimitLandings = 100;
    ApplicationConfig._maxUploadFileSize = 10000;
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("POST /uploads/landings", () => {

    let mockValidateDocumentOwnership;
    let mockGetFileExtension;
    let mockParseLandingsFile;
    let mockVirusDetected;
    let mockGetFileName;

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    }


    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(document);

      mockGetFileExtension = jest.spyOn(UploadsRoutes, "getFileExtension");
      mockGetFileExtension.mockReturnValue("csv");

      mockParseLandingsFile = jest.spyOn(UploadsController, "parseLandingsFile");
      mockParseLandingsFile.mockResolvedValue([{ failed: false }]);


      mockVirusDetected = jest.spyOn(DRS, 'virusDetected');
      mockVirusDetected.mockResolvedValue(false);

      mockGetFileName = jest.spyOn(UploadsRoutes, "getFileName");
      mockGetFileName.mockReturnValue("filename.csv");

    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const generateRows = (length) =>
      [...Array(length)]
        .map((_) => "PRD047,19/07/2021,FAO27,J407ururu,1000000\n")
        .reduce((str, item) => (str += item));

    const constructRequest = async (fileContent: string = generateRows(50)) => {
      const fileStream = new Readable();
      fileStream.push(fileContent);
      fileStream.push(null);

      const form = new FormData();
      form.append('file', fileStream);

      const request: any = {
        url: "/v1/uploads/landings",
        method: "post",
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'Contact-Bob'
          }
        },
        headers: form.getHeaders()
      };

      request.headers['documentnumber'] = 'doc123';
      request.payload = await GetStream(form);

      return request;
    }

    it("will return 200 ok for a valid request", async () => {
      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it("will pass the file from the payload into the controller", async () => {
      const fileContent = generateRows(50);

      const request: any = await constructRequest(fileContent);
      await server.inject(request);

      expect(mockParseLandingsFile).toHaveBeenCalledWith(fileContent, request.app.claims.sub, 'Contact-Bob');
    });

    it("will return 400 bad request for a empty request", async () => {
      const fileContent = "";

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

    it("will return 400 bad request for a payload that is too large", async () => {
      const maxBytes = ApplicationConfig._maxUploadFileSize;

      const fileContent = 'x'.repeat(maxBytes + 1);

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: {
          key: "error.upload.max-file-size",
          params: {
            maxBytes
          }
        }
      });
    });

    it("will return 400 bad request for an incorrect file type", async () => {
      mockGetFileExtension.mockReturnValue('txt');

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-file-type"
      });
    });

    it("will return 400 bad request if error.upload.min-landings error is thrown", async () => {
      mockParseLandingsFile.mockRejectedValue(new Error("error.upload.min-landings"));

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

    it("will return 400 bad request if error.upload.max-landings error is thrown", async () => {
      const limit = ApplicationConfig._maxLimitLandings;

      mockParseLandingsFile.mockRejectedValue(new Error("error.upload.max-landings"));

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: {
          key: "error.upload.max-landings",
          params: {
            limit
          }
        }
      });
    });

    it("will return 400 bad request if any other errors are thrown", async () => {
      mockParseLandingsFile.mockRejectedValue("something went wrong");

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-columns"
      });
    });

    it("will return 403 unauthorised if the user doesnt have access to the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("will return 400 bad request, invalid-columns error if a virus was detected", async () => {
      mockVirusDetected.mockReturnValue(true);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-columns"
      });
    });

    it("will return 400 bad request, av-failed error if a virusDetected is undefined", async () => {
      mockVirusDetected.mockReturnValue(undefined);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.av-failed"
      });
    });

    it("will return 400 bad request if error.upload.min-landings", async () => {
      const fileContent = " ";

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

  });

  describe("POST v2/uploads/landings", () => {

    let mockValidateDocumentOwnership;
    let mockGetFileExtension;
    let mockParseLandingsFile;
    let mockVirusDetected;
    let mockGetFileName;

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    }


    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(document);

      mockGetFileExtension = jest.spyOn(UploadsRoutes, "getFileExtension");
      mockGetFileExtension.mockReturnValue("csv");

      mockParseLandingsFile = jest.spyOn(UploadsController, "parseLandingsFile");
      mockParseLandingsFile.mockResolvedValue([{ failed: false }]);


      mockVirusDetected = jest.spyOn(DRS, 'virusDetected');
      mockVirusDetected.mockResolvedValue(false);

      mockGetFileName = jest.spyOn(UploadsRoutes, "getFileName");
      mockGetFileName.mockReturnValue("filename.csv");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const generateRows = (length) =>
      [...Array(length)]
        .map((_) => "PRD047,19/07/2021,FAO27,J407ururu,1000000\n")
        .reduce((str, item) => (str += item));

    const constructRequest = async (fileContent: string = generateRows(50)) => {
      const fileStream = new Readable();
      fileStream.push(fileContent);
      fileStream.push(null);

      const form = new FormData();
      form.append('file', fileStream);

      const request: any = {
        url: "/v2/uploads/landings",
        method: "post",
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'Contact-Bob'
          }
        },
        headers: form.getHeaders()
      };

      request.headers['documentnumber'] = 'doc123';
      request.payload = await GetStream(form);

      return request;
    }

    it("will return 200 ok for a valid request", async () => {
      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
    });

    it("will pass the file from the payload into the controller", async () => {
      const fileContent = generateRows(50);

      const request: any = await constructRequest(fileContent);
      await server.inject(request);

      expect(mockParseLandingsFile).toHaveBeenCalledWith(fileContent, request.app.claims.sub, 'Contact-Bob', true);
    });

    it("will return 400 bad request for a empty request", async () => {
      const fileContent = "";

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

    it("will return 400 bad request for missing file in payload", async () => {
      mockGetFileName.mockReturnValue("");

      const fileContent = generateRows(50);

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.missing-file"
      });
    });

    it("will return 400 bad request for a payload that is too large", async () => {
      const maxBytes = ApplicationConfig._maxUploadFileSize;

      const fileContent = 'x'.repeat(maxBytes + 1);

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: {
          key: "error.upload.max-file-size",
          params: {
            maxBytes
          }
        }
      });
    });

    it("will return 400 bad request for an incorrect file type", async () => {
      mockGetFileExtension.mockReturnValue('txt');

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-file-type"
      });
    });

    it("will return 400 bad request if error.upload.min-landings error is thrown", async () => {
      mockParseLandingsFile.mockRejectedValue(new Error("error.upload.min-landings"));

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

    it("will return 400 bad request if error.upload.max-landings error is thrown", async () => {
      const limit = ApplicationConfig._maxLimitLandings;

      mockParseLandingsFile.mockRejectedValue(new Error("error.upload.max-landings"));

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: {
          key: "error.upload.max-landings",
          params: {
            limit
          }
        }
      });
    });

    it("will return 400 bad request if any other errors are thrown", async () => {
      mockParseLandingsFile.mockRejectedValue("something went wrong");

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-columns"
      });
    });

    it("will return 403 unauthorised if the user doesnt have access to the document", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(403);
    });

    it("will return 400 bad request, invalid-columns error if a virus was detected", async () => {
      mockVirusDetected.mockReturnValue(true);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.invalid-columns"
      });
    });

    it("will return 400 bad request, av-failed error if a virusDetected is undefined", async () => {
      mockVirusDetected.mockReturnValue(undefined);

      const request: any = await constructRequest();
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.av-failed"
      });
    });

    it("will return 400 bad request if error.upload.min-landings", async () => {
      const fileContent = " ";

      const request: any = await constructRequest(fileContent);
      const response = await server.inject(request);

      expect(response.statusCode).toBe(400);
      expect(response.result).toStrictEqual({
        file: "error.upload.min-landings"
      });
    });

  });

  describe("POST /save/landings", () => {
    const rows: IUploadedLanding[] = [{
      rowNumber: 1,
      originalRow: 'some-string',
      productId: 'some-product-id',
      product: {
        species: 'species',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      },
      landingDate: 'some-landing-date',
      faoArea: 'faoArea',
      vessel : undefined,
      vesselPln: 'some-pln',
      exportWeight: 10,
      errors: [],
    }];

    const req: any = {
      url: "/v1/save/landings",
      method: "post",
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentNumber: 'DOCUMENT123'
      },
      payload: {
        file: rows,
        currentUri: '/create-catch-certificate/:documentNumber/upload-file'
      }
    };

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    };

    let mockValidateDocumentOwnership;
    let mockSaveLandingRows;
    let mockLoggerError;
    let mockOriginalMaxLimitLandings;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(document);

      mockSaveLandingRows = jest.spyOn(UploadsController, "saveLandingRows");
      mockSaveLandingRows.mockResolvedValue(rows);

      mockLoggerError = jest.spyOn(logger, 'error');

      mockOriginalMaxLimitLandings = ApplicationConfig._maxLimitLandings;
    });

    afterEach(() => {
      jest.restoreAllMocks();

      ApplicationConfig._maxLimitLandings = mockOriginalMaxLimitLandings;
    });

    it("should return 200 OK", async () => {
      const response = await server.inject(req);
      const expected: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          species: 'species',
          speciesCode: 'species-code',
          scientificName: 'some-scientic-name',
          state: 'some-state',
          stateLabel: 'some-label',
          presentation: 'some-presentation',
          presentationLabel: 'some-presentation-label',
          commodity_code: 'some-commidity-code',
          commodity_code_description: 'some-commmodity-description',
        },
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vessel : undefined,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      }];

      expect(mockSaveLandingRows).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.payload).toEqual(JSON.stringify(expected));
    });

    it("should redirect 302 if payload errors when JS not enabled", async () => {
      const mockReq: any = {
        ...req,
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
        payload: {
          currentUri: '/create-catch-certificate/:documentNumber/upload-file'
        }
      };

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/create-catch-certificate/:documentNumber/upload-file?error={"file":"error.file.any.required"}');
    });

    it("should return 400 Bad Request if payload has no rows", async () => {
      const mockReq: any = {
        ...req,
        payload: {
          currentUri: '/create-catch-certificate/:documentNumber/upload-file'
        }
      };

      const expected = JSON.stringify({
        file: 'error.file.any.required',
      });

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if payload has empty rows", async () => {
      const mockReq: any = {
        ...req,
        payload: {
          file: [],
          currentUri: '/create-catch-certificate/:documentNumber/upload-file'
        }
      };

      const expected = JSON.stringify({
        file: 'error.file.array.min'
      });

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if there are more than 100 landings within the payload", async () => {
      const landingRow = {
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          species: 'species',
          speciesCode: 'species-code',
          scientificName: 'some-scientic-name',
          state: 'some-state',
          stateLabel: 'some-label',
          presentation: 'some-presentation',
          presentationLabel: 'some-presentation-label',
          commodity_code: 'some-commidity-code',
          commodity_code_description: 'some-commmodity-description',
        },
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vesselName: 'vessel-name',
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      };

      const rows = [];
      for (let index = 0; index < 101; index++)
        rows.push({
          ...landingRow,
          rowNumber: index + 1
        });

      const mockReq: any = {
        ...req,
        payload: {
          file: rows,
          currentUri: '/create-catch-certificate/:documentNumber/upload-file'
        }
      };

      const expected = JSON.stringify({
        file: 'error.file.array.max'
      });

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 403 Unauthorised", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);

      const response = await server.inject(req);
      expect(response.statusCode).toBe(403);
    });

    it("should return 500 Internal Server Error if any errors occur", async () => {
      const error = new Error('some error');
      mockSaveLandingRows.mockRejectedValue(error);
      const response = await server.inject(req);
      expect(response.statusCode).toBe(500);
      expect(mockLoggerError).toHaveBeenCalledWith(`[SAVE-UPLOAD-FILE][ERROR][${error}]`);
    });
  });

  describe("POST v2/save/landings", () => {
    const rows: IUploadedLanding[] = [{
      rowNumber: 1,
      originalRow: 'some-string',
      productId: 'some-product-id',
      product: {
        species: 'species',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      },
      landingDate: 'some-landing-date',
      faoArea: 'faoArea',
      vessel : undefined,
      vesselPln: 'some-pln',
      exportWeight: 10,
      errors: [],
    }];

    const req: any = {
      url: "/v2/save/landings",
      method: "post",
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentNumber: 'DOCUMENT123'
      },
      payload: {
        currentUri: '/create-catch-certificate/:documentNumber/upload-file'
      }
    };

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    };

    let mockValidateDocumentOwnership;
    let mockSaveLandingRows;
    let mockLoggerError;
    let mockGetCacheLandings;
    let mockInvalidateCache;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(document);

      mockSaveLandingRows = jest.spyOn(UploadsController, "saveLandingRows");
      mockSaveLandingRows.mockResolvedValue(rows);

      mockLoggerError = jest.spyOn(logger, 'error');

      mockGetCacheLandings = jest.spyOn(UploadsController, 'getCacheUploadedRows');
      mockGetCacheLandings.mockResolvedValue(rows);

      mockInvalidateCache = jest.spyOn(UploadsController, 'invalidateCacheUploadedRows');
      mockInvalidateCache.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 200 OK", async () => {
      const response = await server.inject(req);
      const expected: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          species: 'species',
          speciesCode: 'species-code',
          scientificName: 'some-scientic-name',
          state: 'some-state',
          stateLabel: 'some-label',
          presentation: 'some-presentation',
          presentationLabel: 'some-presentation-label',
          commodity_code: 'some-commidity-code',
          commodity_code_description: 'some-commmodity-description',
        },
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vessel : undefined,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      }];

      expect(mockSaveLandingRows).toHaveBeenCalled();
      expect(mockGetCacheLandings).toHaveBeenCalled();
      expect(mockInvalidateCache).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.payload).toEqual(JSON.stringify(expected));
    });

    it("should return 400 Bad Request if payload does not contain a uri", async () => {
      const mockReq: any = {
        ...req,
        payload: {}
      };

      const expected = JSON.stringify({
        currentUri: 'error.currentUri.any.required'
      });

      const response = await server.inject(mockReq);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if rows is undefined", async () => {
      mockGetCacheLandings.mockResolvedValue(undefined);

      const expected = JSON.stringify({
        file: 'error.file.any.required',
      });

      const response = await server.inject(req);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if rows is null", async () => {
      mockGetCacheLandings.mockResolvedValue(null);

      const expected = JSON.stringify({
        file: 'error.file.any.required',
      });

      const response = await server.inject(req);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if rows is empty rows", async () => {
      mockGetCacheLandings.mockResolvedValue([]);

      const expected = JSON.stringify({
        file: 'error.file.array.min'
      });

      const response = await server.inject(req);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 400 Bad Request if there are more than 100 landings", async () => {
      const landingRow = {
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          species: 'species',
          speciesCode: 'species-code',
          scientificName: 'some-scientic-name',
          state: 'some-state',
          stateLabel: 'some-label',
          presentation: 'some-presentation',
          presentationLabel: 'some-presentation-label',
          commodity_code: 'some-commidity-code',
          commodity_code_description: 'some-commmodity-description',
        },
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vesselName: 'vessel-name',
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      };

      const rows = [];
      for (let index = 0; index < 101; index++)
        rows.push({
          ...landingRow,
          rowNumber: index + 1
        });

      mockGetCacheLandings.mockResolvedValue(rows);

      const expected = JSON.stringify({
        file: {
          key: 'error.file.array.max',
          params: {
            limit: 100
          }
        }
      });

      const response = await server.inject(req);
      expect(response.statusCode).toBe(400);
      expect(response.payload).toEqual(expected);
    });

    it("should return 403 Unauthorised", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      expect(mockGetCacheLandings).not.toHaveBeenCalled();
      expect(mockInvalidateCache).not.toHaveBeenCalled();
      const response = await server.inject(req);
      expect(response.statusCode).toBe(403);
    });

    it("should return 500 Internal Server Error if any errors occur", async () => {
      const error = new Error('some error');
      mockGetCacheLandings.mockRejectedValue(error);
      const response = await server.inject(req);
      expect(response.statusCode).toBe(500);
      expect(mockLoggerError).toHaveBeenCalledWith(`[SAVE-UPLOAD-FILE][ERROR][${error}]`);
    });
  });

  describe("POST v2/clear/landings", () => {

    const req: any = {
      url: "/v2/clear/landings",
      method: "post",
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      headers: {
        documentNumber: 'DOCUMENT123'
      }
    };

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    };

    let mockValidateDocumentOwnership;
    let mockLoggerError;
    let mockInvalidateCache;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, "validateDocumentOwnership");
      mockValidateDocumentOwnership.mockResolvedValue(document);

      mockLoggerError = jest.spyOn(logger, 'error');

      mockInvalidateCache = jest.spyOn(UploadsController, 'invalidateCacheUploadedRows');
      mockInvalidateCache.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 200 OK", async () => {
      const response = await server.inject(req);

      expect(mockInvalidateCache).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.payload).toEqual(JSON.stringify([]));
    });

    it("should return 403 Unauthorised", async () => {
      mockValidateDocumentOwnership.mockResolvedValue(undefined);
      expect(mockInvalidateCache).not.toHaveBeenCalled();
      const response = await server.inject(req);
      expect(response.statusCode).toBe(403);
    });

    it("should return 500 Internal Server Error if any errors occur", async () => {
      const error = new Error('some error');
      mockInvalidateCache.mockRejectedValue(error);
      const response = await server.inject(req);
      expect(response.statusCode).toBe(500);
      expect(mockLoggerError).toHaveBeenCalledWith(`[CLEAR-UPLOAD-FILE][ERROR][${error}]`);
    });
  });
});
