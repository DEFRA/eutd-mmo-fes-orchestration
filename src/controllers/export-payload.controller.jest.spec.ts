import { cloneDeep } from "lodash";
import * as Hapi from "@hapi/hapi";
import ExportPayloadService from "../services/export-payload.service";
import SaveAsDraftService from "../services/saveAsDraft.service";
import VesselValidator from "../services/vesselValidator.service";
import * as ReferenceDataService from "../services/reference-data.service";
import * as ProtectiveMonitoring from "../services/protective-monitoring.service";
import * as ProductValidator from "../validators/ccProductValidator";
import * as LandingValidator from "../validators/ccLandingValidator";
import * as AcceptsHTML from "../helpers/acceptsHtml";
import * as FrontEndModels from "../persistence/schema/frontEndModels/payload";
import * as Utils from "../helpers/utils/utils";
import SUT from "./export-payload.controller";
import logger from "../logger";
import { DocumentStatuses, LandingsEntryOptions } from "../persistence/schema/catchCert";
import { fishingVessel, truck } from '../persistence/schema/frontEndModels/transport';
import applicationConfig from "../applicationConfig";
import SummaryErrorsService from "../services/summaryErrors.service";
import TransportService from "../services/transport.service";
import CatchCertificateTransportService from "../services/catch-certificate-transport.service";
import * as CatchCertService from "../persistence/services/catchCert";
import ExportLocationService from "../services/exportLocation.service";
import { NotifyService } from "../services/notify.service";
import { CATCH_CERTIFICATE_KEY, DRAFT_HEADERS_KEY } from '../session_store/constants'

const req: any = {
  app: {
    claims: {
      sub: "some-sub",
      email: "foo@foo.com",
      auth_time: "1605023794",
      contactId: "03fece4e-61e4-e911-a978-000d3a28d891"
    },
  },
  payload: {
    data: "some-data",
    journey: "catchCertificate",
    nextUri: "some-uri",
    dashboardUri: "dashboard-uri",
    completeUri: "complete",
    submittedUri: "submitted"
  },
  headers: {
    accept: false,
  },
};

const contactId = 'contactBob';

const responseCode = jest.fn();

const h = {
  response: () => {
    return { code: responseCode };
  },
  redirect: () => {},
} as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
const DOCUMENT_NUMBER = "GBR-2020-CC-2345-3453";

describe("createExportCertificate", () => {

  let mockResponse;
  let mockRedirect;
  let mockAcceptsHtml;
  let mockGetExportPayload;
  let mockPreCheckCertificate;
  let mockSubmitExportCertificate;
  let mockIsSubmissionFailure;
  let mockLogDebug;
  let mockLogError;
  let mockNumberOfLandings;
  let mockGetCertificateStatus;
  let mockSaveErrors;
  let mockInvalidateDraft;

  beforeEach(() => {
    mockResponse = jest.spyOn(h, "response");
    mockRedirect = jest.spyOn(h, "redirect");
    mockAcceptsHtml = jest.spyOn(AcceptsHTML, "default");
    mockGetExportPayload = jest.spyOn(ExportPayloadService, "get");
    mockPreCheckCertificate = jest.spyOn(SUT, 'preCheckCertificate');
    mockPreCheckCertificate.mockResolvedValue(null);
    mockSubmitExportCertificate = jest.spyOn(SUT, "submitExportCertificate");
    mockIsSubmissionFailure = jest.spyOn(ExportPayloadService, 'isSubmissionFailure');
    mockGetCertificateStatus = jest.spyOn(ExportPayloadService, 'getCertificateStatus');
    mockGetCertificateStatus.mockResolvedValue(DocumentStatuses.Draft);
    mockLogDebug = jest.spyOn(logger, 'debug');
    mockLogError = jest.spyOn(logger, 'error');
    mockNumberOfLandings = jest.spyOn(FrontEndModels, 'getNumberOfUniqueLandings');
    mockNumberOfLandings.mockReturnValue(1);
    mockSaveErrors = jest.spyOn(SummaryErrorsService, "saveErrors");
    mockSaveErrors.mockResolvedValue(null);
    mockInvalidateDraft = jest.spyOn(CatchCertService, 'invalidateDraftCache');
    mockInvalidateDraft.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    responseCode.mockReset();
  });

  describe("when certificate pre-checks fail", () => {

    const mockFailure = {
      response: { status: 'invalid catch certificate' },
      url: `create-catch-certificate/${DOCUMENT_NUMBER}/add-landings`,
      code: 400
    };

    beforeEach(() => {
      mockGetExportPayload.mockResolvedValue({items: []});
      mockPreCheckCertificate.mockResolvedValue(mockFailure);
    });

    it("will return before attempting to create the certificate", async () => {
      await SUT.createExportCertificate(
        req,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockSubmitExportCertificate).not.toHaveBeenCalled();
    });

    describe('when acceptsHtml is false - js response', () => {

      it("will return the specified json response", async () => {
        await SUT.createExportCertificate(
          req,
          h,
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );

        expect(mockResponse).toHaveBeenCalledWith(mockFailure.response);
      });

      it("will return the specified http code", async () => {
        await SUT.createExportCertificate(
          req,
          h,
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );

        expect(responseCode).toHaveBeenCalledWith(mockFailure.code);
      });

    });

    describe('when acceptsHtml is true - nonjs response', () => {

      it("will redirect to the specified url", async () => {
        mockAcceptsHtml.mockReturnValue(true);

        await SUT.createExportCertificate(
          req,
          h,
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );

        expect(mockRedirect).toHaveBeenCalledWith(mockFailure.url);
      });

    });

  });

  describe("when doing offline validation", () => {

    const mockExportPayload = {
      items: [],
    };

    const mockResult = {
      report: [
        {
          state: "FRE",
          species: "LBE",
          presentation: "WHL",
          date: "2019-11-18T00:00:00.000Z",
          vessel: "WIRON 5",
          failures: ["noDataSubmitted"],
        },
      ],
      isBlockingEnabled: true,
      documentNumber: "",
      uri: "",
    };

    const mockFailureResult = [
      {
        state: "FRE",
        species: "LBE",
        presentation: "WHL",
        date: "2019-11-18T00:00:00.000Z",
        vessel: "WIRON 5",
        rules: ["noDataSubmitted"],
      },
    ];

    let mockSaveErrors;
    let mockMapValidationFailure;
    let mockUpdateCertificateStatus;
    const numberOfLandings = 123;

    beforeEach(() => {
      mockSaveErrors = jest.spyOn(SummaryErrorsService, "saveErrors");
      mockSaveErrors.mockResolvedValue(null);

      mockUpdateCertificateStatus = jest.spyOn(ExportPayloadService, 'updateCertificateStatus');
      mockUpdateCertificateStatus.mockResolvedValue(null);

      mockMapValidationFailure = jest.spyOn(FrontEndModels, 'toFrontEndValidationFailure');
      mockMapValidationFailure.mockReturnValue(mockFailureResult);

      mockGetExportPayload.mockResolvedValue(mockExportPayload);
      mockSubmitExportCertificate.mockResolvedValue(mockResult);
      mockIsSubmissionFailure.mockReturnValue(false);
      mockNumberOfLandings.mockReturnValue(numberOfLandings);

      applicationConfig._maximumLandingsForOnlineValidation = 5;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("will log that validation is happening offline", async () => {
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockLogDebug).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][CONTROLLER][VALIDATING-OFFLINE][NUMBER-OF-LANDINGS: ${numberOfLandings}]`);
    });

    it("will set the document status as pending", async () => {
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId, DocumentStatuses.Pending);
    });

    it("will not continue if there is a problem setting the certificate as submitted", async () => {
      mockUpdateCertificateStatus.mockRejectedValue(new Error('an error occurred'));

      await expect(() => SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId))
        .rejects.toThrow('an error occurred');

      expect(mockSubmitExportCertificate).not.toHaveBeenCalled();
    });

    it("will call submitExportCertificate once the certificate is set as pending", async () => {
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId, DocumentStatuses.Pending);
      expect(mockSubmitExportCertificate).toHaveBeenCalledWith(USER_ID, req.app.claims.email, DOCUMENT_NUMBER, req.payload.data, `${req.app.claims.auth_time}:${req.app.claims.contactId}`, contactId, true);
    });

    it("will return { offlineValidation: true } for a json response", async () => {
      mockAcceptsHtml.mockReturnValue(false);

      const result = await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(result).toStrictEqual({offlineValidation: true});
    });

    it("will redirect to the submittedUri for a html response", async () => {
      mockAcceptsHtml.mockReturnValue(true);

      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockRedirect).toHaveBeenCalledWith(req.payload.submittedUri);
    });

    it('will log an error if the export submission fails', async () => {
      const error: Error = new Error('something has gone wrong');

      mockSubmitExportCertificate.mockRejectedValue(error);

      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);
      expect(mockLogError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][ERROR][${error}]`);
    });

  });

  describe("when doing online validation", () => {

    const mockExportPayload = {
      items: [],
    };

    const mockResult = {
      report: [
        {
          state: "FRE",
          species: "LBE",
          presentation: "WHL",
          date: "2019-11-18T00:00:00.000Z",
          vessel: "WIRON 5",
          failures: ["noDataSubmitted"],
        },
      ],
      isBlockingEnabled: true,
      documentNumber: "",
      uri: "test-uri",
    };

    const mockFailureResult = [
      {
        state: "FRE",
        species: "LBE",
        presentation: "WHL",
        date: "2019-11-18T00:00:00.000Z",
        vessel: "WIRON 5",
        rules: ["noDataSubmitted"],
      },
    ];

    let mockSaveErrors ;

    let mockMapValidationFailure;
    const numberOfLandings = 5;

    beforeEach(() => {
      mockSaveErrors = jest.spyOn(SummaryErrorsService, "saveErrors");
      mockMapValidationFailure = jest.spyOn(FrontEndModels, 'toFrontEndValidationFailure');
      mockMapValidationFailure.mockReturnValue(mockFailureResult);

      mockGetExportPayload.mockResolvedValue(mockExportPayload);
      mockSubmitExportCertificate.mockResolvedValue(mockResult);
      mockIsSubmissionFailure.mockReturnValue(false);
      mockNumberOfLandings.mockReturnValue(numberOfLandings);

      mockSaveErrors.mockResolvedValue(null);

      applicationConfig._maximumLandingsForOnlineValidation = 5;
    });


    it("will log that validation is happening online", async () => {
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockLogDebug).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][CONTROLLER][VALIDATING-ONLINE][NUMBER-OF-LANDINGS: ${numberOfLandings}]`);
    });

    it("will call submitExportCertificate", async () => {
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockSubmitExportCertificate).toHaveBeenCalledWith(USER_ID, req.app.claims.email, DOCUMENT_NUMBER, req.payload.data, `${req.app.claims.auth_time}:${req.app.claims.contactId}`, contactId, false);
    });

    it("will return { offlineValidation: false, documentNumber: documentNumber, uri: results.uri } for a success json response", async () => {
      mockAcceptsHtml.mockReturnValue(false);

      const result = await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(result).toStrictEqual({offlineValidation: false, documentNumber: DOCUMENT_NUMBER, uri: mockResult.uri});
    });

    it("will return a frontend validation failure for a failure json response", async () => {
      mockAcceptsHtml.mockReturnValue(false);
      mockIsSubmissionFailure.mockReturnValue(true);

      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockMapValidationFailure).toHaveBeenCalledWith(mockResult);
      expect(mockResponse).toHaveBeenCalledWith(mockFailureResult);
    });

    it("will redirect to the completeUri for a html response", async () => {
      mockAcceptsHtml.mockReturnValue(true);

      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockRedirect).toHaveBeenCalledWith(`${req.payload.completeUri}?documentNumber=${DOCUMENT_NUMBER}&uri=${mockResult.uri}`);
    });

    it('should call saveErrors once if validation return failure', async () => {
      mockAcceptsHtml.mockReturnValue(false);
      mockIsSubmissionFailure.mockReturnValue(true);
      await SUT.createExportCertificate(req, h, USER_ID, DOCUMENT_NUMBER, contactId);

      expect(mockSaveErrors).toHaveBeenCalledTimes(1);
    });

  });

  it('should invalidate the draft catch certificate cache', async () => {
    mockGetExportPayload.mockResolvedValue({items: []});
    mockPreCheckCertificate.mockResolvedValue({
      response: { status: 'invalid catch certificate' },
      url: `create-catch-certificate/${DOCUMENT_NUMBER}/add-landings`,
      code: 400
    });

    await SUT.createExportCertificate(
      req,
      h,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockInvalidateDraft).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockInvalidateDraft).toHaveBeenCalledTimes(1);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something went wrong');

    mockInvalidateDraft.mockRejectedValue(error);

    await expect(async () => SUT.createExportCertificate(
      req,
      h,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    )).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(`[INVALID-CATCH-CERTIFICATE][DOCUMENT-NUMBER][${DOCUMENT_NUMBER}][${error.stack}]`);
  });

});

describe('preCheckCertificate', () => {

  let mockVesselsAreValid;
  let mockProductsAreValid;
  let mockGetCertificateStatus;
  let mockVesselsNotFound;
  let mockInvalidLandingDates;
  let mockGetErrors;

  const userPrincipal = 'Bob';
  const documentNumber = 'CC1';
  const exportPayload = {items: []};

  beforeEach(() => {
    mockGetCertificateStatus = jest.spyOn(ExportPayloadService, 'getCertificateStatus');
    mockGetCertificateStatus.mockResolvedValue(DocumentStatuses.Draft);
    mockVesselsNotFound = jest.spyOn(VesselValidator, 'vesselsNotFound');
    mockVesselsNotFound.mockReturnValue([]);
    mockInvalidLandingDates = jest.spyOn(VesselValidator, 'invalidLandingDates');
    mockInvalidLandingDates.mockReturnValue([]);
    mockVesselsAreValid = jest.spyOn(VesselValidator, 'vesselsAreValid');
    mockVesselsAreValid.mockResolvedValue(true);
    mockProductsAreValid = jest.spyOn(ProductValidator, 'productsAreValid');
    mockProductsAreValid.mockResolvedValue([]);
    mockGetErrors = jest.spyOn(SummaryErrorsService, 'get');
    mockGetErrors.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return the correct details if the document status is locked', async () => {
    mockGetCertificateStatus.mockResolvedValue(DocumentStatuses.Locked);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toStrictEqual({
      response: { status: 'catch certificate is LOCKED' },
      url: `create-catch-certificate/${documentNumber}/check-your-information`,
      code: 200
    });
  });

  it('will return the correct details if there are vessels not found', async () => {
    const errors = [{test: 'test'}];
    mockVesselsNotFound.mockReturnValue(errors);
    mockGetErrors.mockResolvedValue(null);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toStrictEqual({
      response: errors,
      url: `create-catch-certificate/${documentNumber}/check-your-information`,
      code: 400
    });
  });

  it('will return the correct details if there are invalid landing dates', async () => {
    const errors = [{test: 'test'}];
    mockInvalidLandingDates.mockReturnValue(errors);
    mockGetErrors.mockResolvedValue(null);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toStrictEqual({
      response: errors,
      url: `create-catch-certificate/${documentNumber}/check-your-information`,
      code: 400
    });
  });

  it('will combine vessel not found and invalid landing dates in the response', async () => {
    mockVesselsNotFound.mockReturnValue([{error: 'vessel'}]);
    mockInvalidLandingDates.mockReturnValue([{error: 'landing'}]);
    mockGetErrors.mockResolvedValue(null);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId) || { response: {}};

    expect(result.response).toStrictEqual([{error: 'vessel'}, {error: 'landing'}]);
  });

  it('will return the correct details if there are blocking validation errors(3C) and vessels not found', async () => {
    const errors = [{error: 'Vessel Not Found'}];
    mockInvalidLandingDates.mockReturnValue(errors);
    mockGetErrors.mockResolvedValue([{error: '3C error'}]);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);
    const expectedErrors = [...errors, {error: '3C error'}];

    expect(result).toStrictEqual({
      response: expectedErrors,
      url: `create-catch-certificate/${documentNumber}/check-your-information`,
      code: 400
    });
  });

  it('will return the correct details if there are blocking validation errors(3C) and invalid landing date', async () => {
    const errors = [{error: 'Invalid Landing date'}];
    mockInvalidLandingDates.mockReturnValue(errors);
    mockGetErrors.mockResolvedValue([{error: '3C error'}]);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);
    const expectedErrors = [...errors, {error: '3C error'}];

    expect(result).toStrictEqual({
      response: expectedErrors,
      url: `create-catch-certificate/${documentNumber}/check-your-information`,
      code: 400
    });
  });

  it('will return catch certificate invalid if there are invalid vessels', async () => {
    mockVesselsAreValid.mockResolvedValue(false);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toStrictEqual({
      response: { status: 'invalid catch certificate' },
      url: `create-catch-certificate/${documentNumber}/add-landings`,
      code: 200
    });
  });

  it('will return catch certificate invalid if there are invalid products', async () => {
    mockProductsAreValid.mockResolvedValue(false);

    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toStrictEqual({
      response: { status: 'invalid catch certificate' },
      url: `create-catch-certificate/${documentNumber}/add-landings`,
      code: 200
    });
  });

  it('will return null if all pre check validations pass', async () => {
    const result = await SUT.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

    expect(result).toBeNull();
  });

});

describe("validate()", () => {
  const exportPayloadSaveResponse = { errors: [] };
  let exportPayloadGetResponse;
  let items;
  let mockRedirect;
  let mockGetExportPayload;
  let mockValidateProducts;
  let mockSaveExportPayload;
  let mockCheckVesselWithDate;
  let mockAcceptsHtml;

  beforeEach(() => {
    items = [
      {
        product: {
          id: "product-id",
          state: {
            label: "state-label",
          },
          species: {
            label: "species-label",
          },
          presentation: {
            label: "presentation-label",
          },
          commodityCode: "commodity-code"
        },
        landings: [
          {
            error: "invalid",
            model: {
              id: "landing-id",
            },
          },
        ],
      },
    ];
    exportPayloadGetResponse = { items };
    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);
    mockGetExportPayload = jest.spyOn(ExportPayloadService, "get");
    mockGetExportPayload.mockReturnValue(exportPayloadGetResponse);
    mockSaveExportPayload = jest.spyOn(ExportPayloadService, "save");
    mockSaveExportPayload.mockReturnValue(exportPayloadSaveResponse);
    mockValidateProducts = jest.spyOn(ProductValidator, "validateProducts");
    mockValidateProducts.mockReturnValue([]);
    mockCheckVesselWithDate = jest.spyOn(
      VesselValidator,
      "checkVesselWithDate"
    );
    mockCheckVesselWithDate.mockReturnValue(null);
    mockAcceptsHtml = jest.spyOn(AcceptsHTML, "default");
    mockAcceptsHtml.mockReturnValue(false);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should call ExportPayloadService.save() with correct error in payload when a single product has no landings", async () => {
    delete items[0].landings;

    const expectedPayload = {
      errors: {
        "product_product-id": {
          key: "error.product.landing.missing",
          params: {
            species: 'species-label',
            state: 'state-label',
            presentation: 'presentation-label',
            commodityCode: "commodity-code",
         }
        },
      },
      items,
    };

    await SUT.validate(
      req,
      h,
      false,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockSaveExportPayload).toHaveBeenCalledWith(
      expectedPayload,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );
  });

  it("should call ExportPayloadService.save() with correct error in payload when multiple products with no landings", async () => {
    delete items[0].landings;
    items.push({
      product: {
        id: "product-id-2",
        state: {
          label: "state-label-2",
        },
        species: {
          label: "species-label-2",
        },
        presentation: {
          label: "presentation-label-2",
        },
        commodityCode: "commodity-code-2"
      }
    });
    const expectedPayload = {
      errors: {
        "product_product-id": {
          key: "error.products.landing.missing",
          params: {
            species: 'species-label',
            state: 'state-label',
            presentation: 'presentation-label',
            commodityCode: 'commodity-code'
          }
        },
        "product_product-id-2": {
          key: "error.products.landing.missing",
          params: {
            species: 'species-label-2',
            state: 'state-label-2',
            presentation: 'presentation-label-2',
            commodityCode: 'commodity-code-2'
          }
        }
      },
      items,
    };

    await SUT.validate(
      req,
      h,
      false,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockSaveExportPayload).toHaveBeenCalledWith(
      expectedPayload,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );
  });

  it("should call ExportPayloadService.get() with the correct params", async () => {
    await SUT.validate(
      req,
      h,
      false,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockGetExportPayload).toHaveBeenCalledWith(
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );
  });

  it("should call VesselValidator.checkVesselWithDate() with correct params when no errors and returns no errors", async () => {
    items[0].landings[0].error = "valid";
    const expectedResult = { errors: [] };

    const result = await SUT.validate(
      req,
      h,
      false,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockCheckVesselWithDate).toHaveBeenCalledWith(items);
    expect(result).toEqual(expectedResult);
  });

  it("should redirect to payload.nextUri when acceptsHtml returns true", async () => {
    mockAcceptsHtml = jest.spyOn(AcceptsHTML, "default");
    mockAcceptsHtml.mockReturnValue(true);

    await SUT.validate(
      req,
      h,
      false,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockRedirect).toHaveBeenCalledWith(req.payload.nextUri);
  });
});

describe("getExportPayload()", () => {
  it("should call ExportPayloadService.get() with the right params", async () => {
    const mockExportPayloadServiceGet = jest.spyOn(ExportPayloadService, "get");
    mockExportPayloadServiceGet.mockResolvedValue({
      items: []
    });

    await SUT.getExportPayload(
      req,
      h,
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );

    expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(
      USER_ID,
      DOCUMENT_NUMBER,
      contactId
    );
  });
});

describe("getDirectLandingExportPayload()", () => {
  let mockLogger;
  let mockGetDirectLanding;

  beforeAll(() => {
    mockLogger = jest.spyOn(logger, 'info');
    mockGetDirectLanding = jest.spyOn(ExportPayloadService, "getDirectLanding");
    mockGetDirectLanding.mockReturnValue(null);
  });

  afterAll(() => {
    mockLogger.mockRestore();
    mockGetDirectLanding.mockRestore();
  });

  it("should call ExportPayloadService.getDirectLanding() with the right params", async () => {
    await SUT.getDirectLandingExportPayload(USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockLogger).toHaveBeenCalledWith(`[GET-DIRECT-LANDING-EXPORT-PAYLOAD][DOCUMENT-NUMBER][${DOCUMENT_NUMBER}]`);
    expect(mockGetDirectLanding).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
  });
});

describe("methods", () => {
  let  mockReq;

  const items = [
    {
      product: {
        id: "product-id",
        state: {
          label: "state-label",
        },
        species: {
          label: "species-label",
        },
        presentation: {
          label: "presentation-label",
        },
      },
      landings: [
        {
          model: {
            id: "landing-id",
          },
          editMode: true,
          modelCopy: true,
        },
        {
          model: {
            id: "landing-id-2",
          },
          editMode: true,
          modelCopy: true,
        },
      ],
    },
  ];
  const h = {
    response: () => ({
      code: (c) => c,
    }),
    redirect: () => ({
      takeover: jest.fn(),
    }),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockRedirect: jest.SpyInstance;
  let mockResponse: jest.SpyInstance;
  let mockExportPayloadServiceGet: jest.SpyInstance;
  let mockExportPayloadServiceSave: jest.SpyInstance;
  let mockExportPayloadServiceUpsertLanding: jest.SpyInstance;
  let mockTransportServiceGet: jest.SpyInstance; // remove
  let mockTransportServiceRemove: jest.SpyInstance;
  let mockLogger: jest.SpyInstance;
  let mockGetExportLocation: jest.SpyInstance;
  let mockAddExportLocation: jest.SpyInstance;

  beforeAll(() => {
    mockRedirect = jest.spyOn(h, "redirect");
    mockResponse = jest.spyOn(h, "response");
  });

  beforeEach(() => {
    mockReq = {
      app: { claims: { sub: USER_ID, email: "test@test.com" } },
      url: {
        path: "/test/some-path",
      },
      payload: {
        id: "payload-id",
        clientip: "client-ip",
        documentNumber: "document-number",
        "vessel.label": "vessel-label(VL)",
        nextUri: "next-uri",
        commodityCode: "commodity-code",
      },
      params: {
        productId: "product-id",
      },
      headers: {
        accept: "text/html",
      },
      currentUri: "test/current-uri",
    };

    mockLogger = jest.spyOn(logger, 'info');

    mockExportPayloadServiceSave = jest.spyOn(ExportPayloadService, "save");
    mockExportPayloadServiceSave.mockReturnValue(null);

    mockExportPayloadServiceUpsertLanding = jest.spyOn(ExportPayloadService, "upsertLanding");
    mockExportPayloadServiceUpsertLanding.mockReturnValue(null);

    mockExportPayloadServiceGet = jest.spyOn(ExportPayloadService, "get");
    mockExportPayloadServiceGet.mockResolvedValue({ items });

    mockTransportServiceGet = jest.spyOn(TransportService, 'getTransportDetails');
    mockTransportServiceGet.mockResolvedValue({});

    mockGetExportLocation = jest.spyOn(CatchCertService, 'getExportLocation');
    mockGetExportLocation.mockResolvedValue({exportLocation:'data'});

    mockAddExportLocation = jest.spyOn(ExportLocationService, 'addExportLocation');
    mockAddExportLocation.mockResolvedValue({});

    mockTransportServiceRemove = jest.spyOn(TransportService, 'removeTransport');
    mockTransportServiceRemove.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockExportPayloadServiceUpsertLanding.mockRestore();
    mockExportPayloadServiceGet.mockRestore();
    mockExportPayloadServiceSave.mockRestore();
    mockTransportServiceGet.mockRestore();
    mockTransportServiceRemove.mockRestore();
    mockLogger.mockRestore();
  });

  describe("editExportPayloadProductLanding()", () => {
    it("should call ExportPayloadService.get() with the right params", async () => {
      await SUT.editExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.url.path);
    });

    it("should call ExportPayloadService.save() with the right params with no landings", async () => {
      mockReq.params.landingId = "landing-id";

      mockExportPayloadServiceGet.mockResolvedValue({ items: [] });

      await SUT.editExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceSave).not.toHaveBeenCalled();
    });

    it("should call ExportPayloadService.save() with the right params", async () => {
      mockReq.params.landingId = "landing-id";

      await SUT.editExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        { items },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
    });
  });

  describe("editExportPayloadProductLandingNonjs()", () => {
    it("should call ExportPayloadService.get() with the right params", async () => {
      await SUT.editExportPayloadProductLandingNonjs(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        { items },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });

    it("should call ExportPayloadService.save() with the right params", async () => {
      mockReq.params.landingId = "landing-id";

      await SUT.editExportPayloadProductLandingNonjs(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        { items },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
    });
  });

  describe("removeExportPayloadProductLanding()", () => {
    it("should call ExportPayloadService.get() with the right params", async () => {
      mockReq.params.landingId = "landing-id";

      await SUT.removeExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });

    it("should call ExportPayloadService.get() with the right params with no landings", async () => {
      mockReq.params.landingId = "landing-id";

      mockExportPayloadServiceGet.mockResolvedValue({ items: [] });

      await SUT.removeExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });
  });

  describe("addAnotherExportPayloadProductLandingNonjs()", () => {
    it("should redirect to payload.currentUri", async () => {
      mockReq.params.landingId = "landing-id";

      await SUT.addAnotherExportPayloadProductLandingNonjs(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });
  });

  describe("upsertExportPayloadProductLanding() errors", () => {
    let mockExportPayloadServiceGetItemByProductId: jest.SpyInstance;
    let mockCreateExportPayloadForValidation: jest.SpyInstance;
    let mockValidateLanding: jest.SpyInstance;

    const items = [
      {
        product: {
          id: "product-id",
          state: {
            label: "state-label",
          },
          species: {
            label: "species-label",
          },
          presentation: {
            label: "presentation-label",
          },
        },
        error: "invalid",
        errors: {
          "a.b": "Error Error",
        },
        landings: [],
      },
    ];

    beforeAll(() => {
      mockExportPayloadServiceGetItemByProductId = jest.spyOn(
        ExportPayloadService,
        "getItemByProductId"
      );
      mockExportPayloadServiceGetItemByProductId.mockResolvedValue(items[0]);
      mockCreateExportPayloadForValidation = jest.spyOn(
        LandingValidator,
        "createExportPayloadForValidation"
      );
      mockCreateExportPayloadForValidation.mockReturnValue(items);
      mockValidateLanding = jest.spyOn(LandingValidator, "validateLanding");
      mockValidateLanding.mockImplementation(() => {
        return {
          error: 'invalid',
          errors: { startDate: 'error.startDate.seasonalFish.invalidate', dateLanded: 'error.seasonalFish.invalidate' }
        }
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should send Error Error Error 400", async () => {
      const result = await SUT.upsertExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        mockReq.params.productId,
        contactId
      );
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        mockReq.params.productId,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockResponse).toHaveBeenCalledWith({
        error: "invalid",
        errors: { dateLanded: "error.seasonalFish.invalidate", startDate: "error.startDate.seasonalFish.invalidate" },
        items: items,
      });
      expect(result).toEqual(400);
    });
  });

  describe("upsertExportPayloadProductLanding()", () => {
    let mockExportPayloadServiceGetItemByProductId: jest.SpyInstance;
    let mockCreateExportPayloadForValidation: jest.SpyInstance;
    let mockValidateLanding: jest.SpyInstance;

    beforeAll(() => {
      mockExportPayloadServiceGetItemByProductId = jest.spyOn(
        ExportPayloadService,
        "getItemByProductId"
      );
      mockExportPayloadServiceGetItemByProductId.mockResolvedValue(items[0]);
      mockCreateExportPayloadForValidation = jest.spyOn(
        LandingValidator,
        "createExportPayloadForValidation"
      );
      mockCreateExportPayloadForValidation.mockReturnValue(null);
      mockValidateLanding = jest.spyOn(LandingValidator, "validateLanding");
      mockValidateLanding.mockImplementation(() => {
        return { error: 'invalid', errors: { dateLanded: 'error.seasonalFish.invalidate' }}
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should send error code 400 when validateLanding() throws exception", async () => {

      const result = await SUT.upsertExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        mockReq.params.productId,
        contactId
      );
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        mockReq.params.productId,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockResponse).toHaveBeenCalledWith({
        error: "invalid",
        errors: { dateLanded: 'error.seasonalFish.invalidate' },
        items: null,
      });
      expect(result).toEqual(400);
    });

    it("should redirect to payload.currentUri when validateLanding() is successful", async () => {
      mockValidateLanding.mockReturnValue(null);
      await SUT.upsertExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        mockReq.params.productId,
        contactId
      );
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        mockReq.params.productId,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockValidateLanding).toHaveBeenCalledWith(null);
      const expectedNewLanding = {
        addMode: false,
        editMode: false,
        error: "",
        errors: {},
        model: {
          id: "payload-id",
          numberOfSubmissions: undefined,
          dateLanded: undefined,
          exportWeight: undefined,
          faoArea: undefined,
          vessel: undefined,
        },
      };
      expect(mockExportPayloadServiceUpsertLanding).toHaveBeenCalledWith(
        mockReq.params.productId,
        expectedNewLanding,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });

    it("should return a valid response when validateLanding() is successful and accept header is not text/html", async () => {
      mockValidateLanding.mockReturnValue(null);
      mockReq.headers.accept = "application/pdf";
      const result = await SUT.upsertExportPayloadProductLanding(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        mockReq.params.productId,
        contactId
      );
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        mockReq.params.productId,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockValidateLanding).toHaveBeenCalledWith(null);
      const expectedNewLanding = {
        addMode: false,
        editMode: false,
        error: "",
        errors: {},
        model: {
          id: "payload-id",
          numberOfSubmissions: undefined,
          dateLanded: undefined,
          exportWeight: undefined,
          gearCategory: undefined,
          gearType: undefined,
          highSeasArea: undefined,
          exclusiveEconomicZones:undefined,
          rfmo: undefined,
          faoArea: undefined,
          vessel: undefined,
        },
      };
      expect(mockExportPayloadServiceUpsertLanding).toHaveBeenCalledWith(
        mockReq.params.productId,
        expectedNewLanding,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(result).toEqual(null);
      mockReq.headers.accept = "text/html";
    });
  });

  describe("upsertExportPayloadInvalidRequest()", () => {
    it("should call ExportPayloadService.upsertLanding() with the right params", async () => {
      await SUT.upsertExportPayloadInvalidRequest(
        mockReq,
        h,
        { details: [{ path: ["a", "b"] }] },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      const expectedNewlanding = {
        editMode: true,
        error: "invalid",
        errors: {
          "a.b": "error.a.b.undefined",
        },
        model: {
          dateLanded: undefined,
          exportWeight: undefined,
          gearCategory: undefined,
          gearType: undefined,
          highSeasArea: undefined,
          exclusiveEconomicZones: undefined,
          faoArea: undefined,
          id: "payload-id",
          numberOfSubmissions: undefined,
          vessel: undefined,
        },
      };

      expect(mockExportPayloadServiceUpsertLanding).toHaveBeenCalledWith(
        mockReq.params.productId,
        expectedNewlanding,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
    });
  });

  describe("upsertExportPayloadProductLandingNonjs()", () => {
    const vesselData = { vesselName: "vessel-name", pln: "vessel-pln" };
    const mockReferenceDataServiceGetVessel = jest.spyOn(
      ReferenceDataService,
      "getVessel"
    );
    mockReferenceDataServiceGetVessel.mockResolvedValue(vesselData);

    it("should call ExportPayloadService.upsertLanding() with the right params", async () => {
      await SUT.upsertExportPayloadProductLandingNonjs(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      const expectedNewlanding = {
        addMode: false,
        editMode: false,
        error: "",
        errors: {},
      };

      expect(mockExportPayloadServiceUpsertLanding).toHaveBeenCalledWith(
        mockReq.params.productId,
        expect.objectContaining(expectedNewlanding),
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });
  });

  describe("upsertExportPayloadInvalidNonJs()", () => {
    it("should call ExportPayloadService.upsertLanding() with the right params", async () => {
      await SUT.upsertExportPayloadInvalidNonJs(
        mockReq,
        h,
        { details: [{ path: ["a", "b"] }] },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      const expectedNewlanding = {
        editMode: true,
        error: "invalid",
        errors: {
          "a.b": "error.a.b.undefined",
        },
        model: {
          dateLanded: undefined,
          exportWeight: undefined,
          gearCategory: undefined,
          gearType: undefined,
          highSeasArea: undefined,
          exclusiveEconomicZones:undefined,
          rfmo: undefined,
          id: "payload-id",
          numberOfSubmissions: undefined,
          vessel: {
            label: "vessel-label(VL)",
          },
        },
      };

      expect(mockExportPayloadServiceUpsertLanding).toHaveBeenCalledWith(
        mockReq.params.productId,
        expectedNewlanding,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });
  });

  describe('upsertExportPayloadProductDirectLanding', () => {
    let mockDirectLandingReq;
    let mockValidateLanding: jest.SpyInstance;
    let mockCreateExportPayloadForValidation: jest.SpyInstance;
    let mockExportPayloadServiceGetItemByProductId: jest.SpyInstance;
    let mockUtilsRandom: jest.SpyInstance;

    const mockRedirect: jest.Mock = jest.fn();
    const mockResponse: jest.Mock = jest.fn();
    const mockCode: jest.Mock = jest.fn();
    mockResponse.mockImplementation(() => ({
      code: mockCode
    }));

    const mockExportPayloadForValidation = [{
      product: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
      landings: [{
        model: {
          id: 'any-id',
          vessel: {
            pln: "CA182",
            vesselName: "AWEL-Y-MOR",
            flag: "GBR",
            cfr: "GBR000B11999",
            homePort: "PORTHGAIN",
            licenceNumber: "22896",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "B11999",
            vesselLength: 6.55,
            label: "AWEL-Y-MOR (CA182)",
            domId: "AWEL-Y-MOR-CA182"
          },
          dateLanded: "2382-12-31",
          gearCategory: "Category 1",
          gearType: "Type 1",
          highSeasArea: "yes",
          exclusiveEconomicZones:[
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
          exportWeight: 988,
          faoArea: "FAO27",
          rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)"
        }
      }]
    }];

    const responseToolkit = {
      response: mockResponse,
      redirect: mockRedirect,
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

    beforeEach(() => {
      mockExportPayloadServiceGetItemByProductId = jest.spyOn(ExportPayloadService, 'getItemByProductId');
      mockExportPayloadServiceGetItemByProductId.mockResolvedValue(items[0].product);

      mockCreateExportPayloadForValidation = jest.spyOn(LandingValidator,"createExportPayloadForValidation");
      mockCreateExportPayloadForValidation.mockReturnValue(mockExportPayloadForValidation);

      mockValidateLanding = jest.spyOn(LandingValidator, "validateLanding");
      mockValidateLanding.mockResolvedValue(undefined);

      mockUtilsRandom = jest.spyOn(Utils, 'getRandomNumber');
      mockUtilsRandom.mockReturnValue('landing-id');

      mockDirectLandingReq = cloneDeep(mockReq);
      mockDirectLandingReq.payload = {
        id: "this will not be used",
        vessel: {
          pln: "CA182",
          vesselName: "AWEL-Y-MOR",
          flag: "GBR",
          cfr: "GBR000B11999",
          homePort: "PORTHGAIN",
          licenceNumber: "22896",
          imoNumber: null,
          licenceValidTo: "2382-12-31T00:00:00",
          rssNumber: "B11999",
          vesselLength: 6.55,
          label: "AWEL-Y-MOR (CA182)",
          domId: "AWEL-Y-MOR-CA182"
        },
        dateLanded: "2020-10-10",
        faoArea: "FAO27",
        gearCategory: "Category 1",
        gearType: "Type 1",
        highSeasArea: "yes",
        exclusiveEconomicZones:[
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
        rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
        weights: [{
          speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
          speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
          exportWeight: 988
        }],
        currentUri: 'test/current-uri',
        journey : 'catchCertificate',
        user_id : USER_ID,
      };

      mockExportPayloadServiceSave.mockReturnValue({ items });
    });

    afterEach(() => {
      mockUtilsRandom.mockRestore();
      mockValidateLanding.mockRestore();
      mockCreateExportPayloadForValidation.mockRestore();
      mockExportPayloadServiceGetItemByProductId.mockRestore();
      mockExportPayloadServiceSave.mockRestore();
    });

    it('should validate a direct landing and throw if invalid', async () => {
      mockValidateLanding.mockResolvedValue({
        error: 'invalid',
        errors: { dateLanded: 'error' }
      });

      await SUT.upsertExportPayloadProductDirectLanding(
        mockDirectLandingReq,
        responseToolkit,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockLogger).toHaveBeenCalledWith('[UPSERT-EXPORT-PAYLOAD][DIRECT-LANDING][DOCUMENT-NUMBER][GBR-2020-CC-2345-3453]');
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        DOCUMENT_NUMBER,
        contactId);
      expect(mockValidateLanding).toHaveBeenCalledWith(mockExportPayloadForValidation);
      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        {
          error: "invalid",
          errors: {
            dateLanded: "error"
          },
          items: [{
            landings: [{
                addMode: false,
                editMode: false,
                error: "invalid",
                errors: {
                  dateLanded: "error"
                },
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 988,
                  gearCategory: "Category 1",
                  gearType: "Type 1",
                  highSeasArea: "yes",
                  exclusiveEconomicZones:[
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
                  rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                  faoArea: "FAO27",
                  id: `${DOCUMENT_NUMBER}-landing-id`,
                  vessel: {
                    cfr: "GBR000B11999",
                    domId: "AWEL-Y-MOR-CA182",
                    flag: "GBR",
                    homePort: "PORTHGAIN",
                    imoNumber: null,
                    label: "AWEL-Y-MOR (CA182)",
                    licenceNumber: "22896",
                    licenceValidTo: "2382-12-31T00:00:00",
                    pln: "CA182",
                    rssNumber: "B11999",
                    vesselLength: 6.55,
                    vesselName: "AWEL-Y-MOR"
                  }
                }
              }
            ],
            product: {
              id: "product-id",
              presentation: {
                label: "presentation-label"
              },
              species: {
                label: "species-label"
              },
              state: {
                label: "state-label"
              }
            }
          }]
        },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockCode).toHaveBeenCalledWith(400);
      expect(mockResponse).toHaveBeenCalledWith({ items })
    });

    it('should validate a empty gear category and throw if invalid', async () => {
      mockValidateLanding.mockResolvedValue({
        error: 'invalid',
        errors: { gearCategory: 'error' }
      });

      await SUT.upsertExportPayloadProductDirectLanding(
        mockDirectLandingReq,
        responseToolkit,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockLogger).toHaveBeenCalledWith('[UPSERT-EXPORT-PAYLOAD][DIRECT-LANDING][DOCUMENT-NUMBER][GBR-2020-CC-2345-3453]');
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        DOCUMENT_NUMBER,
        contactId);
      expect(mockValidateLanding).toHaveBeenCalledWith(mockExportPayloadForValidation);

      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        {
          error: "invalid",
          errors: {
            gearCategory: "error"
          },
          items: [{
            landings: [{
                addMode: false,
                editMode: false,
                error: "invalid",
                errors: {
                  gearCategory: "error"
                },
                model: {
                  dateLanded: "2020-10-10",
                  exportWeight: 988,
                  gearCategory: "Category 1",
                  gearType: "Type 1",
                  faoArea: "FAO27",
                  highSeasArea: "yes",
                  startDate: undefined,
                  exclusiveEconomicZones:[
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
                  rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                  id: `${DOCUMENT_NUMBER}-landing-id`,
                  vessel: {
                    cfr: "GBR000B11999",
                    domId: "AWEL-Y-MOR-CA182",
                    flag: "GBR",
                    homePort: "PORTHGAIN",
                    imoNumber: null,
                    label: "AWEL-Y-MOR (CA182)",
                    licenceNumber: "22896",
                    licenceValidTo: "2382-12-31T00:00:00",
                    pln: "CA182",
                    rssNumber: "B11999",
                    vesselLength: 6.55,
                    vesselName: "AWEL-Y-MOR"
                  }
                }
              }
            ],
            product: {
              id: "product-id",
              presentation: {
                label: "presentation-label"
              },
              species: {
                label: "species-label"
              },
              state: {
                label: "state-label"
              }
            }
          }]
        },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockCode).toHaveBeenCalledWith(400);
      expect(mockResponse).toHaveBeenCalledWith({ items })
    });

    it('should validate a direct landing and redirect', async () => {
      await SUT.upsertExportPayloadProductDirectLanding(
        mockDirectLandingReq,
        responseToolkit,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockLogger).toHaveBeenCalledWith('[UPSERT-EXPORT-PAYLOAD][DIRECT-LANDING][DOCUMENT-NUMBER][GBR-2020-CC-2345-3453]');
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        DOCUMENT_NUMBER,
        contactId);
      expect(mockValidateLanding).toHaveBeenCalledWith(mockExportPayloadForValidation);
      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        {
          error: "",
          errors: {},
          items: [{
            landings: [{
                addMode: false,
                editMode: false,
                error: "",
                errors: {},
                model: {
                  dateLanded: "2020-10-10",
                  gearCategory: "Category 1",
                  gearType: "Type 1",
                  highSeasArea: "yes",
                  exclusiveEconomicZones:[
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
                  rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                  exportWeight: 988,
                  faoArea: "FAO27",
                  id: `${DOCUMENT_NUMBER}-landing-id`,
                  vessel: {
                    cfr: "GBR000B11999",
                    domId: "AWEL-Y-MOR-CA182",
                    flag: "GBR",
                    homePort: "PORTHGAIN",
                    imoNumber: null,
                    label: "AWEL-Y-MOR (CA182)",
                    licenceNumber: "22896",
                    licenceValidTo: "2382-12-31T00:00:00",
                    pln: "CA182",
                    rssNumber: "B11999",
                    vesselLength: 6.55,
                    vesselName: "AWEL-Y-MOR"
                  }
                }
              }
            ],
            product: {
              id: "product-id",
              presentation: {
                label: "presentation-label"
              },
              species: {
                label: "species-label"
              },
              state: {
                label: "state-label"
              }
            }
          }]
        },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(mockRedirect).toHaveBeenCalledWith('test/current-uri');
    });

    it('should validate a direct landing and return items', async () => {
      const noHeaders = cloneDeep(mockDirectLandingReq);
      noHeaders.payload = {
        id: "landing-id",
        vessel: {
          pln: "CA182",
          vesselName: "AWEL-Y-MOR",
          flag: "GBR",
          cfr: "GBR000B11999",
          homePort: "PORTHGAIN",
          licenceNumber: "22896",
          imoNumber: null,
          licenceValidTo: "2382-12-31T00:00:00",
          rssNumber: "B11999",
          vesselLength: 6.55,
          label: "AWEL-Y-MOR (CA182)",
          domId: "AWEL-Y-MOR-CA182"
        },
        dateLanded: "2020-10-10",
        faoArea: "FAO27",
        gearCategory: "Category 1",
        gearType: "Type 1",
        highSeasArea: "yes",
        exclusiveEconomicZones:[
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
        rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
        weights: [{
          speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
          speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
          exportWeight: 988
        }],
        currentUri: 'test/current-uri'
      };
      noHeaders.headers = {};

      const result = await SUT.upsertExportPayloadProductDirectLanding(
        noHeaders,
        responseToolkit,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockLogger).toHaveBeenCalledWith('[UPSERT-EXPORT-PAYLOAD][DIRECT-LANDING][DOCUMENT-NUMBER][GBR-2020-CC-2345-3453]');
      expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenCalledWith(
        USER_ID,
        "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        DOCUMENT_NUMBER,
        contactId);
      expect(mockValidateLanding).toHaveBeenCalledWith(mockExportPayloadForValidation);
      expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
        {
          error: "",
          errors: {},
          items: [{
            landings: [{
                addMode: false,
                editMode: false,
                error: "",
                errors: {},
                model: {
                  dateLanded: "2020-10-10",
                  gearCategory: "Category 1",
                  gearType: "Type 1",
                  highSeasArea: "yes",
                  exclusiveEconomicZones:[
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
                  rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                  exportWeight: 988,
                  faoArea: "FAO27",
                  id: `${DOCUMENT_NUMBER}-landing-id`,
                  vessel: {
                    cfr: "GBR000B11999",
                    domId: "AWEL-Y-MOR-CA182",
                    flag: "GBR",
                    homePort: "PORTHGAIN",
                    imoNumber: null,
                    label: "AWEL-Y-MOR (CA182)",
                    licenceNumber: "22896",
                    licenceValidTo: "2382-12-31T00:00:00",
                    pln: "CA182",
                    rssNumber: "B11999",
                    vesselLength: 6.55,
                    vesselName: "AWEL-Y-MOR"
                  }
                }
              }
            ],
            product: {
              id: "product-id",
              presentation: {
                label: "presentation-label"
              },
              species: {
                label: "species-label"
              },
              state: {
                label: "state-label"
              }
            }
          }]
        },
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
      expect(result).toEqual({ items });
    });

    describe('with more than one product', () => {
      beforeEach(() => {
        mockExportPayloadServiceGetItemByProductId = jest.spyOn(ExportPayloadService, 'getItemByProductId');
        mockExportPayloadServiceGetItemByProductId.mockResolvedValue(items[0].product);

        mockUtilsRandom = jest.spyOn(Utils, 'getRandomNumber');
        mockUtilsRandom
          .mockReturnValueOnce('first-random-id')
          .mockReturnValueOnce('second-random-id')
      });

      afterEach(() => {
        mockExportPayloadServiceGetItemByProductId.mockRestore();
      });

      it('should validate a direct landing and throw if invalid', async () => {
        mockDirectLandingReq = cloneDeep(mockReq);
        mockDirectLandingReq.payload = {
          vessel: {
            pln: "CA182",
            vesselName: "AWEL-Y-MOR",
            flag: "GBR",
            cfr: "GBR000B11999",
            homePort: "PORTHGAIN",
            licenceNumber: "22896",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "B11999",
            vesselLength: 6.55,
            label: "AWEL-Y-MOR (CA182)",
            domId: "AWEL-Y-MOR-CA182"
          },
          dateLanded: "2020-10-10",
          faoArea: "FAO27",
          gearCategory: "Category 1",
          gearType: "Type 1",
          highSeasArea: "yes",
          exclusiveEconomicZones:[
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
          rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
          weights: [{
            speciesId: "GBR-2021-CC-1",
            speciesLabel: "Species 1",
            exportWeight: 9
          },
          {
            speciesId: "GBR-2021-CC-2",
            speciesLabel: "Species 2",
            exportWeight: 8
          }
          ],
          currentUri: 'test/current-uri'
        };

        mockValidateLanding.mockResolvedValueOnce({
          error: 'invalid',
          errors: { dateLanded: 'error' }
        })

        mockValidateLanding.mockResolvedValueOnce(undefined)

        await SUT.upsertExportPayloadProductDirectLanding(
          mockDirectLandingReq,
          responseToolkit,
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );

        expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenNthCalledWith(1,
          USER_ID,
          "GBR-2021-CC-1",
          DOCUMENT_NUMBER,
          contactId);
        expect(mockExportPayloadServiceGetItemByProductId).toHaveBeenNthCalledWith(2,
          USER_ID,
          "GBR-2021-CC-2",
          DOCUMENT_NUMBER,
          contactId);

        expect(mockCreateExportPayloadForValidation).toHaveBeenCalledTimes(2);
        expect(mockValidateLanding).toHaveBeenCalledTimes(2);
        expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
          {
            error: "invalid",
            errors: {
              dateLanded: "error"
            },
            items: [{
              landings: [{
                  addMode: false,
                  editMode: false,
                  error: "invalid",
                  errors: {
                    dateLanded: "error"
                  },
                  model: {
                    dateLanded: "2020-10-10",
                    gearCategory: "Category 1",
                    gearType: "Type 1",
                    highSeasArea: "yes",
                    exclusiveEconomicZones:[
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
                    rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                    exportWeight: 9,
                    faoArea: "FAO27",
                    id: `${DOCUMENT_NUMBER}-first-random-id`,
                    vessel: {
                      cfr: "GBR000B11999",
                      domId: "AWEL-Y-MOR-CA182",
                      flag: "GBR",
                      homePort: "PORTHGAIN",
                      imoNumber: null,
                      label: "AWEL-Y-MOR (CA182)",
                      licenceNumber: "22896",
                      licenceValidTo: "2382-12-31T00:00:00",
                      pln: "CA182",
                      rssNumber: "B11999",
                      vesselLength: 6.55,
                      vesselName: "AWEL-Y-MOR"
                    }
                  }
                }
              ],
              product: {
                id: "product-id",
                presentation: {
                  label: "presentation-label"
                },
                species: {
                  label: "species-label"
                },
                state: {
                  label: "state-label"
                }
              }
            },
            {
              landings: [{
                  addMode: false,
                  editMode: false,
                  error: "",
                  errors: {},
                  model: {
                    dateLanded: "2020-10-10",
                    gearCategory: "Category 1",
                    gearType: "Type 1",
                    highSeasArea: "yes",
                    exclusiveEconomicZones:[
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
                    rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                    exportWeight: 8,
                    faoArea: "FAO27",
                    id: `${DOCUMENT_NUMBER}-second-random-id`,
                    vessel: {
                      cfr: "GBR000B11999",
                      domId: "AWEL-Y-MOR-CA182",
                      flag: "GBR",
                      homePort: "PORTHGAIN",
                      imoNumber: null,
                      label: "AWEL-Y-MOR (CA182)",
                      licenceNumber: "22896",
                      licenceValidTo: "2382-12-31T00:00:00",
                      pln: "CA182",
                      rssNumber: "B11999",
                      vesselLength: 6.55,
                      vesselName: "AWEL-Y-MOR"
                    }
                  }
                }
              ],
              product: {
                id: "product-id",
                presentation: {
                  label: "presentation-label"
                },
                species: {
                  label: "species-label"
                },
                state: {
                  label: "state-label"
                }
              }
            }
          ]
          },
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );
        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockResponse).toHaveBeenCalledWith({ items })
      });

      it('should have unique landing ids for direct landings', async () => {
        mockDirectLandingReq = cloneDeep(mockReq);
        mockDirectLandingReq.payload = {
          vessel: {
            pln: "CA182",
            vesselName: "AWEL-Y-MOR",
            flag: "GBR",
            cfr: "GBR000B11999",
            homePort: "PORTHGAIN",
            licenceNumber: "22896",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "B11999",
            vesselLength: 6.55,
            label: "AWEL-Y-MOR (CA182)",
            domId: "AWEL-Y-MOR-CA182"
          },
          dateLanded: "2020-10-10",
          faoArea: "FAO27",
          gearCategory: "Category 1",
          gearType: "Type 1",
          highSeasArea: "yes",
          exclusiveEconomicZones:[
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
          rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
          weights: [{
            speciesId: "GBR-2021-CC-1",
            speciesLabel: "Species 1",
            exportWeight: 9
          },
          {
            speciesId: "GBR-2021-CC-2",
            speciesLabel: "Species 2",
            exportWeight: 8
          }
          ],
          currentUri: 'test/current-uri'
        };

        await SUT.upsertExportPayloadProductDirectLanding(
          mockDirectLandingReq,
          responseToolkit,
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );

        expect(mockExportPayloadServiceSave).toHaveBeenCalledWith(
          {
            error: "",
            errors: {},
            items: [{
              landings: [{
                  addMode: false,
                  editMode: false,
                  error: "",
                  errors: {},
                  model: {
                    dateLanded: "2020-10-10",
                    gearCategory: "Category 1",
                    gearType: "Type 1",
                    highSeasArea: "yes",
                    exclusiveEconomicZones:[
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
                    rfmo: "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                    exportWeight: 9,
                    faoArea: "FAO27",
                    id: "GBR-2020-CC-2345-3453-first-random-id",
                    vessel: {
                      cfr: "GBR000B11999",
                      domId: "AWEL-Y-MOR-CA182",
                      flag: "GBR",
                      homePort: "PORTHGAIN",
                      imoNumber: null,
                      label: "AWEL-Y-MOR (CA182)",
                      licenceNumber: "22896",
                      licenceValidTo: "2382-12-31T00:00:00",
                      pln: "CA182",
                      rssNumber: "B11999",
                      vesselLength: 6.55,
                      vesselName: "AWEL-Y-MOR"
                    }
                  }
                }
              ],
              product: {
                id: "product-id",
                presentation: {
                  label: "presentation-label"
                },
                species: {
                  label: "species-label"
                },
                state: {
                  label: "state-label"
                }
              }
            },
            {
              landings: [{
                  addMode: false,
                  editMode: false,
                  error: "",
                  errors: {},
                  model: {
                    dateLanded: "2020-10-10",
                    gearCategory: "Category 1",
                    gearType: "Type 1",
                    highSeasArea: "yes",
                    exclusiveEconomicZones:[
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
                    rfmo:"Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
                    exportWeight: 8,
                    faoArea: "FAO27",
                    id: "GBR-2020-CC-2345-3453-second-random-id",
                    vessel: {
                      cfr: "GBR000B11999",
                      domId: "AWEL-Y-MOR-CA182",
                      flag: "GBR",
                      homePort: "PORTHGAIN",
                      imoNumber: null,
                      label: "AWEL-Y-MOR (CA182)",
                      licenceNumber: "22896",
                      licenceValidTo: "2382-12-31T00:00:00",
                      pln: "CA182",
                      rssNumber: "B11999",
                      vesselLength: 6.55,
                      vesselName: "AWEL-Y-MOR"
                    }
                  }
                }
              ],
              product: {
                id: "product-id",
                presentation: {
                  label: "presentation-label"
                },
                species: {
                  label: "species-label"
                },
                state: {
                  label: "state-label"
                }
              }
            }
          ]
          },
          USER_ID,
          DOCUMENT_NUMBER,
          contactId
        );
      });
    })
  });

  describe("addExportPayloadProduct()", () => {
    it("should return a given result", async () => {
      mockExportPayloadServiceSave.mockReturnValueOnce({ result: 'true' });

      const res = await SUT.addExportPayloadProduct(
        {
          ...mockReq,
          headers: {
            accept: null
          }
        },
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(res).toEqual({ result: 'true' });
    });

    it("should redirect to payload.nextUri if the accept header is text/html", async () => {
      await SUT.addExportPayloadProduct(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.nextUri);
    });

    it("should return a valid result if the accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await SUT.addExportPayloadProduct(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(result).toEqual({ items });
      mockReq.headers.accept = "text/html";
    });
  });

  describe("removeExportPayloadProduct()", () => {
    it("should redirect to payload.url.path if the accept header is text/html", async () => {
      await SUT.removeExportPayloadProduct(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.url.path);
    });

    it("should return a valid result if the accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await SUT.removeExportPayloadProduct(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(result).toEqual(null);
      mockReq.headers.accept = "text/html";
    });
  });

  describe("validateExportPayloadAndSaveAsDraft()", () => {
    it("should return a valid result", async () => {
      const mockValidate = jest.spyOn(SUT, "validate");
      mockValidate.mockResolvedValue({
        items: []
      });

      await SUT.validateExportPayloadAndSaveAsDraft(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockValidate).toHaveBeenCalledWith(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );
    });
  });

  describe("getExportPayloadInvalidRequest", () => {

    const mockHResponse = jest.fn()
      .mockReturnValue({
        code: () => ({
          takeover: jest.fn()
        })
      });

    const mockH = {
      response: mockHResponse,
      redirect: () => ({
        takeover: jest.fn(),
      }),
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;


    afterEach(() => {
      mockHResponse.mockRestore();
    });

    it('should return errors within export payload', async () => {

      const error: any = {
        details: [{
          path: ['error','some']
        }]
      };

      await SUT.getExportPayloadInvalidRequest(
        {...mockReq, headers: {}},
        mockH,
        error,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
      expect(mockHResponse).toHaveBeenCalledWith({
        error: "invalid",
        errors: {
          "error.some": "error.error.some.undefined"
        },
        items: [
          ...items
        ]
      });
    });

    it('should return errors within export payload and redirect', async () => {
      const error: any = {
        details: [{
          path: ['error','some']
        }]
      };

      await SUT.getExportPayloadInvalidRequest(
        mockReq,
        h,
        error,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

});

describe("submitExportCertificate", () => {

  const mockSubmissionResult = 'mockSubmissionResult';
  const mockUserPrincipal = 'bob';
  const mockUserEmail = 'bob@bob.com';
  const mockDocumentNumber = 'GBP-2020-CC-ABCDEFG';
  const mockClientIp = '999.99.99.9';
  const mockSessionId = '1605023794:03fece4e-61e4-e911-a978-000d3a28d891';
  const offlineValidation = false;

  let mockCreateCertificate;
  let mockIsSubmissionFailure;
  let mockSubmitProtectiveMonitoring;
  let mockDeleteDraft;
  let mockInvalidateDraft;
  let mockLogInfo;
  let mockLogDebug;
  let mockLogError;
  let mockClearErrors;
  let mockClearSystemError;
  let mockSendSuccessEmailNotify;
  let mockSendFailureEmailNotify;
  let mockSendErrorEmailNotify;

  beforeEach(() => {
    mockCreateCertificate = jest.spyOn(ExportPayloadService, 'createExportCertificate');
    mockCreateCertificate.mockResolvedValue(mockSubmissionResult);

    mockIsSubmissionFailure = jest.spyOn(ExportPayloadService, 'isSubmissionFailure');
    mockSubmitProtectiveMonitoring = jest.spyOn(ProtectiveMonitoring, 'postEventData');
    mockDeleteDraft = jest.spyOn(SaveAsDraftService, 'deleteDraftLink');
    mockDeleteDraft.mockResolvedValue(null);

    mockInvalidateDraft = jest.spyOn(CatchCertService, 'invalidateDraftCache');
    mockInvalidateDraft.mockResolvedValue(undefined);

    mockLogInfo = jest.spyOn(logger, 'info');
    mockLogDebug = jest.spyOn(logger, 'debug');
    mockLogError = jest.spyOn(logger, 'error');

    mockClearErrors = jest.spyOn(SummaryErrorsService, "clearErrors");
    mockClearErrors.mockResolvedValue(null);

    mockClearSystemError = jest.spyOn(SummaryErrorsService, "clearSystemError");
    mockClearSystemError.mockResolvedValue(null);

    mockSendSuccessEmailNotify = jest.spyOn(NotifyService, 'sendSuccessEmailNotifyMessage');
    mockSendSuccessEmailNotify.mockResolvedValue(undefined);

    mockSendFailureEmailNotify = jest.spyOn(NotifyService, 'sendFailureEmailNotifyMessage');
    mockSendFailureEmailNotify.mockResolvedValue(undefined);

    mockSendErrorEmailNotify = jest.spyOn(NotifyService, 'sendTechnicalErrorEmailNotifyMessage');
    mockSendErrorEmailNotify.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('if the call to the service layer returns validation errors', () => {

    beforeEach(() => {
      mockIsSubmissionFailure.mockReturnValue(true);
    });

    it('will log the failure and return the result of the service call', async () => {
      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockCreateCertificate).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, mockUserEmail, contactId);
      expect(mockIsSubmissionFailure).toHaveBeenCalledWith(mockSubmissionResult);
      expect(mockLogDebug).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][CERTIFICATE-NOT-CREATED]`);

      expect(result).toEqual(mockSubmissionResult);
    });

    it('will delete the draft link', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockDeleteDraft).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, 'catchCertificate', contactId);
    });

    it('will log a delete draft link failure without blocking the rest of the process', async () => {
      const e = new Error('delete draft link error');

      mockDeleteDraft.mockRejectedValue(e);

      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockLogError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][DELETE-DRAFT][ERROR][${e.stack || e}]`);

      expect(result).toEqual(mockSubmissionResult)
    });

    it('will not invalidate draft cache', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockInvalidateDraft).toHaveBeenCalledWith(mockUserPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    });

    it('will not send an email via gov notify for online validation', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);
      expect(mockSendFailureEmailNotify).not.toHaveBeenCalled();
    });

    it('should call clearErrors once with the documentNumber as argument', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockClearErrors).toHaveBeenCalledTimes(1);
      expect(mockClearErrors).toHaveBeenCalledWith(mockDocumentNumber);
    });

    it('will log and return failure if the submission failed', async () => {
      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(result).toEqual(mockSubmissionResult);
      expect(mockCreateCertificate).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, mockUserEmail, contactId);
      expect(mockIsSubmissionFailure).toHaveBeenCalledWith(mockSubmissionResult);
      expect(mockLogDebug).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][CERTIFICATE-NOT-CREATED]`);
    });

    it('will send an email via gov notify for offline validation', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true);
      expect(mockSendFailureEmailNotify).toHaveBeenCalled();
    });

    it('will catch any errors thrown whilst sending an email via gov notify for offline validation', async () => {
      mockSendFailureEmailNotify.mockRejectedValue(new Error('something has gone wrong'));

      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true);
      expect(mockLogInfo).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][SENDING-FAILURE-EMAIL][${mockDocumentNumber}]`);
      expect(mockLogError).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][SENDING-FAILURE-EMAIL][ERROR][Error: something has gone wrong]');
    });
  });

  describe('if the call to the service layer returns successfully', () => {

    beforeEach(() => {
      mockIsSubmissionFailure.mockReturnValue(false);
      mockSubmitProtectiveMonitoring.mockResolvedValue(null);
    });

    it('will log the success and return the result of the service call', async () => {
      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockCreateCertificate).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, mockUserEmail, contactId);
      expect(mockIsSubmissionFailure).toHaveBeenCalledWith(mockSubmissionResult);
      expect(mockLogDebug).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][CERTIFICATE-CREATED]`);

      expect(result).toEqual(mockSubmissionResult);
    });

    it('will submit a protective monitoring event', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockSubmitProtectiveMonitoring).toHaveBeenCalledWith(
        mockUserPrincipal,
        'User successfully created a catch certificate',
        `completed/catch certificate/dn:${mockDocumentNumber}`,
        mockClientIp,
        0,
        mockSessionId,
        'CREATE-CC'
      );
    });

    it('will log a protective monitoring failure without blocking the rest of the process', async () => {
      const e = new Error('protective monitoring error');

      mockSubmitProtectiveMonitoring.mockRejectedValue(e);

      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockLogError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][SUBMIT-CC-MONITORING-EVENT][ERROR][${e.stack || e}]`);

      expect(result).toEqual(mockSubmissionResult)
    });

    it('will delete the draft link', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockDeleteDraft).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, 'catchCertificate', contactId);
    });

    it('will log a delete draft link failure without blocking the rest of the process', async () => {
      const e = new Error('delete draft link error');

      mockDeleteDraft.mockRejectedValue(e);

      const result = await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockLogError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][${mockDocumentNumber}][CONTROLLER][DELETE-DRAFT][ERROR][${e.stack || e}]`);

      expect(result).toEqual(mockSubmissionResult)
    });

    it('will invalidate draft cache', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockInvalidateDraft).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, contactId);
    });

    it('should clear system errors', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockClearSystemError).toHaveBeenCalledWith(mockUserPrincipal, mockDocumentNumber, contactId);
    });

    it('will not send an email via gov notify for online validation', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation);

      expect(mockSendSuccessEmailNotify).not.toHaveBeenCalled();
    });

    it('will send an email via gov notify for online validation', async () => {
      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true);

      expect(mockSendSuccessEmailNotify).toHaveBeenCalled();
    });

    it('will catch any errors thrown whilst sending an email via gov notify for offline validation', async () => {
      mockSendSuccessEmailNotify.mockRejectedValue(new Error('something has gone wrong'));

      await SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true);
      expect(mockLogInfo).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][SENDING-SUCCESS-EMAIL][${mockDocumentNumber}]`);
      expect(mockLogError).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][SENDING-SUCCESS-EMAIL][ERROR][Error: something has gone wrong]');
    });

  });

  it('will send any technical error emails via gov notify for offline validation', async () => {
    mockCreateCertificate.mockRejectedValue(new Error('something has gone wrong'));

    await expect(SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true)).rejects.toThrow('something has gone wrong');

    expect(mockSendErrorEmailNotify).toHaveBeenCalled();
  });

  it('will not send any technical error emails via gov notify for online validation', async () => {
    mockCreateCertificate.mockRejectedValue(new Error('something has gone wrong'));

    await expect(SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, offlineValidation)).rejects.toThrow('something has gone wrong');

    expect(mockSendErrorEmailNotify).not.toHaveBeenCalled();
  });

  it('will catch any errors thrown whilst sending a technical error email via gov notify for offline validation', async () => {
    mockCreateCertificate.mockRejectedValue(new Error('something has gone wrong'));
    mockSendErrorEmailNotify.mockRejectedValue(new Error('something has gone wrong'));

    await expect(SUT.submitExportCertificate(mockUserPrincipal, mockUserEmail, mockDocumentNumber, mockClientIp, mockSessionId, contactId, true)).rejects.toThrow('something has gone wrong');
    expect(mockLogInfo).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][SENDING-ERROR-EMAIL][${mockDocumentNumber}]`);
    expect(mockLogError).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][SENDING-ERROR-EMAIL][ERROR][Error: something has gone wrong]');
  });

});

describe('getLandingType', () => {

  let mockGetLandingsEntryOption;
  let mockGetExportPayload;
  let mockNumberOfUniqueLandings;
  let mockGetTransportDetails;

  beforeEach(() => {
    mockGetLandingsEntryOption = jest.spyOn(CatchCertService, 'getLandingsEntryOption');
    mockGetLandingsEntryOption.mockResolvedValue(undefined);

    mockGetExportPayload = jest.spyOn(ExportPayloadService, 'get');
    mockGetExportPayload.mockResolvedValue({});

    mockNumberOfUniqueLandings = jest.spyOn(SUT, 'numberOfUniqueLandings');
    mockNumberOfUniqueLandings.mockReturnValue(0);

    mockGetTransportDetails = jest.spyOn(TransportService, 'getTransportDetails');
    mockGetTransportDetails.mockResolvedValue({});
  });

  describe('if there is a landing entry option in the database', () => {

    it('should return the value from the db', async () => {
      mockGetLandingsEntryOption.mockResolvedValue(LandingsEntryOptions.UploadEntry);

      const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
      expect(result).toStrictEqual({ landingsEntryOption: LandingsEntryOptions.UploadEntry, generatedByContent: false });
    });

  });

  describe('if there is not a landing entry option in the database', () => {

    describe('and there are no landings for the certificate', () => {

      it('should return an undefined landing option', async () => {
        const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
        expect(result).toStrictEqual({ landingsEntryOption: null, generatedByContent: false });
      });

    });

    describe('and there are landings for the certificate', () => {

      it('should return as a manual entry if there is more than one unique landing', async () => {
        mockNumberOfUniqueLandings.mockReturnValue(2);

        const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
        expect(result).toStrictEqual({ landingsEntryOption: LandingsEntryOptions.ManualEntry, generatedByContent: true });

        expect(mockGetTransportDetails).not.toHaveBeenCalled();
      });

      it('should return as a direct landing if there is one unique landing and the transport vehicle is fishing vessel', async () => {
        mockNumberOfUniqueLandings.mockReturnValue(1);
        mockGetTransportDetails.mockResolvedValue({vehicle: fishingVessel});

        const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
        expect(result).toStrictEqual({ landingsEntryOption: LandingsEntryOptions.DirectLanding, generatedByContent: true });
      });

      it('should return as a manual entry if there is one unique landing and the transport vehicle is not fishing vessel', async () => {
        mockNumberOfUniqueLandings.mockReturnValue(1);
        mockGetTransportDetails.mockResolvedValue({vehicle: truck});

        const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
        expect(result).toStrictEqual({ landingsEntryOption: LandingsEntryOptions.ManualEntry, generatedByContent: true });
      });

      it('should return as a manual entry if there is one unique landing and the transport vehicle is undefined', async () => {
        mockNumberOfUniqueLandings.mockReturnValue(1);

        const result = await SUT.getLandingsType(USER_ID, DOCUMENT_NUMBER, contactId);
        expect(result).toStrictEqual({ landingsEntryOption: LandingsEntryOptions.ManualEntry, generatedByContent: true });
      });

    });

  });

});

describe('addLandingsEntryOption', () => {
  let mockGetTransportData: jest.SpyInstance;
  let mockUpsertTransportDetails: jest.SpyInstance;
  let mockUpsertLandingsEntryOption: jest.SpyInstance;

  beforeEach(() => {
    mockUpsertLandingsEntryOption = jest.spyOn(CatchCertService, 'upsertLandingsEntryOption');
    mockUpsertLandingsEntryOption.mockResolvedValue(undefined);

    mockGetTransportData = jest.spyOn(TransportService, "getTransportData");
    mockGetTransportData.mockResolvedValue({some: 'data'});

    mockUpsertTransportDetails = jest.spyOn(CatchCertService, "upsertTransportDetails");
    mockUpsertTransportDetails.mockResolvedValue({});
  });

  it('should not upsert transportation data if landingsEntryOption is not directLanding', async ()=> {
    await SUT.addLandingsEntryOption(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockGetTransportData).not.toHaveBeenCalledTimes(1);
    expect(mockUpsertTransportDetails).not.toHaveBeenCalledTimes(1);
  });

  it('should upsert transportation data if landingsEntryOption is directLanding', async ()=> {
    await SUT.addLandingsEntryOption(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.DirectLanding, contactId);

    expect(mockGetTransportData).toHaveBeenCalledTimes(1);
    expect(mockGetTransportData).toHaveBeenCalledWith(USER_ID,'catchCertificate',DOCUMENT_NUMBER, contactId);

    expect(mockUpsertTransportDetails).toHaveBeenCalledTimes(1);
    expect(mockUpsertTransportDetails).toHaveBeenCalledWith(USER_ID,{some: 'data',vehicle: fishingVessel},DOCUMENT_NUMBER, contactId);
  });
});

describe("confirmLandingsType", () => {

  let mockExportPayloadServiceGet: jest.SpyInstance;
  let mockExportPayloadServiceSave: jest.SpyInstance;
  let mockExportPayloadServiceUpsertLanding: jest.SpyInstance;
  let mockTransportServiceGet: jest.SpyInstance;
  let mockTransportServiceRemove: jest.SpyInstance;
  let mockCatchCertificateTransportServiceRemove: jest.SpyInstance;
  let mockLogger: jest.SpyInstance;
  let mockGetExportLocation: jest.SpyInstance;
  let mockAddExportLocation: jest.SpyInstance;
  let mockUpsertLandingsEntryOption: jest.SpyInstance;
  let mockAddLandingsEntryOption: jest.SpyInstance;

  const items = [
    {
      product: {
        id: "product-id",
        state: {
          label: "state-label",
        },
        species: {
          label: "species-label",
        },
        presentation: {
          label: "presentation-label",
        },
      },
      landings: [
        {
          model: {
            id: "landing-id",
          },
          editMode: true,
          modelCopy: true,
        },
        {
          model: {
            id: "landing-id-2",
          },
          editMode: true,
          modelCopy: true,
        },
      ],
    },
  ];

  const exportLocation = { exportedFrom: 'some-place', exportedTo: 'some-place' };

  beforeEach(() => {
    mockLogger = jest.spyOn(logger, 'info');

    mockExportPayloadServiceSave = jest.spyOn(ExportPayloadService, "save");
    mockExportPayloadServiceSave.mockReturnValue(null);

    mockExportPayloadServiceUpsertLanding = jest.spyOn(ExportPayloadService, "upsertLanding");
    mockExportPayloadServiceUpsertLanding.mockReturnValue(null);

    mockExportPayloadServiceGet = jest.spyOn(ExportPayloadService, "get");
    mockExportPayloadServiceGet.mockResolvedValue({ items });

    mockTransportServiceGet = jest.spyOn(TransportService, 'getTransportDetails');
    mockTransportServiceGet.mockResolvedValue({});

    mockGetExportLocation = jest.spyOn(CatchCertService, 'getExportLocation');
    mockGetExportLocation.mockResolvedValue(exportLocation);

    mockAddExportLocation = jest.spyOn(ExportLocationService, 'addExportLocation');
    mockAddExportLocation.mockResolvedValue({});

    mockTransportServiceRemove = jest.spyOn(TransportService, 'removeTransport');
    mockTransportServiceRemove.mockResolvedValue(undefined);

    mockCatchCertificateTransportServiceRemove = jest.spyOn(CatchCertificateTransportService, 'removeTransportations');
    mockCatchCertificateTransportServiceRemove.mockResolvedValue(undefined);

    mockUpsertLandingsEntryOption = jest.spyOn(CatchCertService, 'upsertLandingsEntryOption');
    mockUpsertLandingsEntryOption.mockResolvedValue(undefined);

    mockAddLandingsEntryOption = jest.spyOn(SUT, 'addLandingsEntryOption');
  })

  afterEach(() => {
    mockExportPayloadServiceUpsertLanding.mockRestore();
    mockExportPayloadServiceGet.mockRestore();
    mockExportPayloadServiceSave.mockRestore();
    mockTransportServiceGet.mockRestore();
    mockTransportServiceRemove.mockRestore();
    mockCatchCertificateTransportServiceRemove.mockRestore();
    mockLogger.mockRestore();
    mockAddLandingsEntryOption.mockRestore();
  });

  it('should call all methods needed to remove all landings and transport', async () => {

    const expected = [
      {
        product: {
          id: "product-id",
          state: {
            label: "state-label",
          },
          species: {
            label: "species-label",
          },
          presentation: {
            label: "presentation-label",
          },
        },
      },
    ];

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetExportLocation).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockCatchCertificateTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddExportLocation).toHaveBeenCalledWith(USER_ID, exportLocation, DOCUMENT_NUMBER, contactId);
    expect(mockLogger).toHaveBeenCalledWith('[CONFIRM-LANDINGS-TYPE][REMOVING-LANDINGS-FOR][product-id][SUCCESS]');
    expect(mockExportPayloadServiceSave).toHaveBeenCalledWith({ items: expected }, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
    expect(mockUpsertLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
  });

  it('should not remove landings OR transport', async () => {
    mockExportPayloadServiceGet.mockResolvedValue({ items: undefined });

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockExportPayloadServiceGet).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockLogger).not.toHaveBeenCalled();
    expect(mockExportPayloadServiceSave).not.toHaveBeenCalled();
    expect(mockGetExportLocation).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockCatchCertificateTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddExportLocation).not.toHaveBeenCalledWith(USER_ID, exportLocation, DOCUMENT_NUMBER, contactId);
    expect(mockAddLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
    expect(mockUpsertLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
  });

  it('should not remove landings OR transport if no exportLocation', async () => {

    mockGetExportLocation.mockResolvedValue(undefined);

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockCatchCertificateTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddExportLocation).not.toHaveBeenCalledWith(USER_ID, exportLocation ,DOCUMENT_NUMBER, contactId);
    expect(mockAddLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
    expect(mockUpsertLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
  });

  it('should not remove landings OR transport if items is not an array', async () => {

    mockExportPayloadServiceGet.mockResolvedValue({ items: {} });

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockExportPayloadServiceSave).not.toHaveBeenCalled();
    expect(mockTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockCatchCertificateTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddExportLocation).not.toHaveBeenCalledWith(USER_ID, exportLocation, DOCUMENT_NUMBER, contactId);
    expect(mockAddLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
    expect(mockUpsertLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
  });

  it('should not remove landings OR transport if items array is empty', async () => {

    mockExportPayloadServiceGet.mockResolvedValue({ items: [] });

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockExportPayloadServiceSave).not.toHaveBeenCalled();
    expect(mockTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockCatchCertificateTransportServiceRemove).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockAddExportLocation).not.toHaveBeenCalledWith(USER_ID, exportLocation, DOCUMENT_NUMBER, contactId);
    expect(mockAddLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
    expect(mockUpsertLandingsEntryOption).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);
  });

  it('should not add export location if is empty', async () => {
    mockGetExportLocation.mockResolvedValue({});

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockAddExportLocation).not.toHaveBeenCalled();
  });

  it('should not add export location if is undefined', async () => {
    mockGetExportLocation.mockResolvedValue(undefined);

    await SUT.confirmLandingsType(USER_ID, DOCUMENT_NUMBER, LandingsEntryOptions.ManualEntry, contactId);

    expect(mockAddExportLocation).not.toHaveBeenCalled();
  });

});
