import TransportService from "./transport.service"
import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageNotesService from '../persistence/services/storageDoc';
import { MockSessionStorage } from "../../test/session_store/mock";
import { SessionStoreFactory } from '../session_store/factory';
import * as SessionManager from "../helpers/sessionManager"
import * as FrontEndFunctions from '../persistence/schema/frontEndModels/transport'

describe("The Transport Service", () => {

  const contactId = 'contactBob';

  let mockGetTransportData;
  let mockGetTransportDetails;
  let mockCatchCertUpsertTransportData;
  let mockStorageNoteUpsertTransportData;
  let mockGetCurrentSessionData;
  let mockCheckTransportDataFrontEnd;

  const mockSessionStore = new MockSessionStorage();
  const mockWriteAllFor = jest.fn();
  const mockReadAllFor = jest.fn();
  mockSessionStore.writeAllFor = mockWriteAllFor;
  mockSessionStore.readAllFor = mockReadAllFor;

  const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
  mockGetSessionStore.mockResolvedValue(mockSessionStore);

  beforeEach(() => {
    mockGetTransportData = jest.spyOn(TransportService, 'getTransportData');
    mockGetTransportDetails = jest.spyOn(TransportService, 'getTransportDetails');
    mockCheckTransportDataFrontEnd = jest.spyOn(FrontEndFunctions, 'checkTransportDataFrontEnd');
    mockCatchCertUpsertTransportData = jest.spyOn(CatchCertService, 'upsertTransportDetails');
    mockStorageNoteUpsertTransportData = jest.spyOn(StorageNotesService, 'upsertTransportDetails');
    mockGetCurrentSessionData = jest.spyOn(SessionManager,'getCurrentSessionData');
  });

  afterEach(() => {
    mockGetTransportData.mockRestore();
    mockGetTransportDetails.mockRestore();
    mockCheckTransportDataFrontEnd.mockRestore();
    mockCatchCertUpsertTransportData.mockRestore();
    mockStorageNoteUpsertTransportData.mockRestore();
    mockGetCurrentSessionData.mockRestore();
  });

  describe("With a catchcertificate journey", () => {
    it("Will call upsert transport data with the correct params", async () => {
      mockGetTransportData.mockResolvedValue(null);
      mockCatchCertUpsertTransportData.mockResolvedValue({});
      mockReadAllFor.mockResolvedValue({});

      await TransportService.addTransport({user_id: "Bob", journey: "catchCertificate", transport: "some data"},'GB-34324-34234-234234', contactId);

      expect(mockCatchCertUpsertTransportData).toHaveBeenCalledWith("Bob", {"journey": "catchCertificate", "transport": "some data", "user_id": "Bob"},'GB-34324-34234-234234', 'contactBob');
    });

    it("Will retrieve transport details from mongo together with relevant session data", async () => {
      const sessionData : SessionManager.SessionStore = {
        documentNumber : "GBR-34324-234234-234234",
        currentUri: "test/test.html",
        nextUri: "testNext/testNext.html"
      };

      const expectedResult = {
          currentUri : "test/test.html",
          journey: "catchCertificate",
          nextUri: "testNext/testNext.html",
          user_id: "User 1"
      };

      const sessionDataMock = jest.spyOn(SessionManager, 'getCurrentSessionData');
      sessionDataMock.mockResolvedValue(sessionData);
      mockGetTransportData.mockResolvedValue({});

      const result = await TransportService.getTransportDetails('User 1', 'catchCertificate','GB-34324-34234-234234', contactId, undefined);

      expect(result).toStrictEqual(expectedResult);
      expect(mockGetTransportData).toHaveBeenCalledWith('User 1', 'catchCertificate','GB-34324-34234-234234', contactId, undefined);
    });

    it("will deal with no transport data", async () => {
      mockGetTransportData.mockResolvedValue(null);

      const result = await TransportService.getTransportDetails("User 1","catchCertificate",'GB-34324-34234-234234', contactId, undefined);

      expect(result).toEqual({})
    });

    it("Will call upsert transport with the correct params", async () => {
      mockGetTransportData.mockResolvedValue(null);
      mockCatchCertUpsertTransportData.mockResolvedValue({});
      mockReadAllFor.mockResolvedValue({});

      await TransportService.addTransport({user_id: "Bob", journey: "catchCertificate", transport: "some data"},'GB-34324-34234-234234', contactId);

      expect(mockCatchCertUpsertTransportData).toHaveBeenCalledWith("Bob", {"journey": "catchCertificate", "transport": "some data", "user_id": "Bob"},"GB-34324-34234-234234", contactId);
    });

    it("Will save transport details to mongo when there existing data", async () => {
      mockGetCurrentSessionData.mockResolvedValue(undefined);
      mockGetTransportData.mockResolvedValue({
        vehicle : "water rocket"
      });
      mockCatchCertUpsertTransportData.mockResolvedValue({});

      await TransportService.addTransport({user_id: "Bob", journey: "catchCertificate", transport: "some data", vehicle: "water rocket"},'GB-34324-34234-234234', contactId);

      expect(mockCatchCertUpsertTransportData).toHaveBeenCalledWith("Bob", {"journey": "catchCertificate", "transport": "some data", "vehicle" : "water rocket", "user_id": "Bob"},"GB-34324-34234-234234", contactId);
    });

    it("Will save session data in REDIS", async () => {
      mockGetCurrentSessionData.mockResolvedValue(undefined);
      mockGetTransportData.mockResolvedValue({
        vehicle : "water rocket"
      });
      mockCatchCertUpsertTransportData.mockResolvedValue({});
      mockReadAllFor.mockReturnValue(Promise.resolve({}));

      await TransportService.addTransport({user_id: "Bob", journey: "catchCertificate", transport: "some data", vehicle: "water rocket"},'GB-34324-34234-234234', contactId);

      expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
      expect(mockReadAllFor).toHaveBeenCalledTimes(1);
    });

    it("Will deal with no session data", async () => {

      const expectedResult = {
        journey: "catchCertificate",
        user_id: "User 1"
      };

      const sessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData');
      sessionDataMock.mockResolvedValue(null);
      mockGetTransportData.mockResolvedValue({});
      mockCheckTransportDataFrontEnd.mockResolvedValue({});

      const result = await TransportService.getTransportDetails("User 1", "catchCertificate",'GB-34324-34234-234234', contactId);

      expect(result).toStrictEqual(expectedResult)
    });

  });

  describe("With a storageNotes journey", () => {
    it("Will retrieve transport details from mongo", async () => {
      mockGetTransportData.mockResolvedValue(null);

      await TransportService.getTransportDetails("User 1", "storageNotes",undefined, contactId, undefined);

      expect(mockGetTransportData).toHaveBeenCalledWith('User 1', 'storageNotes',undefined, contactId, undefined);
    });

    it("Will call upsert transport data with the correct params", async () => {
      mockGetTransportData.mockResolvedValue(null);
      mockStorageNoteUpsertTransportData.mockResolvedValue({});
      mockReadAllFor.mockResolvedValue({});

      await TransportService.addTransport({user_id: "Bob", journey: "storageNotes", transport: "some data"},'GB-34324-34234-234234', contactId);

      expect(mockStorageNoteUpsertTransportData).toHaveBeenCalledWith("Bob", {"journey": "storageNotes", "transport": "some data", "user_id": "Bob"},'GB-34324-34234-234234', contactId, undefined);
    });

    it("Will save transport details to mongo when there existing data", async () => {
      mockGetTransportData.mockResolvedValue({
        vehicle : "rocket"
      });

      mockGetTransportDetails.mockResolvedValue({
        vehicle : "rocket"
      });
      mockStorageNoteUpsertTransportData.mockResolvedValue({});

      await TransportService.addTransport({user_id: "Bob", journey: "storageNotes", transport: "some data", vehicle: "rocket"},'GB-34324-34234-234234', contactId);

      expect(mockStorageNoteUpsertTransportData).toHaveBeenCalledWith("Bob", {"journey": "storageNotes", "transport": "some data", "vehicle" : "rocket", "user_id": "Bob"},'GB-34324-34234-234234', contactId, undefined);
    });

    it("Will save session data in REDIS", async () => {
      mockGetTransportData.mockResolvedValue(null);
      mockStorageNoteUpsertTransportData.mockResolvedValue({});

      mockReadAllFor.mockReturnValue(Promise.resolve({}));

      await TransportService.addTransport({user_id: "Bob", journey: "storageNotes", transport: "some data", vehicle: "water rocket"},'GB-34324-34234-234234', contactId);

      expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
      expect(mockReadAllFor).toHaveBeenCalledTimes(1);
    });

    it("Will deal with no session data", async () => {
      const expectedResult = {
        journey: "storageNotes",
        user_id: "User 1"
      };

      mockGetCurrentSessionData.mockResolvedValue(null);
      mockGetTransportData.mockResolvedValue({});

      const result = await TransportService.getTransportDetails("User 1", "storageNotes",'GB-34324-34234-234234', contactId);

      expect(result).toStrictEqual(expectedResult)
    });

  });

  describe("When the journey is not catchcertificate or storageNotes", () => {

    it("getTransportDetails will throw an error", async () => {
      await expect(TransportService.getTransportDetails("User 1", "test",undefined, contactId)).rejects.toThrow("Invalid arguments");
    });

    it("addTransport will throw an error", async () => {
      await expect(TransportService.addTransport({},undefined, contactId)).rejects.toThrow("Invalid arguments");
    });

  });

  describe("getTransportData", () => {

    let mockGetCCTransport;
    let mockGetSDTransport;

    beforeEach(() => {
      mockGetCCTransport = jest.spyOn(CatchCertService, 'getTransportDetails');
      mockGetSDTransport = jest.spyOn(StorageNotesService, 'getTransportDetails');

      mockGetCCTransport.mockResolvedValue(null);
      mockGetSDTransport.mockResolvedValue(null);
    });

    afterEach(() => {
      mockGetCCTransport.mockRestore();
      mockGetSDTransport.mockRestore();
    });

    it('should call CC service for CC journey with a document number', async () => {
      await TransportService.getTransportData('Bob', 'catchCertificate','GBR-23423423-234234-2344', contactId, false);

      expect(mockGetCCTransport).toHaveBeenCalledWith('Bob','GBR-23423423-234234-2344', contactId);
      expect(mockGetSDTransport).not.toHaveBeenCalled();
    });

    it('should call CC service for CC journey', async () => {
      await TransportService.getTransportData('Bob', 'storageNotes',undefined, contactId, false);

      expect(mockGetCCTransport).not.toHaveBeenCalled();
      expect(mockGetSDTransport).toHaveBeenCalledWith('Bob',undefined, contactId, false);
    });

    it('should throw an error for any other journey', async () => {
      await expect(TransportService.getTransportData('Bob', 'test',undefined, contactId, false)).rejects.toThrow("Invalid arguments");
    });

  });

  describe("removeTransportData", () => {
    let mockRemoveCCTransport;

    beforeEach(() => {
      mockRemoveCCTransport = jest.spyOn(CatchCertService, 'deleteTransportDetails');
      mockRemoveCCTransport.mockResolvedValue(null);
    });

    afterEach(() => {
      mockRemoveCCTransport.mockRestore();
    });

    it('should call CC service for CC journey with a document number', async () => {
      await TransportService.removeTransport('Bob','GBR-23423423-234234-2344', contactId);

      expect(mockRemoveCCTransport).toHaveBeenCalledWith('Bob','GBR-23423423-234234-2344', contactId);
    });

  });

});