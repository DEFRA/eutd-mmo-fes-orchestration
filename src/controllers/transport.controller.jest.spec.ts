import * as Hapi from "@hapi/hapi";
import Services from "../services/transport.service";

import TransportController from "./transport.controller";
import OrchestrationService from "../services/orchestration.service";

describe("TransportController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const contactId = 'contactBob';
  const DOCUMENT_NUMBER = "document-number";
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      redirect: "/test-url/{documentNumber}/test",
      dashboardUri: "/test-url/dashboardUri",
      currentUri: "/test-url/currentUri",
      nextUri: "/test-url/nextUri",
      summaryUri: "/test-url/summary-uri",
      user_id: USER_ID,
      cancel: {},
      commodity_code: "commodity-code",
      commodity_code_description: "commodity-code-description",
      presentationLabel: "Whole",
      stateLabel: "Fresh",
      vehicle: "directLanding",
      cmr: "true"
    },
    headers: { accept: "text/html" },
  };
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;
  const data = {};
  const storageDocument = {
    arrivalTransportation: {
      vehicle: "plane",
      departureDate: "09/11/2025"
    },
    facilityName: "name",
    facilityAddressOne: "MMO SUB, LANCASTER HOUSE, HAMPSHIRE COURT",
    facilityTownCity: "NEWCASTLE UPON TYNE",
    facilityPostcode: "NE4 7YH",
    facilitySubBuildingName: "MMO SUB",
    facilityBuildingNumber: "",
    facilityBuildingName: "LANCASTER HOUSE",
    facilityStreetName: "HAMPSHIRE COURT",
    facilityCounty: "TYNESIDE",
    facilityCountry: "ENGLAND",
    facilityApprovalNumber: "UK/ABC/001",
    facilityArrivalDate: "09/11/2025",
    addAnotherProduct: "notset",
  };

  let mockResponse: jest.SpyInstance;
  let mockRedirect: jest.SpyInstance;
  let mockAddTransport: jest.SpyInstance;
  let mockGetTransportDetails: jest.SpyInstance;
  let mockGet: jest.SpyInstance;

  beforeEach(() => {
    mockResponse = jest.spyOn(h, "response");
    mockResponse.mockReturnValue({
      code: () => ({
        takeover: () => jest.fn()
      })
    });
    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);
    mockAddTransport = jest.spyOn(Services, "addTransport");
    mockAddTransport.mockReturnValue(data);
    mockGetTransportDetails = jest.spyOn(Services, "getTransportDetails");
    mockGetTransportDetails.mockReturnValue(data);
    mockGet = jest.spyOn(OrchestrationService, "getFromMongo");
    mockGet.mockResolvedValue(storageDocument);
  });

  afterEach(() => {
    jest.resetAllMocks();
  })

  describe("nextVehicleUri() should return a valid nextUri", () => {
    it("case truck", () => {
      const truckCmrUri = "truck-cmr-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "truck",
        truckCmrUri,
      });
      expect(result).toEqual(truckCmrUri);
    });

    it("case plane", () => {
      const planeDetailsUri = "plane-details-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "plane",
        planeDetailsUri,
      });
      expect(result).toEqual(planeDetailsUri);
    });

    it("case train", () => {
      const trainDetailsUri = "train-details-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "train",
        trainDetailsUri,
      });
      expect(result).toEqual(trainDetailsUri);
    });

    it("case containerVessel", () => {
      const containerVesselDetailsUri = "container-vessel-details-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "containerVessel",
        containerVesselDetailsUri,
      });
      expect(result).toEqual(containerVesselDetailsUri);
    });

    it("case directLanding", () => {
      const summaryUri = "summary-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "directLanding",
        summaryUri,
      });
      expect(result).toEqual(summaryUri);
    });
  });

  describe("nextTruckUri()", () => {
    const payload = {
      summaryUri: "summary-uri",
      cmr: "true",
      truckDetailsUri: "truck-details-uri",
    };

    it("returns summaryUri when cmr is 'true'", () => {
      const result = TransportController.nextTruckUri(payload);
      expect(result).toEqual(payload.summaryUri);
    });

    it("returns truckDetailsUri when cmr is not 'true'", () => {
      payload.cmr = "false";
      const result = TransportController.nextTruckUri(payload);
      expect(result).toEqual(payload.truckDetailsUri);
    });
  });

  describe("addTransportDetails()", () => {

    it("should redirect to dashboardUri when savingAsDraft is true", async () => {
      await TransportController.addTransportDetails(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.dashboardUri);
    });

    it("should redirect to nextUri when savingAsDraft is false", async () => {
      await TransportController.addTransportDetails(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.nextUri);
    });

    it("should return a result object when accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await TransportController.addTransportDetails(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(result).toEqual(data);
      mockReq.headers.accept = "text/html";
    });

    it("should error when export date is earlier than the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          exportDate: "08/11/2025"
        }
      }
      await TransportController.addTransportDetails(
        req,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockResponse).toHaveBeenCalledWith({ exportDate: 'error.directLanding.exportDate.any.min' });
    });

    it("should not error when export date is equal to the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          exportDate: "09/11/2025"
        }
      }
      await TransportController.addTransportDetails(
        req,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockResponse).not.toHaveBeenCalledWith({ exportDate: 'error.directLanding.exportDate.any.min' });
    });

    it("should not error when export date is after the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          exportDate: "10/11/2025"
        }
      }
      await TransportController.addTransportDetails(
        req,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockResponse).not.toHaveBeenCalledWith({ exportDate: 'error.directLanding.exportDate.any.min' });
    });
  });

  describe("addTruckCMR()", () => {
    it("should redirect to dashboardUri when savingAsDraft is true", async () => {
      await TransportController.addTruckCMR(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.dashboardUri);
    });

    it("should redirect to nextUri when savingAsDraft is false", async () => {
      await TransportController.addTruckCMR(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.summaryUri);
    });

    it("should return a result object when accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await TransportController.addTruckCMR(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(result).toEqual(data);
      mockReq.headers.accept = "text/html";
    });
  });

  describe("getTransportDetails()", () => {
    it("should return a valid result object", async () => {
      const result = await TransportController.getTransportDetails(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
      expect(result).toEqual(data);
    });
  });

  it("addTransportSaveAsDraft() should return a valid return object", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await TransportController.addTransportSaveAsDraft(mockReq, h, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(result).toEqual(data);
    mockReq.headers.accept = "text/html";
  });

  it("addTruckCMRSaveAsDraft() should return a valid return object", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await TransportController.addTruckCMRSaveAsDraft(mockReq, h, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(result).toEqual(data);
    mockReq.headers.accept = "text/html";
  });

  it("addTransportDetailsSaveAsDraft() should return a valid return object", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await TransportController.addTransportDetailsSaveAsDraft(mockReq, h, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(result).toEqual(data);
    mockReq.headers.accept = "text/html";
  });
});
