import * as Hapi from "@hapi/hapi";
import { IUploadedLanding } from "../persistence/schema/uploads";
import * as ErrorExtractor from "../helpers/errorExtractor";
import * as Utils from "../helpers/utils/utils";
import * as FrontEndPayload from "../persistence/schema/frontEndModels/payload";
import * as FishValidator from "../validators/fish.validator";
import * as ReferenceDataService from "../services/reference-data.service";
import * as FavouritesService from "../persistence/services/favourites";
import UploadsService from "../services/uploads.service";
import FavouritesController from "../controllers/favourites.controller";
import UploadsController from "./uploads.controller";
import ExportPayloadService from "../services/export-payload.service";
import { BusinessError } from "../validators/validationErrors";
import ApplicationConfig from "../applicationConfig";
import axios from "axios";

jest.mock('uuid', () => ({ v4: () => 'some-uuid' }));

describe("UploadsController", () => {

  const contactId = 'contactBob';
  const userPrincipal = 'Bob';

  describe("parseLandingsFile", () => {

    const userPrincipal = 'Bob';
    const contactId = 'Bob';
    let mockParseAndValidateLandings;
    let mockParseAndValidateLandingsService;
    let originalMaxLimitLandings;
    let mockCacheUploadRows;

    beforeAll(() => {
      ApplicationConfig.loadProperties();
    });

    beforeEach(() => {
      mockParseAndValidateLandings = jest.spyOn(UploadsController, 'validateLandings');
      mockParseAndValidateLandings.mockImplementation((_, l) => Promise.resolve(l));
      mockParseAndValidateLandingsService = jest.spyOn(UploadsService, 'parseAndValidateData');
      mockParseAndValidateLandingsService.mockImplementation((_, l) => Promise.resolve(l));
      originalMaxLimitLandings = ApplicationConfig._maxLimitLandings;
      mockCacheUploadRows = jest.spyOn(UploadsService, "cacheUploadedRows");
    });

    afterEach(() => {
      jest.restoreAllMocks();
      ApplicationConfig._maxLimitLandings = originalMaxLimitLandings;
    });

    it("should throw with no data", async () => {
      const csv = undefined;

      await expect(UploadsController.parseLandingsFile(csv, userPrincipal, contactId)).rejects.toThrow();
    });

    it("should throw", async () => {
      const csv = "";

      await expect(UploadsController.parseLandingsFile(csv, userPrincipal, contactId)).rejects.toThrow();
    });

    it("will parse a single landing", async () => {
      const csv = "PRD001,19/07/2021,FAO27,PLN1,100\n";
      const mockParseAndValidateLandingResolvedValue = [
      {
        rowNumber: 1,
        originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
        productId: "PRD001",
        landingDate: "19/07/2021",
        faoArea: "FAO27",
        vesselPln: "PLN1",
        exportWeight: "100",
        errors: []
      }
    ]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);
      expect(mockCacheUploadRows).not.toHaveBeenCalled();
      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will parse a single landing with a start date", async () => {
      const csv = "PRD001,18/07/2021,19/07/2021,FAO27,PLN1,100\n";
      const mockParseAndValidateLandingResolvedValue = [{
        rowNumber: 1,
        originalRow: "PRD001,18/07/2021,19/07/2021,FAO27,PLN1,100",
        productId: "PRD001",
        startDate: "18/07/2021",
        landingDate: "19/07/2021",
        faoArea: "FAO27",
        vesselPln: "PLN1",
        exportWeight: "100",
        errors: []
      }]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);
      expect(mockCacheUploadRows).not.toHaveBeenCalled();
      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will parse a single landing with all optional fields", async () => {
      const csv = "PRD001,18/07/2021,19/07/2021,FAO27,Yes,CHN;DEU,IOTC,PLN1,PS,100\n"; // EEZ to be added(FI0-9472)
      const mockParseAndValidateLandingResolvedValue = [{
        rowNumber: 1,
          originalRow: "PRD001,18/07/2021,19/07/2021,FAO27,YES,IOTC,PLN1,PS,100",
          productId: "PRD001",
          startDate: "18/07/2021",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          highSeasArea: "YES",
          rfmoCode: "IOTC",
          vesselPln: "PLN1",
          exportWeight: "100",
          gearCode: 'PS',
          errors: []
      }]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);
      expect(mockCacheUploadRows).not.toHaveBeenCalled();
      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will parse a single landing with gear code and no start date", async () => {
      const csv = "PRD001,19/07/2021,FAO27,PLN1,PS,100\n";
      const mockParseAndValidateLandingResolvedValue = [{
        rowNumber: 1,
        originalRow: "PRD001,19/07/2021,FAO27,PLN1,PS,100",
        productId: "PRD001",
        landingDate: "19/07/2021",
        faoArea: "FAO27",
        vesselPln: "PLN1",
        exportWeight: "100",
        gearCode: 'PS',
        errors: []
      }]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);
      expect(mockCacheUploadRows).not.toHaveBeenCalled();
      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will remove empty lines", async () => {
      const csv =
        "\n" +
        "PRD001,19/07/2021,FAO27,PLN1,100\n" +
        "PRD002,20/07/2021,FAO27,PLN2,200\n" +
        "\n" +
        "\n" +
        "PRD003,21/07/2021,FAO27,PLN3,300\n";
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
          productId: "PRD001",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN1",
          exportWeight: "100",
          errors: []
        },
        {
          rowNumber: 2,
          originalRow: "PRD002,20/07/2021,FAO27,PLN2,200",
          productId: "PRD002",
          landingDate: "20/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN2",
          exportWeight: "200",
          errors: []
        },
        {
          rowNumber: 3,
          originalRow: "PRD003,21/07/2021,FAO27,PLN3,300",
          productId: "PRD003",
          landingDate: "21/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN3",
          exportWeight: "300",
          errors: []
        }
      ]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will remove lines containing just commas and/or spaces", async () => {
      const csv =
        "PRD001,19/07/2021,FAO27,PLN1,100\n" +
        ",,,,\n" +
        ", , , ,\n" +
        "   \n" +
        "PRD003,21/07/2021,FAO27,PLN3,300\n";
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
          productId: "PRD001",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN1",
          exportWeight: "100",
          errors: []
        },
        {
          rowNumber: 2,
          originalRow: "PRD003,21/07/2021,FAO27,PLN3,300",
          productId: "PRD003",
          landingDate: "21/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN3",
          exportWeight: "300",
          errors: []
        }
      ]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue)

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);
      expect(mockParseAndValidateLandings).toHaveBeenCalledTimes(1);


      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will parse multiple landings", async () => {
      const csv =
        "PRD001,19/07/2021,FAO27,PLN1,100\n" +
        "PRD002,20/07/2021,FAO27,PLN2,200\n" +
        "PRD003,21/07/2021,FAO27,PLN3,300\n";
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
          productId: "PRD001",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN1",
          exportWeight: "100",
          errors: []
        },
        {
          rowNumber: 2,
          originalRow: "PRD002,20/07/2021,FAO27,PLN2,200",
          productId: "PRD002",
          landingDate: "20/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN2",
          exportWeight: "200",
          errors: []
        },
        {
          rowNumber: 3,
          originalRow: "PRD003,21/07/2021,FAO27,PLN3,300",
          productId: "PRD003",
          landingDate: "21/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN3",
          exportWeight: "300",
          errors: []
        }
      ]
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue)

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will capitalize every row before parsing them", async () => {
      const csv =
        "prd001,19/07/2021,fao27,pln1,100\n" +
        "prd002,20/07/2021,fao27,pln2,200\n" +
        "prd003,21/07/2021,fao27,pln3,300\n";

      await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(mockParseAndValidateLandings).toHaveBeenCalledWith(userPrincipal,
        [
        "PRD001,19/07/2021,FAO27,PLN1,100",
        "PRD002,20/07/2021,FAO27,PLN2,200",
        "PRD003,21/07/2021,FAO27,PLN3,300",
        ]
    );
    });

    it("will strip empty rows before parsing them", async () => {
      const csv =
        "PRD001,19/07/2021,FAO27,PLN1,100\n" +
        "\n" +
        "PRD002,20/07/2021,FAO27,PLN2,200\n" +
        "PRD003,21/07/2021,FAO27,PLN3,300\n";

      await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(mockParseAndValidateLandings).toHaveBeenCalledWith(userPrincipal,
        [
        "PRD001,19/07/2021,FAO27,PLN1,100",
        "PRD002,20/07/2021,FAO27,PLN2,200",
        "PRD003,21/07/2021,FAO27,PLN3,300",
        ]
      );
    });

    it("will throw an error if there are too many landings", async () => {
      ApplicationConfig._maxLimitLandings = 2;

      const csv =
        "PRD001,19/07/2021,FAO27,PLN1,100\n" +
        "PRD002,20/07/2021,FAO27,PLN2,200\n" +
        "PRD003,21/07/2021,FAO27,PLN3,300\n";

      await expect(async () => UploadsController.parseLandingsFile(csv, userPrincipal, contactId))
        .rejects
        .toThrow("error.upload.max-landings");
    });

    it("will call validateLandings with all the parsed landings", async () => {

      const csv = "PRD001,19/07/2021,FAO27,PLN1,100"

      await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(mockParseAndValidateLandings).toHaveBeenCalledWith(userPrincipal, [csv]);
    });

    it("will return the response back from validateLandings", async () => {
      const csv = "PRD001,19/07/2021,FAO27,PLN1,100";
      const response = ["validated landing 1", "validated landing 2"];

      mockParseAndValidateLandings.mockResolvedValue(response);

      const result = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId);

      expect(result).toStrictEqual(response);
    });

    it("will bubble up any errors from validateLandings", async () => {
      const csv = "PRD001,19/07/2021,FAO27,PLN1,100";
      const error = new Error("something went wrong");

      mockParseAndValidateLandings.mockRejectedValue(error);

      await expect(async () =>
        UploadsController.parseLandingsFile(csv, userPrincipal, contactId)
      ).rejects.toThrow(error);
    });

    it("will cache the validated rows", async () => {
      const csv = "PRD001,19/07/2021,FAO27,PLN1,100\n";

      const output = await UploadsController.parseLandingsFile(csv, userPrincipal, contactId, true);
      expect(mockCacheUploadRows).toHaveBeenCalledTimes(1);
      expect(mockCacheUploadRows).toHaveBeenCalledWith(userPrincipal, contactId, output);
    });

  });

  describe("saveLandingRows", () => {
    const vessel: FrontEndPayload.Vessel = {
      cfr: 'some-cfr',
      flag: 'some-flag',
      homePort: 'some-home-port',
      imoNumber: 'some-imo-number',
      licenceNumber: 'some-licence-number',
      licenceValidTo: 'some-licence-valid-to',
      pln: 'some-pln',
      rssNumber: 'some-rss-number',
      vesselLength: 10,
      vesselName: 'some-vessel-name'
    };

    const mockCode: any = jest.fn();
    const mockResponse: any = jest.fn()
      .mockImplementation(() => ({
        code: mockCode
      }));
    const mockRedirect: any = jest.fn();

    const h = {
      response: mockResponse,
      redirect: mockRedirect
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

    const USER = 'Bob';
    const documentNumber = '123Document-CC-123';
    const businessError: BusinessError = {
      isError: false,
      error: null
    };

    let req;
    let mockBuildRedirectUrlWithErrorStringInQueryParam;
    let mockGetRandomNumber;
    let mockGetExportPayload;
    let mockSaveExportPayload;
    let mockFishValidator;
    let mockSearchVessel;
    let mockFavourites;
    let mockFavouritesRemove;
    let mockParseAndValidateLandings;
    let originalMaxLimitLandings;

    beforeAll(() => {
      ApplicationConfig.loadProperties();
    })

    beforeEach(() => {
      const rows: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        startDate: 'some-start-date',
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [
          'error.dateLanded.date.base',
          'error.faoArea.any.invalid'
        ],
      }];

      req = {
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

      const exportPayload: FrontEndPayload.ProductsLanded = {
        items: []
      };

      mockBuildRedirectUrlWithErrorStringInQueryParam = jest.spyOn(ErrorExtractor, 'buildRedirectUrlWithErrorStringInQueryParam');
      mockBuildRedirectUrlWithErrorStringInQueryParam.mockReturnValue('some-url');

      mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
      mockGetExportPayload.mockResolvedValue(exportPayload);

      mockSaveExportPayload = jest.spyOn(ExportPayloadService, 'save');
      mockSaveExportPayload.mockResolvedValue(undefined);

      mockGetRandomNumber = jest.spyOn(Utils, 'getRandomNumber');
      mockGetRandomNumber.mockReturnValue('random-number');

      mockFavourites = jest.spyOn(FavouritesService, 'readFavouritesProducts');
      mockFavourites.mockResolvedValue([{
        id: 'some-product-id',
        species: 'species',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      }, {
        id: 'some-product-id-1',
        species: 'species 1',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      }, {
        id: 'some-product-id-2',
        species: 'species 2',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      }]);

      mockFavouritesRemove = jest.spyOn(FavouritesController, 'removeInvalidFavouriteProduct');
      mockFavouritesRemove.mockResolvedValue(undefined);

      mockFishValidator = jest.spyOn(FishValidator, 'validateSpeciesWithReferenceData');
      mockFishValidator.mockResolvedValue(businessError);

      mockSearchVessel = jest.spyOn(ReferenceDataService, 'searchVessel');
      mockSearchVessel.mockResolvedValue([vessel]);

      mockParseAndValidateLandings = jest.spyOn(UploadsController, 'validateLandings');
      mockParseAndValidateLandings.mockImplementation((_, l) => Promise.resolve(l));

      originalMaxLimitLandings = ApplicationConfig._maxLimitLandings;
    });

    afterEach(() => {
      jest.restoreAllMocks();

      ApplicationConfig._maxLimitLandings = originalMaxLimitLandings;
    });

    it('should redirect if JS is not enabled', async () => {
      const mockReq: any = {
        ...req,
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected = { file: 'error.file.any.required' };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockBuildRedirectUrlWithErrorStringInQueryParam).toHaveBeenCalledWith(expected, '/create-catch-certificate/:documentNumber/upload-file');
      expect(mockRedirect).toHaveBeenCalledWith('some-url');
    });

    it('should return 400 Bad Request if there are no valid rows', async () => {
      const expected = { file: 'error.file.any.required' };
      mockParseAndValidateLandings.mockResolvedValue(req.payload.file);

      await UploadsController.saveLandingRows(req, h, USER, documentNumber, contactId, req.payload.file);
      expect(mockResponse).toHaveBeenCalledWith(expected);
      expect(mockCode).toHaveBeenCalledWith(400);
    });

    it('should return 200 OK if errors is not defined', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            rowNumber: 1,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: []
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }]
        }
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK with start date', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            rowNumber: 1,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            startDate: '10/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: []
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }]
        }
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK with gear details', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            rowNumber: 1,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            startDate: '10/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            gearCode: 'LA',
            gearCategory: 'Surrounding nets',
            gearName: 'Surrounding nets without purse lines',
            errors: []
          }]
        }
      };

      const expected = {
        items: [
          {
            landings: [
              {
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 10,
                  faoArea: "FAO18",
                  id: "123Document-CC-123-random-number",
                  startDate: "2020-10-10",
                  vessel: {
                    cfr: "some-cfr",
                    flag: "some-flag",
                    homePort: "some-home-port",
                    imoNumber: "some-imo-number",
                    licenceNumber: "some-licence-number",
                    licenceValidTo: "some-licence-valid-to",
                    pln: "some-pln",
                    rssNumber: "some-rss-number",
                    vesselLength: 10,
                    vesselName: "some-vessel-name",
                  },
                  exclusiveEconomicZones: [],
                  highSeasArea: undefined,
                  rfmo: "",
                  gearCategory: 'Surrounding nets',
                  gearType: 'Surrounding nets without purse lines (LA)',
                },
              },
            ],
            product: {
              commodityCode: "some-commidity-code",
              commodityCodeAdmin: undefined,
              commodityCodeDescription: "some-commmodity-description",
              factor: undefined,
              id: "123Document-CC-123-some-uuid",
              presentation: {
                admin: undefined,
                code: "some-presentation",
                label: "some-presentation-label",
              },
              scientificName: "some-scientic-name",
              species: {
                admin: undefined,
                code: "species-code",
                label: "species",
              },
              state: {
                admin: undefined,
                code: "some-state",
                label: "some-label",
              },
            },
          },
        ]
      }
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);

      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK with rfmo details', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            rowNumber: 1,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            startDate: '10/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            rfmoCode: 'IOTC',
            rfmoName: 'Indian Ocean Tuna Commission (IOTC)',
            errors: []
          }]
        }
      };

      const expected = {
        items: [
          {
            landings: [
              {
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 10,
                  faoArea: "FAO18",
                  id: "123Document-CC-123-random-number",
                  startDate: "2020-10-10",
                  vessel: {
                    cfr: "some-cfr",
                    flag: "some-flag",
                    homePort: "some-home-port",
                    imoNumber: "some-imo-number",
                    licenceNumber: "some-licence-number",
                    licenceValidTo: "some-licence-valid-to",
                    pln: "some-pln",
                    rssNumber: "some-rss-number",
                    vesselLength: 10,
                    vesselName: "some-vessel-name",
                  },
                  exclusiveEconomicZones: [],
                  highSeasArea: undefined,
                  rfmo: 'Indian Ocean Tuna Commission (IOTC)',
                  gearCategory: '',
                  gearType: '',
                },
              },
            ],
            product: {
              commodityCode: "some-commidity-code",
              commodityCodeAdmin: undefined,
              commodityCodeDescription: "some-commmodity-description",
              factor: undefined,
              id: "123Document-CC-123-some-uuid",
              presentation: {
                admin: undefined,
                code: "some-presentation",
                label: "some-presentation-label",
              },
              scientificName: "some-scientic-name",
              species: {
                admin: undefined,
                code: "species-code",
                label: "species",
              },
              state: {
                admin: undefined,
                code: "some-state",
                label: "some-label",
              },
            },
          },
        ]
      }
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);

      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK with High seas area details', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            rowNumber: 1,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            startDate: '10/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            highSeasArea: 'Yes',
            errors: []
          }]
        }
      };

      const expected = {
        items: [
          {
            landings: [
              {
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 10,
                  faoArea: "FAO18",
                  id: "123Document-CC-123-random-number",
                  startDate: "2020-10-10",
                  vessel: {
                    cfr: "some-cfr",
                    flag: "some-flag",
                    homePort: "some-home-port",
                    imoNumber: "some-imo-number",
                    licenceNumber: "some-licence-number",
                    licenceValidTo: "some-licence-valid-to",
                    pln: "some-pln",
                    rssNumber: "some-rss-number",
                    vesselLength: 10,
                    vesselName: "some-vessel-name",
                  },
                  exclusiveEconomicZones: [],
                  highSeasArea: 'yes',
                  rfmo: '',
                  gearCategory: '',
                  gearType: '',
                },
              },
            ],
            product: {
              commodityCode: "some-commidity-code",
              commodityCodeAdmin: undefined,
              commodityCodeDescription: "some-commmodity-description",
              factor: undefined,
              id: "123Document-CC-123-some-uuid",
              presentation: {
                admin: undefined,
                code: "some-presentation",
                label: "some-presentation-label",
              },
              scientificName: "some-scientic-name",
              species: {
                admin: undefined,
                code: "species-code",
                label: "species",
              },
              state: {
                admin: undefined,
                code: "some-state",
                label: "some-label",
              },
            },
          },
        ]
      }
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);

      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    //EEZ Details to be added(FI0-9472)

    it('should return 200 OK with provided rows', async () => {
      const file: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        landingDate: '10/10/2020',
        faoArea: 'FAO18',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: []
      }, {
        rowNumber: 2,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        landingDate: '10/10/2020',
        faoArea: 'FAO18',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      }];

      const mockReq: any = {
        ...req,
        url: "/v2/save/landings",
        payload: {}
      };
      mockParseAndValidateLandings.mockResolvedValue(file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, file);
      expect(mockSaveExportPayload).toHaveBeenCalled();
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK if we have one row where errors is not defined', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
          }]
        }
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK if we have one row where errors is null', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: null
          }]
        }
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK if there is at least one valid row', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            ...req.payload.file[0]
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }]
        },
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        startDate: 'some-start-date',
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [
          'error.dateLanded.date.base',
          'error.faoArea.any.invalid',
        ],
      }, {
        rowNumber: 2,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        landingDate: '10/10/2020',
        faoArea: 'FAO18',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      }];
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockResponse).toHaveBeenCalledWith(expected);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should return 200 OK if there is at least one valid row with a start date', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            ...req.payload.file[0]
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id',
            product: {
              id: 'some-product-id',
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
            startDate: '10/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }]
        },
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected: IUploadedLanding[] = [{
        rowNumber: 1,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        startDate: 'some-start-date',
        landingDate: 'some-landing-date',
        faoArea: 'faoArea',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [
          'error.dateLanded.date.base',
          'error.faoArea.any.invalid',
        ],
      }, {
        rowNumber: 2,
        originalRow: 'some-string',
        productId: 'some-product-id',
        product: {
          id: 'some-product-id',
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
        startDate: '10/10/2020',
        landingDate: '10/10/2020',
        faoArea: 'FAO18',
        vessel: vessel,
        vesselPln: 'some-pln',
        exportWeight: 10,
        errors: [],
      }];
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockResponse).toHaveBeenCalledWith(expected);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it('should attempt to save products for only valid landings', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            ...req.payload.file[0]
          }, {
            rowNumber: 2,
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
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }]
        },
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected: FrontEndPayload.ProductsLanded = {
        items: [{
          product: {
            id: '123Document-CC-123-some-uuid',
            species: {
              code: 'species-code',
              label: 'species'
            },
            scientificName: 'some-scientic-name',
            state: {
              code: 'some-state',
              label: 'some-label'
            },
            presentation: {
              code: 'some-presentation',
              label: 'some-presentation-label'
            },
            commodityCode: 'some-commidity-code',
            commodityCodeDescription: 'some-commmodity-description',
          },
          landings: [{
            model: {
              id: `${documentNumber}-random-number`,
              vessel: {
                cfr: 'some-cfr',
                flag: 'some-flag',
                homePort: 'some-home-port',
                imoNumber: 'some-imo-number',
                licenceNumber: 'some-licence-number',
                licenceValidTo: 'some-licence-valid-to',
                pln: 'some-pln',
                rssNumber: 'some-rss-number',
                vesselLength: 10,
                vesselName: 'some-vessel-name'
              },
              startDate: undefined,
              dateLanded: '2020-10-10',
              exportWeight: 10,
              faoArea: 'FAO18',
              exclusiveEconomicZones: [],
              highSeasArea: undefined,
              rfmo: '',
              gearCategory: '',
              gearType: '',
            }
          }]
        }]
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
    });

    it('should attempt to save multiple products for only valid landings', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            ...req.payload.file[0]
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id-1',
            product: {
              species: 'species 1',
              speciesCode: 'species-code',
              scientificName: 'some-scientic-name',
              state: 'some-state',
              stateLabel: 'some-label',
              presentation: 'some-presentation',
              presentationLabel: 'some-presentation-label',
              commodity_code: 'some-commidity-code',
              commodity_code_description: 'some-commmodity-description',
            },
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }, {
            rowNumber: 3,
            originalRow: 'some-string',
            productId: 'some-product-id-2',
            product: {
              id: 'some-product-id-2',
              species: 'species 2',
              speciesCode: 'species-code',
              scientificName: 'some-scientic-name',
              state: 'some-state',
              stateLabel: 'some-label',
              presentation: 'some-presentation',
              presentationLabel: 'some-presentation-label',
              commodity_code: 'some-commidity-code',
              commodity_code_description: 'some-commmodity-description',
            },
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 20,
            errors: [],
          }]
        },
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected: FrontEndPayload.ProductsLanded = {
        items: [{
          product: {
            id: '123Document-CC-123-some-uuid',
            species: {
              code: 'species-code',
              label: 'species 1'
            },
            scientificName: 'some-scientic-name',
            state: {
              code: 'some-state',
              label: 'some-label'
            },
            presentation: {
              code: 'some-presentation',
              label: 'some-presentation-label'
            },
            commodityCode: 'some-commidity-code',
            commodityCodeDescription: 'some-commmodity-description',
          },
          landings: [{
            model: {
              id: `${documentNumber}-random-number`,
              vessel: {
                cfr: 'some-cfr',
                flag: 'some-flag',
                homePort: 'some-home-port',
                imoNumber: 'some-imo-number',
                licenceNumber: 'some-licence-number',
                licenceValidTo: 'some-licence-valid-to',
                pln: 'some-pln',
                rssNumber: 'some-rss-number',
                vesselLength: 10,
                vesselName: 'some-vessel-name'
              },
              dateLanded: '2020-10-10',
              exportWeight: 10,
              faoArea: 'FAO18',
              startDate: undefined,
              exclusiveEconomicZones: [],
              highSeasArea: undefined,
              rfmo: '',
              gearCategory: '',
              gearType: ''
            }
          }]
        },
        {
          product: {
            id: '123Document-CC-123-some-uuid',
            species: {
              code: 'species-code',
              label: 'species 2'
            },
            scientificName: 'some-scientic-name',
            state: {
              code: 'some-state',
              label: 'some-label'
            },
            presentation: {
              code: 'some-presentation',
              label: 'some-presentation-label'
            },
            commodityCode: 'some-commidity-code',
            commodityCodeDescription: 'some-commmodity-description',
          },
          landings: [{
            model: {
              id: `${documentNumber}-random-number`,
              vessel: {
                cfr: 'some-cfr',
                flag: 'some-flag',
                homePort: 'some-home-port',
                imoNumber: 'some-imo-number',
                licenceNumber: 'some-licence-number',
                licenceValidTo: 'some-licence-valid-to',
                pln: 'some-pln',
                rssNumber: 'some-rss-number',
                vesselLength: 10,
                vesselName: 'some-vessel-name'
              },
              dateLanded: '2020-10-10',
              exportWeight: 20,
              faoArea: 'FAO18',startDate: undefined,
              exclusiveEconomicZones: [],
              highSeasArea: undefined,
              rfmo: '',
              gearCategory: '',
              gearType: ''
            }
          }]
        }]
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
    });

    it('should attempt to save multiple products for only valid landings with a start date', async () => {
      const mockReq: any = {
        ...req,
        payload: {
          ...req.payload,
          file: [{
            ...req.payload.file[0]
          }, {
            rowNumber: 2,
            originalRow: 'some-string',
            productId: 'some-product-id-1',
            product: {
              species: 'species 1',
              speciesCode: 'species-code',
              scientificName: 'some-scientic-name',
              state: 'some-state',
              stateLabel: 'some-label',
              presentation: 'some-presentation',
              presentationLabel: 'some-presentation-label',
              commodity_code: 'some-commidity-code',
              commodity_code_description: 'some-commmodity-description',
            },
            startDate: '09/10/2020',
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 10,
            errors: [],
          }, {
            rowNumber: 3,
            originalRow: 'some-string',
            productId: 'some-product-id-2',
            product: {
              id: 'some-product-id-2',
              species: 'species 2',
              speciesCode: 'species-code',
              scientificName: 'some-scientic-name',
              state: 'some-state',
              stateLabel: 'some-label',
              presentation: 'some-presentation',
              presentationLabel: 'some-presentation-label',
              commodity_code: 'some-commidity-code',
              commodity_code_description: 'some-commmodity-description',
            },
            landingDate: '10/10/2020',
            faoArea: 'FAO18',
            vessel: vessel,
            vesselPln: 'some-pln',
            exportWeight: 20,
            errors: [],
          }]
        },
        headers: {
          ...req.headers,
          accept: 'text/html'
        },
      };

      const expected: FrontEndPayload.ProductsLanded = {
        items: [{
          product: {
            id: '123Document-CC-123-some-uuid',
            species: {
              code: 'species-code',
              label: 'species 1'
            },
            scientificName: 'some-scientic-name',
            state: {
              code: 'some-state',
              label: 'some-label'
            },
            presentation: {
              code: 'some-presentation',
              label: 'some-presentation-label'
            },
            commodityCode: 'some-commidity-code',
            commodityCodeDescription: 'some-commmodity-description',
          },
          landings: [{
            model: {
              id: `${documentNumber}-random-number`,
              vessel: {
                cfr: 'some-cfr',
                flag: 'some-flag',
                homePort: 'some-home-port',
                imoNumber: 'some-imo-number',
                licenceNumber: 'some-licence-number',
                licenceValidTo: 'some-licence-valid-to',
                pln: 'some-pln',
                rssNumber: 'some-rss-number',
                vesselLength: 10,
                vesselName: 'some-vessel-name'
              },
              startDate: '2020-10-09',
              dateLanded: '2020-10-10',
              exportWeight: 10,
              faoArea: 'FAO18',
              exclusiveEconomicZones: [],
              highSeasArea: undefined,
              rfmo: '',
              gearCategory: '',
              gearType: '',
            }
          }]
        },
        {
          product: {
            id: '123Document-CC-123-some-uuid',
            species: {
              code: 'species-code',
              label: 'species 2'
            },
            scientificName: 'some-scientic-name',
            state: {
              code: 'some-state',
              label: 'some-label'
            },
            presentation: {
              code: 'some-presentation',
              label: 'some-presentation-label'
            },
            commodityCode: 'some-commidity-code',
            commodityCodeDescription: 'some-commmodity-description',
          },
          landings: [{
            model: {
              id: `${documentNumber}-random-number`,
              vessel: {
                cfr: 'some-cfr',
                flag: 'some-flag',
                homePort: 'some-home-port',
                imoNumber: 'some-imo-number',
                licenceNumber: 'some-licence-number',
                licenceValidTo: 'some-licence-valid-to',
                pln: 'some-pln',
                rssNumber: 'some-rss-number',
                vesselLength: 10,
                vesselName: 'some-vessel-name'
              },
              dateLanded: '2020-10-10',
              exportWeight: 20,
              faoArea: 'FAO18',
              exclusiveEconomicZones: [],
              highSeasArea: undefined,
              rfmo: '',
              gearCategory: '',
              gearType: '',
            }
          }]
        }]
      };
      mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

      await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
      expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
      expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
    });

    describe('when exportPayload is undefined', () => {

      beforeEach(() => {
        mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
        mockGetExportPayload.mockResolvedValue(undefined);
      });

      it('should attempt to save products for only valid landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 10,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                startDate: undefined,
                dateLanded: '2020-10-10',
                exportWeight: 10,
                faoArea: 'FAO18',
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }]
          }]
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      });

      it('should attempt to save duplicate products', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 10,
              errors: [],
            }, {
              rowNumber: 3,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 10,
              errors: [],
            }, {
              rowNumber: 4,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: '2020-10-10',
                exportWeight: 10,
                faoArea: 'FAO18',
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }, {
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: '2020-10-10',
                exportWeight: 10,
                faoArea: 'FAO18',
                startDate: undefined,
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }, {
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                startDate: undefined,
                dateLanded: '2020-10-10',
                exportWeight: 100,
                faoArea: 'FAO18',
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }]
          }]
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      });
    });

    describe('when exportPayload contains a pre-existing product', () => {

      beforeEach(() => {
        const exportPayload: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: 'some-landing-date',
                exportWeight: 10,
                faoArea: 'faoArea'
              }
            }]
          }]
        };

        mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
        mockGetExportPayload.mockResolvedValue(exportPayload);

        ApplicationConfig._maxLimitLandings = 5;
      });

      it('should return 400 Bad Request if the total number of landings exceed the max limit landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 3,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 4,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 5,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 6,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          }
        };

        const expected = {
          file:
          {
            key: 'error.upload.max-landings',
            params: {
              limit: 5
            }
          }
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockResponse).toHaveBeenCalledWith(expected);
        expect(mockCode).toHaveBeenCalledWith(400);
      });

      it('should redirect if JS is not enabled and the total number of landings exceed the max limit landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 3,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 4,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 5,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }, {
              rowNumber: 6,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected = {
          file:
          {
            key: 'error.upload.max-landings',
            params: {
              limit: 5
            }
          }
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockBuildRedirectUrlWithErrorStringInQueryParam).toHaveBeenCalledWith(expected, '/create-catch-certificate/:documentNumber/upload-file');
        expect(mockRedirect).toHaveBeenCalledWith('some-url');
      });

      it('should attempt to save products for only valid landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: 'some-landing-date',
                exportWeight: 10,
                faoArea: 'faoArea'
              }
            },
            {
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: '2020-10-10',
                exportWeight: 100,
                faoArea: 'FAO18',
                startDate: undefined,
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }]
          }]
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      });
    });

    describe('when exportPayload does not contains a pre-existing product', () => {

      beforeEach(() => {
        const exportPayload: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code-bad',
                label: 'species-bad'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state-bad',
                label: 'some-label-bad'
              },
              presentation: {
                code: 'some-presentation-bad',
                label: 'some-presentation-label-bad'
              },
              commodityCode: 'some-commidity-code-bad',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: 'some-landing-date',
                exportWeight: 10,
                faoArea: 'faoArea'
              }
            }]
          }]
        };

        mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
        mockGetExportPayload.mockResolvedValue(exportPayload);
      });

      it('should attempt to save products for only valid landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code-bad',
                label: 'species-bad'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state-bad',
                label: 'some-label-bad'
              },
              presentation: {
                code: 'some-presentation-bad',
                label: 'some-presentation-label-bad'
              },
              commodityCode: 'some-commidity-code-bad',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: 'some-landing-date',
                exportWeight: 10,
                faoArea: 'faoArea'
              }
            }]
          }, {
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            }, landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: '2020-10-10',
                exportWeight: 100,
                faoArea: 'FAO18',
                startDate: undefined,
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }]
          }]
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      });
    });

    describe('when exportPayload contains a pre-existing product with no landings', () => {

      beforeEach(() => {
        const exportPayload: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            }
          }]
        };

        mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
        mockGetExportPayload.mockResolvedValue(exportPayload);
      });

      it('should attempt to save products for only valid landings', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 100,
              errors: [],
            }]
          },
          headers: {
            ...req.headers,
            accept: 'text/html'
          },
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            product: {
              id: '123Document-CC-123-some-uuid',
              species: {
                code: 'species-code',
                label: 'species'
              },
              scientificName: 'some-scientic-name',
              state: {
                code: 'some-state',
                label: 'some-label'
              },
              presentation: {
                code: 'some-presentation',
                label: 'some-presentation-label'
              },
              commodityCode: 'some-commidity-code',
              commodityCodeDescription: 'some-commmodity-description',
            },
            landings: [{
              model: {
                id: `${documentNumber}-random-number`,
                vessel: {
                  cfr: 'some-cfr',
                  flag: 'some-flag',
                  homePort: 'some-home-port',
                  imoNumber: 'some-imo-number',
                  licenceNumber: 'some-licence-number',
                  licenceValidTo: 'some-licence-valid-to',
                  pln: 'some-pln',
                  rssNumber: 'some-rss-number',
                  vesselLength: 10,
                  vesselName: 'some-vessel-name'
                },
                dateLanded: '2020-10-10',
                exportWeight: 100,
                faoArea: 'FAO18',
                startDate: undefined,
                exclusiveEconomicZones: [],
                highSeasArea: undefined,
                rfmo: '',
                gearCategory: '',
                gearType: '',
              }
            }]
          }]
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);
        expect(mockGetExportPayload).toHaveBeenCalledWith(USER, documentNumber, contactId);
        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
      });
    });

    describe('when validation fails on saving the landings rows', () => {

      it('should return 400 Bad Request if there are no valid rows', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
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
              landingDate: undefined,
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 10,
              errors: ['error.dateLanded.date.missing'],
            }]
          }
        };
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        const expected: { file: string } = { file: 'error.file.any.required' };

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);

        expect(mockSaveExportPayload).not.toHaveBeenCalled();
        expect(mockResponse).toHaveBeenCalledWith(expected);
        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockReq.payload.file[0].errors).toEqual(['error.dateLanded.date.base', 'error.faoArea.any.invalid']);
        expect(mockReq.payload.file[1].errors).toEqual(['error.dateLanded.date.missing']);
      });

      it('should return 200 OK if there is at least one valid row', async () => {
        const mockReq: any = {
          ...req,
          payload: {
            ...req.payload,
            file: [{
              ...req.payload.file[0]
            }, {
              rowNumber: 2,
              originalRow: 'some-string',
              productId: 'some-product-id',
              product: {
                id: 'some-product-id',
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
              landingDate: undefined,
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 10,
              errors: ['error.dateLanded.date.missing'],
            }, {
              rowNumber: 3,
              originalRow: 'some-string',
              productId: 'some-product-id',
              product: {
                id: 'some-product-id',
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
              landingDate: '10/10/2020',
              faoArea: 'FAO18',
              vessel: vessel,
              vesselPln: 'some-pln',
              exportWeight: 2000,
              errors: [],
            }]
          }
        };

        const expected: FrontEndPayload.ProductsLanded = {
          items: [{
            landings: [
              {
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 2000,
                  faoArea: "FAO18",
                  startDate: undefined,
                  exclusiveEconomicZones: [],
                  highSeasArea: undefined,
                  rfmo: '',
                  gearCategory: '',
                  gearType: '',
                  id: "123Document-CC-123-random-number",
                  vessel: {
                    cfr: "some-cfr",
                    flag: "some-flag",
                    homePort: "some-home-port",
                    imoNumber: "some-imo-number",
                    licenceNumber: "some-licence-number",
                    licenceValidTo: "some-licence-valid-to",
                    pln: "some-pln",
                    rssNumber: "some-rss-number",
                    vesselLength: 10,
                    vesselName: "some-vessel-name",
                  },
                },
              },
            ],
            product: {
              commodityCode: "some-commidity-code",
              commodityCodeDescription: "some-commmodity-description",
              factor: undefined,
              id: "123Document-CC-123-some-uuid",
              presentation: {
                code: "some-presentation",
                label: "some-presentation-label",
              },
              scientificName: "some-scientic-name",
              species: {
                code: "species-code",
                label: "species",
              },
              state: {
                code: "some-state",
                label: "some-label",
              },
            },
          }]
        };

        const response: IUploadedLanding[] = [{
          rowNumber: 1,
          originalRow: 'some-string',
          productId: 'some-product-id',
          product: {
            id: 'some-product-id',
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
          startDate: 'some-start-date',
          landingDate: 'some-landing-date',
          faoArea: 'faoArea',
          vessel: vessel,
          vesselPln: 'some-pln',
          exportWeight: 10,
          errors: ['error.dateLanded.date.base', 'error.faoArea.any.invalid'],
        }, {
          rowNumber: 2,
          originalRow: 'some-string',
          productId: 'some-product-id',
          product: {
            id: 'some-product-id',
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
          landingDate: undefined,
          faoArea: 'FAO18',
          vessel: vessel,
          vesselPln: 'some-pln',
          exportWeight: 10,
          errors: ['error.dateLanded.date.missing'],
        }, {
          rowNumber: 3,
          originalRow: 'some-string',
          productId: 'some-product-id',
          product: {
            id: 'some-product-id',
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
          landingDate: '10/10/2020',
          faoArea: 'FAO18',
          vessel: vessel,
          vesselPln: 'some-pln',
          exportWeight: 2000,
          errors: [],
        }];
        mockParseAndValidateLandings.mockResolvedValue(mockReq.payload.file);

        await UploadsController.saveLandingRows(mockReq, h, USER, documentNumber, contactId, mockReq.payload.file);

        expect(mockSaveExportPayload).toHaveBeenCalledWith(expected, USER, documentNumber, contactId);
        expect(mockResponse).toHaveBeenCalledWith(response);
        expect(mockCode).toHaveBeenCalledWith(200);
      });
    });
  });

  describe("parseRows", () => {
    let mockReadFavouriteProducts;
    let mockParseAndValidateLandings;
    const favourites = ['product 1', 'product 2'] as any;
    beforeEach(() => {
      mockReadFavouriteProducts = jest.spyOn(FavouritesService, 'readFavouritesProducts');
      mockReadFavouriteProducts.mockResolvedValue(favourites);
      mockParseAndValidateLandings = jest.spyOn(UploadsService, 'parseAndValidateData');
    });

    it("will parse a single landing", async () => {
      const rows = ["PRD001,19/07/2021,FAO27,PLN1,100"];
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
          productId: "PRD001",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN1",
          exportWeight: "100",
          errors: []
        }
      ];
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.validateLandings(userPrincipal, rows);

      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will parse multiple landings", async () => {
      const rows = [
        "PRD001,19/07/2021,FAO27,PLN1,100",
        "PRD002,20/07/2021,FAO27,PLN2,200",
        "PRD003,21/07/2021,FAO27,PLN3,300"
      ]
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "PRD001,19/07/2021,FAO27,PLN1,100",
          productId: "PRD001",
          landingDate: "19/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN1",
          exportWeight: "100",
          errors: []
        },
        {
          rowNumber: 2,
          originalRow: "PRD002,20/07/2021,FAO27,PLN2,200",
          productId: "PRD002",
          landingDate: "20/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN2",
          exportWeight: "200",
          errors: []
        },
        {
          rowNumber: 3,
          originalRow: "PRD003,21/07/2021,FAO27,PLN3,300",
          productId: "PRD003",
          landingDate: "21/07/2021",
          faoArea: "FAO27",
          vesselPln: "PLN3",
          exportWeight: "300",
          errors: []
        }
      ];
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.validateLandings(userPrincipal, rows);

      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

    it("will throw an error if a row is missing data", async () => {
      const rows = [
        "PRD001,19/07/2021,FAO27,PLN1,100",
        "PRD002,20/07/2021,FAO27,PLN2"
      ];
      mockParseAndValidateLandings.mockRejectedValue(new Error(""));
      await expect(async () =>
        UploadsController.validateLandings(userPrincipal, rows)
      ).rejects.toThrow();
    });

    it("will throw an error if a row has excess data", async () => {
      const rows = [
        "PRD001,19/07/2021,FAO27,PLN1,100",
        "PRD002,19/07/2021,20/07/2021,FAO27,Yes,IOTC,PLN2,PS,200,bob"
      ];
      mockParseAndValidateLandings.mockRejectedValue(new Error(""));
      await expect(async () =>
        UploadsController.validateLandings(userPrincipal, rows)
      ).rejects.toThrow();
    });

    it("will not validate any field data", async () => {
      const rows = [
        "X,X,X,X,X"
      ];
      const mockParseAndValidateLandingResolvedValue = [
        {
          rowNumber: 1,
          originalRow: "X,X,X,X,X",
          productId: "X",
          landingDate: "X",
          faoArea: "X",
          vesselPln: "X",
          exportWeight: "X",
          errors: []
        }
      ];
      mockParseAndValidateLandings.mockResolvedValue(mockParseAndValidateLandingResolvedValue);

      const output = await UploadsController.validateLandings(userPrincipal, rows);

      expect(output).toEqual(mockParseAndValidateLandingResolvedValue);
    });

  });

  describe("validateLandings", () => {

    let mockReadFavouriteProducts;
    let mockRemoveInvalidFavouriteProduct;
    let mockGetReferenceServiceUrl;
    let mockAxiosPost;
    let mockParseAndValidateLandings;

    const userPrincipal = 'Bob';
    const landings = ['landing 1', 'landing 2'] as any;
    const favourites = ['product 1', 'product 2'] as any;
    const refServiceUrl = 'refServiceUrl';
    const responseData = [
      {
        productId: '1',
        errors: []
      },
      {
        productId: '2',
        errors: []
      }
    ];

    beforeEach(() => {
      mockReadFavouriteProducts = jest.spyOn(FavouritesService, 'readFavouritesProducts');
      mockReadFavouriteProducts.mockResolvedValue(favourites);

      mockRemoveInvalidFavouriteProduct = jest.spyOn(FavouritesController, 'removeInvalidFavouriteProduct');
      mockRemoveInvalidFavouriteProduct.mockResolvedValue(null);

      mockGetReferenceServiceUrl = jest.spyOn(ApplicationConfig, 'getReferenceServiceUrl');
      mockGetReferenceServiceUrl.mockReturnValue(refServiceUrl);

      mockAxiosPost = jest.spyOn(axios, 'post');
      mockAxiosPost.mockResolvedValue({ data: responseData });

      mockParseAndValidateLandings = jest.spyOn(UploadsService, 'parseAndValidateData');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should remove from the db any products flagged with the error.product.any.invalid error', async () => {
      const response = [
        {
          productId: 'favourite-1',
          errors: ['error 1']
        },
        {
          productId: 'favourite-2',
          errors: ['error 1', 'error.product.any.invalid']
        }
      ];

      mockParseAndValidateLandings.mockResolvedValue(response);

      const result = await UploadsController.validateLandings(userPrincipal, landings);

      expect(result).toStrictEqual(response);
      expect(mockRemoveInvalidFavouriteProduct).toHaveBeenCalledTimes(1);
      expect(mockRemoveInvalidFavouriteProduct).toHaveBeenCalledWith(userPrincipal, 'favourite-2');
    });

  });

  describe("getCacheUploadedRows", () => {
    const rows: IUploadedLanding[] = [{
      rowNumber: 1,
      originalRow: "PRD735,10/10/2020,FAO18,PH1100,100",
      productId: "PRD735",
      product: {
        species: 'Atlantic cod (COD)',
        speciesCode: 'COD',
        scientificName: 'latin atlantic cod',
        state: 'FRE',
        stateLabel: 'Fresh',
        presentation: 'WHL',
        presentationLabel: 'Whole',
        commodity_code: '0123456',
        commodity_code_description: 'some commodity code description'
      },
      landingDate: '10-10-2020',
      faoArea: 'FAO018',
      vessel: {
        pln: 'PH1100',
        vesselName: 'WIRON 5'
      },
      vesselPln: 'PH1100',
      exportWeight: 100,
      errors: []
    }];

    let mockReadRowsFromCache;

    beforeEach(() => {
      mockReadRowsFromCache = jest.spyOn(UploadsService, 'getCacheUploadedRows');
    });

    afterEach(() => {
      mockReadRowsFromCache.mockRestore();
    });

    it('should return the cache rows from redis', async () => {
      mockReadRowsFromCache.mockResolvedValue(rows);

      const result = await UploadsController.getCacheUploadedRows('Bob', 'Bob');
      expect(result).toStrictEqual(rows);
    });

    it('should return the cache rows from redis even if rows are undefined', async () => {
      mockReadRowsFromCache.mockResolvedValue(undefined);

      const result = await UploadsController.getCacheUploadedRows('Bob', 'Bob');
      expect(result).toBeUndefined();
    });

    it('should bubble up errors thrown', async () => {
      mockReadRowsFromCache.mockRejectedValue(new Error('something has gone wrong'))

      await expect(UploadsController.getCacheUploadedRows('Bob', 'Bob')).rejects.toThrow('something has gone wrong');
    });

  });

  describe("invalidateCacheUploadedRows", () => {
    const rows: IUploadedLanding[] = [{
      rowNumber: 1,
      originalRow: "PRD735,10/10/2020,FAO18,PH1100,100",
      productId: "PRD735",
      product: {
        species: 'Atlantic cod (COD)',
        speciesCode: 'COD',
        scientificName: 'latin atlantic cod',
        state: 'FRE',
        stateLabel: 'Fresh',
        presentation: 'WHL',
        presentationLabel: 'Whole',
        commodity_code: '0123456',
        commodity_code_description: 'some commodity code description'
      },
      landingDate: '10-10-2020',
      faoArea: 'FAO018',
      vessel: {
        pln: 'PH1100',
        vesselName: 'WIRON 5'
      },
      vesselPln: 'PH1100',
      exportWeight: 100,
      errors: []
    }];

    let mockInvalidateRowsFromCache;

    beforeEach(() => {
      mockInvalidateRowsFromCache = jest.spyOn(UploadsService, 'invalidateCacheUploadedRows');
    });

    afterEach(() => {
      mockInvalidateRowsFromCache.mockRestore();
    });

    it('should invalidate the cache rows from redis', async () => {
      mockInvalidateRowsFromCache.mockResolvedValue(rows);

      const result = await UploadsController.invalidateCacheUploadedRows('Bob', 'Bob');
      expect(result).toStrictEqual(rows);
    });

    it('should invalidate the cache rows from redis even if rows are undefined', async () => {
      mockInvalidateRowsFromCache.mockResolvedValue(undefined);

      const result = await UploadsController.invalidateCacheUploadedRows('Bob', 'Bob');
      expect(result).toBeUndefined();
    });

    it('should bubble up errors thrown', async () => {
      mockInvalidateRowsFromCache.mockRejectedValue(new Error('something has gone wrong'))

      await expect(UploadsController.invalidateCacheUploadedRows('Bob', 'Bob')).rejects.toThrow('something has gone wrong');
    });

  });
});
