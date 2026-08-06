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
      const truckDetailsUri = "truck-details-uri";
      const result = TransportController.nextVehicleUri({
        vehicle: "truck",
        truckDetailsUri,
      });
      expect(result).toEqual(truckDetailsUri);
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

  describe("addTransport()", () => {
    it("should redirect to dashboardUri when savingAsDraft is true", async () => {
      await TransportController.addTransport(
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
      await TransportController.addTransport(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      const uri = TransportController.nextVehicleUri(mockReq.payload);
      expect(mockRedirect).toHaveBeenCalledWith(uri);
    });

    it("should return a result object when accept header is not text/html", async () => {
      const req = {
        ...mockReq,
        headers: { accept: "application/json" }
      };
      const result = await TransportController.addTransport(
        req,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        contactId
      );

      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
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

    it("should error when arrival departure date is after the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: "10/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateAnyMax' });
    });

    it("should not error when arrival departure date equals the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "plane",
          departureDate: "09/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorPlaneDepartureDateAnyMax' });
    });

    it("should not error when arrival departure date is before the facilityArrivalDate", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "train",
          departureDate: "08/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTrainDepartureDateAnyMax' });
    });

    it("should not validate arrival departure date when not arrival transport", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "containerVessel",
          departureDate: "10/11/2025",
          arrival: false,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorContainerVesselDepartureDateAnyMax' });
    });

    it("should not validate arrival departure date when journey is not storageNotes", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: "10/11/2025",
          arrival: true,
          journey: "catchCertificate"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateAnyMax' });
    });

    it("should not validate when storage document has no facilityArrivalDate", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "containerVessel",
          departureDate: "10/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorContainerVesselDepartureDateAnyMax' });
    });

    it("should error with TodayMax when no facilityArrivalDate and departure date is in the future (truck)", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yyyy = tomorrow.getFullYear();

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: `${dd}/${mm}/${yyyy}`,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateTodayMax' });
    });

    it("should error with TodayMax when no facilityArrivalDate and departure date is in the future (plane)", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yyyy = tomorrow.getFullYear();

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "plane",
          departureDate: `${dd}/${mm}/${yyyy}`,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorPlaneDepartureDateTodayMax' });
    });

    it("should error with TodayMax when no facilityArrivalDate and departure date is in the future (train)", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yyyy = tomorrow.getFullYear();

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "train",
          departureDate: `${dd}/${mm}/${yyyy}`,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorTrainDepartureDateTodayMax' });
    });

    it("should error with TodayMax when no facilityArrivalDate and departure date is in the future (containerVessel)", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yyyy = tomorrow.getFullYear();

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "containerVessel",
          departureDate: `${dd}/${mm}/${yyyy}`,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorContainerVesselDepartureDateTodayMax' });
    });

    it("should not error with TodayMax when no facilityArrivalDate and departure date is today", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: `${dd}/${mm}/${yyyy}`,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateTodayMax' });
    });

    it("should not error with TodayMax when storage document is null and departure date is null", async () => {
      mockGet.mockResolvedValueOnce(null);

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: undefined,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateTodayMax' });
    });

    it("should not validate when storage document is null", async () => {
      mockGet.mockResolvedValueOnce(null);

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "plane",
          departureDate: "10/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorPlaneDepartureDateAnyMax' });
    });

    it("should handle departureDate with single digit day format (D/MM/YYYY)", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: "5/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateAnyMax' });
    });

    it("should handle departureDate with single digit month format (DD/M/YYYY)", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "train",
          departureDate: "08/9/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTrainDepartureDateAnyMax' });
    });

    it("should handle departureDate with both single digits (D/M/YYYY)", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "containerVessel",
          departureDate: "5/9/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorContainerVesselDepartureDateAnyMax' });
    });

    it("should not validate when departureDate is missing", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "truck",
          departureDate: undefined,
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).not.toHaveBeenCalledWith({ departureDate: 'errorTruckDepartureDateAnyMax' });
    });

    it("should not validate exportDate when exportDate is missing", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "directLanding",
          exportDate: undefined
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

    it("should not validate exportDate when storage document has no facilityArrivalDate", async () => {
      mockGet.mockResolvedValueOnce({ ...storageDocument, facilityArrivalDate: undefined });

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "directLanding",
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

      expect(mockResponse).not.toHaveBeenCalledWith({ exportDate: 'error.directLanding.exportDate.any.min' });
    });

    it("should not validate exportDate when storage document is null", async () => {
      mockGet.mockResolvedValueOnce(null);

      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "directLanding",
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

      expect(mockResponse).not.toHaveBeenCalledWith({ exportDate: 'error.directLanding.exportDate.any.min' });
    });

    it("should handle exportDate with single digit day format (D/MM/YYYY)", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "directLanding",
          exportDate: "15/11/2025"
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

    it("should error for all vehicle types: containerVessel", async () => {
      const req = {
        ...mockReq,
        payload: {
          ...mockReq.payload,
          vehicle: "containerVessel",
          departureDate: "15/11/2025",
          arrival: true,
          journey: "storageNotes"
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

      expect(mockResponse).toHaveBeenCalledWith({ departureDate: 'errorContainerVesselDepartureDateAnyMax' });
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

  it("addTransportDetailsSaveAsDraft() should return a valid return object", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await TransportController.addTransportDetailsSaveAsDraft(mockReq, h, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(result).toEqual(data);
    mockReq.headers.accept = "text/html";
  });
});
