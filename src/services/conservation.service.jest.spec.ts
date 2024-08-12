import { SessionStoreFactory } from "../session_store/factory";
import * as SessionStore from "../session_store/redis";
import * as CatchCertService from "../persistence/services/catchCert";
import conservationService from './conservation.service';
import { Conservation } from "../persistence/schema/frontEndModels/conservation";
import { MockSessionStorage } from "../../test/session_store/mock";
import * as SessionManager from "../helpers/sessionManager"

const sinon = require('sinon');

let sandbox;
const sessionStore = sinon.stub(SessionStore);
const sessionStoreFactory = sinon.stub(SessionStoreFactory, "getSessionStore");
sessionStoreFactory.returns(sessionStore);
const conservationSample = { someData: "some data" };
const contactId = 'contactBob';


let mockGetDraftData;
beforeAll(() => {
  sandbox = sinon.createSandbox();
  sessionStore.readAllFor = () => conservationSample;
  sessionStore.writeAllFor = () => conservationSample;
});

afterEach(() => {
  sandbox.restore();
});

describe('Get Conservation', () => {

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(CatchCertService, 'getConservation');
  });

  afterEach(() => {
    mockGetDraftData.mockRestore();
  });

  it('should return conservation data from draft data together ignoring session data', async () => {

    const payload = { user_id: "Bob", someData: "data"};

    const sessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData');

    sessionDataMock.mockResolvedValue(null);
    mockGetDraftData.mockReturnValue(conservationSample);

    const result = await conservationService.getConservation(payload, "GBR-34324-234234-234234", contactId);
    const expectedResult = { someData: "some data", user_id: "Bob"};

    expect(result).toStrictEqual(expectedResult);
  });

  it('should return conservation data from draft data together with its session data with document number', async () => {
    const sessionData : SessionManager.SessionStore = {
      documentNumber : "GBR-34324-234234-234234",
      currentUri: "test/test.html",
      nextUri: "testNext/testNext.html"
    };

    const payload = { user_id: "Bob", someData: "data"};

    const sessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData');

    sessionDataMock.mockResolvedValue(sessionData);
    mockGetDraftData.mockReturnValue(conservationSample);

    const result = await conservationService.getConservation(payload, "GBR-34324-234234-234234", contactId);
    const expectedResult = { someData: "some data", user_id: "Bob", currentUri: "test/test.html", nextUri: "testNext/testNext.html" };

    expect(result).toStrictEqual(expectedResult);
    expect(mockGetDraftData).toHaveBeenCalledWith("Bob", "GBR-34324-234234-234234", contactId);
  });

  it('will handle no conservations', async () => {
    const payload = { user_id: "Bob", someData: "data"};

    mockGetDraftData.mockReturnValue(null);

    const result = await conservationService.getConservation(payload, undefined, contactId);

    expect(result).toStrictEqual(null);
  });

});


describe('Upsert Conservation', () => {

  let mockUpsertDraftData;

  const mockSessionStore = new MockSessionStorage();
  const mockWriteAllFor = jest.fn();
  const mockReadAllFor = jest.fn();
  mockSessionStore.writeAllFor = mockWriteAllFor;
  mockSessionStore.readAllFor = mockReadAllFor;
  const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
  mockGetSessionStore.mockResolvedValue(mockSessionStore);

  beforeEach(() => {
    mockUpsertDraftData = jest.spyOn(CatchCertService, 'upsertConservation');
  });

  afterEach(() => {
    mockUpsertDraftData.mockRestore();
  });

  it('should upsert conservation data TO MONGO', async function () {
    const payload : Conservation = {
      legislation: [],
      caughtInUKWaters : 'Y',
      conservationReference: "",
      user_id: "Bob",
      currentUri: "Test",
      nextUri: "Test"
    };

    mockUpsertDraftData.mockReturnValue(conservationSample);
    mockReadAllFor.mockResolvedValue({});

    await conservationService.addConservation(payload, 'GBR-32', contactId);

    expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, 'GBR-32', contactId);
  });

  it('should return the same payload given when document number undefined', async function () {
    const payload : Conservation = {
      legislation: [],
      caughtInUKWaters : 'Y',
      conservationReference: "",
      user_id: "Bob",
      currentUri: "Test",
      nextUri: "Test"
    };

    mockUpsertDraftData.mockReturnValue(conservationSample);
    mockReadAllFor.mockResolvedValue({});

    expect(await conservationService.addConservation(payload, undefined, contactId)).toStrictEqual(payload);
    expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, undefined, contactId);
  });

  it('should save session data in REDIS', async function () {

    const payload : Conservation = {
      legislation: [],
      caughtInUKWaters : 'Y',
      conservationReference: "",
      user_id: "Bob",
      currentUri: "Test",
      nextUri: "Test"
    };

    mockUpsertDraftData.mockReturnValue(conservationSample);
    mockReadAllFor.mockResolvedValue({});

    await conservationService.addConservation(payload, 'GB-34324-34234-234234', contactId);

    expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
    expect(mockReadAllFor).toHaveBeenCalledTimes(1);
    expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, 'GB-34324-34234-234234', contactId);
  });

  it('should return the same payload given', async function () {
      const payload : Conservation = {
        legislation: [],
        caughtInUKWaters : 'Y',
        conservationReference: "",
        user_id: "Bob",
        currentUri: "Test",
        nextUri: "Test"
      };

      mockUpsertDraftData.mockReturnValue(conservationSample);
      mockReadAllFor.mockResolvedValue({});

      expect(await conservationService.addConservation(payload, "GB-34324-34234-234234", contactId)).toStrictEqual(payload);
      expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, "GB-34324-34234-234234", contactId);
    });

    it('should upsert conservation data to MONGO with document number', async function () {
      const payload : Conservation = {
        legislation: [],
        caughtInUKWaters : 'Y',
        conservationReference: "",
        user_id: "Bob",
        currentUri: "Test",
        nextUri: "Test"
      };

      mockUpsertDraftData.mockReturnValue(conservationSample);
      mockReadAllFor.mockResolvedValue({});

      await conservationService.addConservation(payload, "GBR-3444-4343-3433", contactId);

      expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, "GBR-3444-4343-3433", contactId);
     });

  it('should upsert conservation data TO MONGO with document number GB-34324-34234-234234', async function () {
      const payload : Conservation = {
        legislation: [],
        caughtInUKWaters : 'Y',
        conservationReference: "",
        user_id: "Bob",
        currentUri: "Test",
        nextUri: "Test"
      };

      mockUpsertDraftData.mockReturnValue(conservationSample);
      mockReadAllFor.mockResolvedValue({});

      await conservationService.addConservation(payload, 'GB-34324-34234-234234', contactId);

      expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, 'GB-34324-34234-234234', contactId);
    });

    it('should save session data in REDIS with document number GB-34324-34234-234234', async function () {
      const payload : Conservation = {
        legislation: [],
        caughtInUKWaters : 'Y',
        conservationReference: "",
        user_id: "Bob",
        currentUri: "Test",
        nextUri: "Test"
      };

      mockUpsertDraftData.mockReturnValue(conservationSample);
      mockReadAllFor.mockResolvedValue({});

      await conservationService.addConservation(payload, 'GB-34324-34234-234234', contactId);

      expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
      expect(mockReadAllFor).toHaveBeenCalledTimes(1);
      expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, "GB-34324-34234-234234", contactId);
    });

    it('should upsert conservation data to MONGO with document number GBR-3444-4343-3433', async function () {
      const payload : Conservation = {
        legislation: [],
        caughtInUKWaters : 'Y',
        conservationReference: "",
        user_id: "Bob",
        currentUri: "Test",
        nextUri: "Test"
      };

      mockUpsertDraftData.mockReturnValue(conservationSample);
      mockReadAllFor.mockResolvedValue({});

      await conservationService.addConservation(payload, "GBR-3444-4343-3433", contactId);

      expect(mockUpsertDraftData).toHaveBeenCalledWith("Bob", payload, "GBR-3444-4343-3433", contactId);
      });

});