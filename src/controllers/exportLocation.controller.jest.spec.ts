import * as Hapi from "@hapi/hapi";
import Services from "../services/exportLocation.service";
import ExportLocationController from "./exportLocation.controller";

describe("ExportLocationController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const CONTACT_ID = 'contactBob';
  const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";
  const mockReq: any = {
    app: { claims: { sub: "test", contactId: 'contactBob', email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      redirect: "/test-url/{documentNumber}/test",
      dashboardUri: "/test-url/dashboardUri",
      currentUri: "/test-url/currentUri",
      nextUri: "/test-url/nextUri",
      user_id: USER_ID,
    },
    headers: { accept: "text/html" },
  };
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  describe("getExportLocation()", () => {
    it("should call Services.get() with the right params", async () => {
      const mockServicesGet = jest.spyOn(Services, "get");
      mockServicesGet.mockReturnValue(null);
      await ExportLocationController.getExportLocation(
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockServicesGet).toHaveBeenCalled();
    });
  });

  describe("addExportLocation()", () => {
    let mockRedirect: jest.SpyInstance;
    let mockAddExportLocation: jest.SpyInstance;

    beforeAll(() => {
      mockAddExportLocation = jest.spyOn(Services, "addExportLocation");
      mockAddExportLocation.mockReturnValue(null);
      mockRedirect = jest.spyOn(h, "redirect");
      mockRedirect.mockReturnValue(null);
    });

    it("should call Services.addExportLocation() with the right params", async () => {
      await ExportLocationController.addExportLocation(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockAddExportLocation).toHaveBeenCalledWith(
        USER_ID,
        mockReq.payload,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.nextUri);
    });

    it("should return a result if the accept request header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await ExportLocationController.addExportLocation(
        mockReq,
        h,
        false,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(result).toEqual(null);
      mockReq.headers.accept = "text/html";
    });
  });

  describe("addExportLocationAndSaveAsDraft", () => {
    it("should call ExportLocationController.addExportLocation() with the right params", async () => {
      const mockAddExportLocation = jest.spyOn(
        ExportLocationController,
        "addExportLocation"
      );
      mockAddExportLocation.mockReturnValue(null);
      await ExportLocationController.addExportLocationAndSaveAsDraft(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      expect(mockAddExportLocation).toHaveBeenCalledWith(
        mockReq,
        h,
        true,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
    });
  });
});
