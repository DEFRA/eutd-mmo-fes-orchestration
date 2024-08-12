import * as Hapi from "@hapi/hapi";
import * as constants from '../session_store/constants';
import * as MonitoringService from "../services/protective-monitoring.service";

import SUT from './protection-monitoring.controller';

describe("ProtectionMonitoringController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const h = {
    response: () => ({
      code: c => c
    }),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockPostEventData;

  beforeAll(() => {
    mockPostEventData = jest.spyOn(MonitoringService, "postEventData")
  })

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe("When viewing a CC catch certificate", () => {
    const mockReq: any = {
      app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891"  } },
      payload: {
        clientip: "client-ip",
        documentNumber: "document-CC-number",
        journey: constants.CATCH_CERTIFICATE_KEY
      }
    };

    it("should successfully post a download event", async () => {
      const result = await SUT.postEvent(mockReq, h);
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        USER_ID,
        'User successfully downloaded a catch certificate',
        'viewed/catch certificate/dn:document-CC-number',
        'client-ip',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'DOWNLOAD-CC'
      );
      expect(result).toEqual(200);
    });
  });

  describe("When viewing a PS catch certificate", () => {
    const mockReq: any = {
      app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891"  } },
      payload: {
        clientip: "client-ip",
        documentNumber: "document-PS-number",
        journey: constants.CATCH_CERTIFICATE_KEY
      }
    };

    it("should successfully post a download event", async () => {
      mockReq.payload.journey = constants.PROCESSING_STATEMENT_KEY;
      const result = await SUT.postEvent(mockReq, h);
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        USER_ID,
        'User successfully downloaded a processing statement',
        'viewed/processing statement/dn:document-PS-number',
        'client-ip',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'DOWNLOAD-PS'
      );

      expect(result).toEqual(200);

    });
  });

  describe("When viewing a SD catch certificate", () => {
    const mockReq: any = {
      app: { claims: { sub: USER_ID, email: "test@test.com", auth_time: "1605023794", contactId: "03fece4e-61e4-e911-a978-000d3a28d891"  } },
      payload: {
        clientip: "client-ip",
        documentNumber: "document-SD-number",
        journey: constants.CATCH_CERTIFICATE_KEY
      }
    };

    it("should successfully post a download event", async () => {
      mockReq.payload.journey = constants.STORAGE_NOTES_KEY;
      const result = await SUT.postEvent(mockReq, h);
      expect(mockPostEventData).toHaveBeenCalled();
      expect(mockPostEventData).toHaveBeenCalledWith(
        USER_ID,
        'User successfully downloaded a storage document',
        'viewed/storage document/dn:document-SD-number',
        'client-ip',
        0,
        '1605023794:03fece4e-61e4-e911-a978-000d3a28d891', // need this properly plumed in
        'DOWNLOAD-SD'
      );
      expect(result).toEqual(200);
    });
  });
});
