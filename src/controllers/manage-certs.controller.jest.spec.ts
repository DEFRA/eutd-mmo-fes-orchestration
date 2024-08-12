import * as Hapi from "@hapi/hapi";
import * as MonitoringService from "../services/protective-monitoring.service";
import * as constants from "../session_store/constants";
import ManageCertsService from "../services/manage-certs.service";

import SUT from "./manage-certs.controller";

describe("ManageCertificatesController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  let mockReq: any;
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockRedirect: jest.SpyInstance;
  let mockDeleteDraftCertificate: jest.SpyInstance;

  beforeAll(() => {
    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);
    mockDeleteDraftCertificate = jest.spyOn(
      ManageCertsService,
      "deleteDraftCertificate"
    );
    mockDeleteDraftCertificate.mockReturnValue(null);
  });

  beforeEach(() => {
    mockReq = {
      app: { claims: { sub: USER_ID, email: "test@test.com" } },
      params: { documentType: "catchCertificate" },
      payload: {
        redirect: "/test-url/{documentNumber}/test",
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        previousUri: "/test-url/previousUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        documentDelete: "No",
      },
      headers: { accept: "text/html" },
    };
  });

  describe("deleteDraftCertificate()", () => {
    it("redirects to previousUri when payload.documentDelete is not 'Yes'", async () => {
      await SUT.deleteDraftCertificate(mockReq, h);
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.previousUri);
    });

    it("redirects to nextUri when payload.documentDelete is 'Yes'", async () => {
      mockReq.payload.documentDelete = "Yes";
      await SUT.deleteDraftCertificate(mockReq, h);
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.nextUri);
    });

    it("will return the payload object when accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await SUT.deleteDraftCertificate(
        mockReq,
        h
      );
      expect(result).toEqual(mockReq.payload);
    });

    it("should print exception to console.error", async () => {
      mockReq.payload.documentDelete = "Yes";
      const mockConsoleError = jest.spyOn(console, "error");
      mockConsoleError.mockReturnValue(null);
      mockDeleteDraftCertificate.mockImplementation(() => {
        throw new Error();
      });

      await SUT.deleteDraftCertificate(mockReq, h);
      expect(mockConsoleError).toHaveBeenCalledWith(new Error());
    });
  });

  describe("voidCertificate()", () => {
    let mockVoidCertificate: jest.SpyInstance;

    beforeAll(() => {
      mockVoidCertificate = jest.spyOn(ManageCertsService, "voidCertificate");
      mockVoidCertificate.mockResolvedValue(true);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it("redirects to payload.previousUri when payload.documentVoid is not 'Yes'", async () => {
      await SUT.voidCertificate(mockReq, h);
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.previousUri);
    });

    it("returns payload object when payload.documentVoid is not 'Yes' and accept header is not text/html", async () => {
      mockReq.headers.accept = "application/pdf";
      const result = await SUT.voidCertificate(
        mockReq,
        h
      );
      expect(result).toEqual(mockReq.payload);
    });

    it("redirects to nextUri when payload.documentVoid is 'Yes'", async () => {
      mockReq.payload.documentVoid = "Yes";
      mockReq.payload.ipAddress = "client-ip";
      mockReq.payload.journey = "journey-id";

      await SUT.voidCertificate(mockReq, h);

      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.previousUri);
    });

    it("should print exception to console.error", async () => {
      mockVoidCertificate.mockImplementation(() => {
        throw new Error();
      });
      const mockConsoleError = jest.spyOn(console, "error");
      mockConsoleError.mockReturnValue(null);
      mockReq.payload.documentVoid = "Yes";

      await SUT.voidCertificate(mockReq, h);

      expect(mockConsoleError).toHaveBeenCalledWith(new Error());
    });

    describe("When posting events to event hub", () => {
      let mockPostEventData: jest.SpyInstance;

      beforeEach(() => {
        mockPostEventData = jest.spyOn(MonitoringService, "postEventData");
        mockPostEventData.mockResolvedValue(null);
      });

      afterEach(() => {
        mockPostEventData.mockRestore();
      });

      describe("When voiding a CC catch certificate", () => {
        const mockReq: any = {
          headers: {},
          app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891" } },
          payload: {
            redirect: "/test-url/{documentNumber}/test",
            dashboardUri: "/test-url/dashboardUri",
            currentUri: "/test-url/currentUri",
            previousUri: "/test-url/previousUri",
            nextUri: "/test-url/nextUri",
            clientip: "client-ip",
            documentNumber: "document-CC-number",
            journey: constants.CATCH_CERTIFICATE_KEY,
            documentVoid: 'Yes',
            ipAddress: 'client-ip'
          }
        };

        it("should successfully post a void event", async () => {
          mockVoidCertificate.mockResolvedValue(true);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'User voided a catch certificate',
            'void/catch certificate/dn:document-CC-number',
            'client-ip',
            0,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-CC'
          );
        });

        it("should successfully post a unsual void event", async () => {
          mockVoidCertificate.mockResolvedValue(false);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'An attempt was made to void a catch certificate not created by the current user',
            'void/catch certificate/dn:document-CC-number',
            'client-ip',
            5,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-CC'
          );
        });
      });

      describe("When voiding a PS catch certificate", () => {
        const mockReq: any = {
          headers: {},
          app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891" } },
          payload: {
            redirect: "/test-url/{documentNumber}/test",
            dashboardUri: "/test-url/dashboardUri",
            currentUri: "/test-url/currentUri",
            previousUri: "/test-url/previousUri",
            nextUri: "/test-url/nextUri",
            clientip: "client-ip",
            documentNumber: "document-PS-number",
            journey: constants.PROCESSING_STATEMENT_KEY,
            documentVoid: 'Yes',
            ipAddress: 'client-ip'
          }
        };

        it("should successfully post a void event", async () => {
          mockVoidCertificate.mockResolvedValue(true);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'User voided a processing statement',
            'void/processing statement/dn:document-PS-number',
            'client-ip',
            0,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-PS'
          );

        });

        it("should successfully post a unsual void event", async () => {
          mockVoidCertificate.mockResolvedValue(false);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'An attempt was made to void a processing statement not created by the current user',
            'void/processing statement/dn:document-PS-number',
            'client-ip',
            5,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-PS'
          );

        });
      });

      describe("When voiding a SD catch certificate", () => {
        const mockReq: any = {
          app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891" } },
          payload: {
            redirect: "/test-url/{documentNumber}/test",
            dashboardUri: "/test-url/dashboardUri",
            currentUri: "/test-url/currentUri",
            previousUri: "/test-url/previousUri",
            nextUri: "/test-url/nextUri",
            clientip: "client-ip",
            documentNumber: "document-SD-number",
            journey: constants.STORAGE_NOTES_KEY,
            documentVoid: 'Yes',
            ipAddress: 'client-ip'
          }
        };

        it("should successfully post a download event", async () => {
          mockVoidCertificate.mockResolvedValue(true);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'User voided a storage document',
            'void/storage document/dn:document-SD-number',
            'client-ip',
            0,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-SD'
          );
        });

        it("should successfully post a unsual void event", async () => {
          mockVoidCertificate.mockResolvedValue(false);

          await SUT.voidCertificate(mockReq, h);
          expect(mockPostEventData).toHaveBeenCalled();
          expect(mockPostEventData).toHaveBeenCalledWith(
            USER_ID,
            'An attempt was made to void a storage document not created by the current user',
            'void/storage document/dn:document-SD-number',
            'client-ip',
            5,
            '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
            'VOID-SD'
          );
        });
      });
    });
  });
});
