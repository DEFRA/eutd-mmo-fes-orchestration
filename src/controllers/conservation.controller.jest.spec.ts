import * as Hapi from "@hapi/hapi";
import ConservationService from "../services/conservation.service";

import ConservationController from "./conservation.controller";

describe("ConservationController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const CONTACT_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ13';
  const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      redirect: "/test-url/{documentNumber}/test",
      dashboardUri: "/test-url/dashboardUri",
      currentUri: "/test-url/currentUri",
      nextUri: "/test-url/nextUri",
      user_id: USER_ID
    },
    headers: { accept: "text/html" },
  };
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockAddConservation: jest.SpyInstance;
  let mockRedirect: jest.SpyInstance;

  beforeEach(() => {
    mockAddConservation = jest.spyOn(ConservationService, "addConservation");
    mockAddConservation.mockResolvedValue(null);

    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);
  });

  afterEach(() => {
    jest.resetAllMocks();
  })

  describe("addConservation()", () => {

    it("should redirect to payload.dashboardUri", async () => {
      await ConservationController.addConservation(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.dashboardUri);
    });

    it("should redirect to payload.currentUri", async () => {
      mockAddConservation.mockResolvedValue({ conservationReference: "Other" });
      await ConservationController.addConservation(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.currentUri);
    });

    it("should redirect to payload.nextUri", async () => {
      mockAddConservation.mockResolvedValue({ conservationReference: "not-Other" });

      await ConservationController.addConservation(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.nextUri);
    });

    it("should return data", async () => {
      mockAddConservation.mockResolvedValue({ conservationReference: "Other" });
      mockReq.headers.accept = "invalid";

      const result = await ConservationController.addConservation(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {"conservationReference": "Other"};
      expect(result).toEqual(expectedResult);
    });

  });

  describe("getConservation()", () => {
    let mockGetConservation: jest.SpyInstance;

    it("should call ConservationService.getConservation() wit the right params", async () => {
      mockGetConservation = jest.spyOn(ConservationService, "getConservation");
      mockGetConservation.mockReturnValue(null);

      await ConservationController.getConservation(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      expect(mockGetConservation).toHaveBeenCalledWith(mockReq.payload, DOCUMENT_NUMBER, CONTACT_ID);
    });
  });

  describe("addConservationAndSaveAsDraft()", () => {

    it("should return a valid result", async () => {
      const mockAddConservation = jest.spyOn(ConservationController, 'addConservation');
      mockAddConservation.mockResolvedValue(null);
      await ConservationController.addConservationAndSaveAsDraft(mockReq, h, true, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      expect(mockAddConservation).toHaveBeenCalledWith(mockReq, h, true, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      mockAddConservation.mockReset()
    });
  });

});

