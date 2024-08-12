import { MockSessionStorage } from "../../test/session_store/mock";
import { SessionStoreFactory } from '../session_store/factory';
import {
  withUserSessionDataStored,
  clearSessionDataForCurrentJourney,
  getCurrentSessionData,
  SessionData,
  SessionLanding,
  SessionStore
} from './sessionManager'
import { SESSION_DATA_KEY } from '../session_store/constants'
import { Landing, Vessel } from "../persistence/schema/frontEndModels/payload";


describe("The session manager", () => {
    const contactId = 'contactId';
    const mockSessionStore = new MockSessionStorage();
    const mockWriteAllFor = jest.fn();
    const mockReadAllFor = jest.fn();
    mockSessionStore.writeAllFor = mockWriteAllFor;
    mockSessionStore.readAllFor = mockReadAllFor;

    beforeAll(() => {
        const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
        mockGetSessionStore.mockResolvedValue(mockSessionStore);
    });

    beforeEach(() => {
        mockReadAllFor.mockReset();
        mockWriteAllFor.mockReset();
    });

    describe("when a user id and document number are present", () => {
        it("will save session data when there is no existing session data", async () => {
            const payload : SessionData = {
                currentUri: "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test"
            }

            mockReadAllFor.mockResolvedValue({});
            mockWriteAllFor.mockReturnValue({});

            const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
            const expected  = {
                currentUri : "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test"
            }

            expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,[expected]);
            expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            expect(result).toBe(true)
        });

        it("will save session data when sessionData has not been initialised yet", async () => {
            const payload : SessionData = {
                currentUri: "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test"
            }

            mockReadAllFor.mockRejectedValue("ERROR");
            mockWriteAllFor.mockReturnValue({});

            const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
            const expected  = {
                currentUri : "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test"
            }

            expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,[expected]);
            expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            expect(result).toBe(true)
        });

        it("will save session data when there is session data but not for current document", async () => {
            const payload : SessionData = {
                currentUri: "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test2"
            }

            mockReadAllFor.mockResolvedValue([{
                currentUri : "test.html",
                nextUri: "test.html",
                documentNumber: "test"
            },{
                currentUri : "test1.html",
                nextUri: "test1.html",
                documentNumber: "test1"
            }]);
            mockWriteAllFor.mockReturnValue({});

            const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
            const expected = [{
                currentUri : "test.html",
                nextUri: "test.html",
                documentNumber: "test"
            },{
                currentUri : "test1.html",
                nextUri: "test1.html",
                documentNumber: "test1"
            },{
                currentUri : "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test2"
            }]

            expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,expected);
            expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            expect(result).toBe(true)
        });

        describe("and dealing with landing related session data", () => {
            const vessel : Vessel  = {
                pln : "test",
                vesselName : "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
            }

            const landing : Landing = {
                id: "landing_id_test",
                numberOfSubmissions: 0,
                vessel: vessel,
                dateLanded: "01/01/2010",
                exportWeight: 5,
                faoArea: "TEST"
            }

            const sessionLanding : SessionLanding = {
                landingId : "landing_id_test",
                addMode: true,
                editMode:false,
                error: "missing PLN",
                modelCopy : landing,
                model: landing,
            }

            it("will save the landing", async () => {
                const payload : SessionData = {
                    documentNumber: "test",
                    landing : sessionLanding
                }

                mockReadAllFor.mockResolvedValue({});
                mockWriteAllFor.mockReturnValue({});

                const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
                const expected : SessionStore  = {
                    documentNumber: "test",
                    landings : [sessionLanding]
                }

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,[expected]);
                expect(result).toBe(true)
            });

            it("will update the correct landing when there is multiple landings", async () => {
                const sessionLanding2 : SessionLanding = {
                    landingId : "landing_id_test2",
                    addMode: true,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const newSessionLanding : SessionLanding = {
                    landingId : "landing_id_test3",
                    addMode: false,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const payload : SessionData = {
                    documentNumber: "newSessionData",
                    landing : newSessionLanding
                }

                mockReadAllFor.mockResolvedValue([{
                    documentNumber: "sessionData1",
                    landings : [sessionLanding,sessionLanding2]
                }]);

                mockWriteAllFor.mockReturnValue({});

                const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
                const expected : SessionStore[]  = [
                    {
                        documentNumber: "sessionData1",
                        landings : [sessionLanding,sessionLanding2]
                    },{
                        documentNumber: "newSessionData",
                        landings : [newSessionLanding]
                    }]

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,expected);
                expect(result).toBe(true)
            });

          it("will be case insensitive", async () => {
            const sessionLanding2 : SessionLanding = {
              landingId : "landing_id_test2",
              addMode: true,
              editMode:false,
              error: "missing PLN",
              modelCopy : landing,
              model: landing
            }

            const newSessionLanding : SessionLanding = {
              landingId : "landing_id_test3",
              addMode: false,
              editMode:false,
              error: "missing PLN",
              modelCopy : landing,
              model: landing
            }

            const payload : SessionData = {
              documentNumber: "NEWSESSIONDATA",
              landing : newSessionLanding
            }

            mockReadAllFor.mockResolvedValue([{
              documentNumber: "sessionData1",
              landings : [sessionLanding,sessionLanding2]
            }]);

            mockWriteAllFor.mockReturnValue({});

            const result = await withUserSessionDataStored("Bob",payload,contactId, () => true);
            const expected : SessionStore[]  = [
              {
                documentNumber: "sessionData1",
                landings : [sessionLanding,sessionLanding2]
              },{
                documentNumber: "NEWSESSIONDATA",
                landings : [newSessionLanding]
              }]

            expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,expected);
            expect(result).toBe(true)
          });

            it("will add new landing to a session with multiple draft documents", async () => {
                const sessionLanding1 : SessionLanding = {
                    landingId : "landing1",
                    addMode: true,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const sessionLanding2 : SessionLanding = {
                    landingId : "landing2",
                    addMode: true,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const newSessionLanding : SessionLanding = {
                    landingId : "landing1",
                    addMode: false,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const payload : SessionData = {
                    documentNumber: "test",
                    landing : newSessionLanding
                }

                mockReadAllFor.mockResolvedValue([{
                    documentNumber: "test",
                    landings : [sessionLanding1,sessionLanding2]
                }]);

                mockWriteAllFor.mockReturnValue({});

                const result = await withUserSessionDataStored("Bob",payload,contactId,() => true);
                const expected : SessionStore  = {
                    documentNumber: "test",
                    landings : [newSessionLanding, sessionLanding2]
                }

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,[expected]);
                expect(result).toBe(true)
            });

            it("will create landing array if there is no landings at all", async () => {
                const newSessionLanding : SessionLanding = {
                    landingId : "landing_id_test3",
                    addMode: false,
                    editMode:false,
                    error: "missing PLN",
                    modelCopy : landing,
                    model: landing
                }

                const payload : SessionData = {
                    documentNumber: "sessionData1",
                    landing : newSessionLanding
                }

                mockReadAllFor.mockResolvedValue([{
                    documentNumber: "sessionData1"
                }]);

                mockWriteAllFor.mockReturnValue({});

                await withUserSessionDataStored("Bob",payload,contactId,() => true);
                const expected : SessionStore[]  = [{
                        documentNumber: "sessionData1",
                        landings : [newSessionLanding]
                    }]

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,expected);
            });
        });

        describe("when updating existing data", () => {
            it("will override only the properties that are in the payload", async () => {
                const payload : SessionData = {
                    currentUri: "test/test.html",
                    nextUri: "test/test.html",
                    documentNumber: "test"
                }

                mockReadAllFor.mockResolvedValue([{
                    currentUri : "test",
                    nextUri: "test",
                    age: 15,
                    documentNumber: "test"
                },{
                    currentUri : "test2",
                    nextUri: "test2",
                    age: 15,
                    documentNumber: "test2"
                }]);
                mockWriteAllFor.mockReturnValue({});

                const result = await withUserSessionDataStored("Bob",payload,contactId,() => true);
                const expected = [{
                    currentUri : "test/test.html",
                    nextUri: "test/test.html",
                    age: 15,
                    documentNumber: "test"
                },
                {
                    currentUri : "test2",
                    nextUri: "test2",
                    age: 15,
                    documentNumber: "test2"
                }]

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", "contactId",SESSION_DATA_KEY,expected);
                expect(mockReadAllFor).toHaveBeenCalledTimes(1);
                expect(result).toBe(true)
            });
        });
    });

    describe("when the required data for session is not present", () => {
        it("will not save anything but attempt to continue with journey with no user id",async () => {
            const payload : SessionData = {
                currentUri: "test/test.html",
                nextUri: "test/test.html",
                documentNumber: "test"
            }

            const result = await withUserSessionDataStored("",payload,"",() => true);

            expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
            expect(mockReadAllFor).toHaveBeenCalledTimes(0);
            expect(result).toBe(true)
        });

        it("will not save anything but attempt to continue with journey with no document number",async () => {
            const payload : SessionData = {
                currentUri: "test/test.html",
                nextUri: "test/test.html",
                documentNumber: ""
            }

            const result = await withUserSessionDataStored("Bob",payload,contactId,() => true);

            expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
            expect(mockReadAllFor).toHaveBeenCalledTimes(0);
            expect(result).toBe(true)
        });
    });

    describe("when session data is not required anymore and we need to clear the session", () => {
        describe("and we have userId and document number", () => {
            it("will be able to clear session data for a given document number", async () => {
                mockReadAllFor.mockResolvedValue([{
                    currentUri : "test",
                    nextUri: "test",
                    documentNumber: "test"
                },{
                    currentUri : "test2",
                    nextUri: "test2",
                    documentNumber: "test2"
                }]);
                mockWriteAllFor.mockReturnValue({});

                await clearSessionDataForCurrentJourney("Bob","test", contactId);

                const expected : SessionData[] = [{
                    currentUri : "test2",
                    nextUri: "test2",
                    documentNumber: "test2"
                }]

                expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", 'contactId', SESSION_DATA_KEY,expected);
                expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            });

            it("will be case insensitive", async () => {
              mockReadAllFor.mockResolvedValue([{
                currentUri : "test",
                nextUri: "test",
                documentNumber: "test"
              },{
                currentUri : "test2",
                nextUri: "test2",
                documentNumber: "test2"
              }]);
              mockWriteAllFor.mockReturnValue({});

              await clearSessionDataForCurrentJourney("Bob","TEST", contactId);

              const expected : SessionData[] = [{
                currentUri : "test2",
                nextUri: "test2",
                documentNumber: "test2"
              }]

              expect(mockWriteAllFor).toHaveBeenCalledWith("Bob", 'contactId',SESSION_DATA_KEY,expected);
              expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            });

            it("will not attempt to clear anything if the document is not found", async () => {
                mockReadAllFor.mockResolvedValue([{
                    currentUri : "test",
                    nextUri: "test",
                    documentNumber: "test"
                },{
                    currentUri : "test2",
                    nextUri: "test2",
                    documentNumber: "test2"
                }]);
                mockWriteAllFor.mockReturnValue({});

                await clearSessionDataForCurrentJourney("Bob","test0", contactId);

                expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
                expect(mockReadAllFor).toHaveBeenCalledTimes(1);
            });
        });

        describe("and we don't have the required data", () => {
            it("will not attempt to delete if there is no userid", async () => {
                await clearSessionDataForCurrentJourney("","test", '');

                expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
                expect(mockReadAllFor).toHaveBeenCalledTimes(0);
            });

            it("will not attempt to delete if there is no documentNumber", async () => {
                await clearSessionDataForCurrentJourney("Bob","", contactId);

                expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
                expect(mockReadAllFor).toHaveBeenCalledTimes(0);
            });
        });

        describe("and something goes wrong", () => {
          it("will return undefined", async() => {
            mockReadAllFor.mockRejectedValue("Error");
            mockWriteAllFor.mockReturnValue({});

            const result = await clearSessionDataForCurrentJourney("Bob","test0", contactId);

            expect(result).toBe(undefined);
          });
        });
    });

    describe("when retrieving session data", () => {
        describe("and we have all required data", () => {
            it("will retrieve current session data when record exist", async () => {
                mockReadAllFor.mockResolvedValue([{
                    currentUri : "test",
                    nextUri: "test",
                    documentNumber: "test"
                },{
                    currentUri : "test2",
                    nextUri: "test2",
                    documentNumber: "test2"
                }]);

                const result = await getCurrentSessionData("Bob","test", contactId);

                const expected : SessionData = {
                    currentUri : "test",
                    nextUri: "test",
                    documentNumber: "test"
                }

                expect(mockReadAllFor).toHaveBeenCalledTimes(1);
                expect(result).toStrictEqual(expected)
            });

            it("will be case insensitive", async () => {
              mockReadAllFor.mockResolvedValue([{
                currentUri : "test",
                nextUri: "test",
                documentNumber: "test"
              },{
                currentUri : "test2",
                nextUri: "test2",
                documentNumber: "test2"
              }]);

              const result = await getCurrentSessionData("Bob","TEST", contactId);

              const expected : SessionData = {
                currentUri : "test",
                nextUri: "test",
                documentNumber: "test"
              };

              expect(mockReadAllFor).toHaveBeenCalledTimes(1);
              expect(result).toStrictEqual(expected)
            });

            it("will return undefined if nothing is found", async () => {
                mockReadAllFor.mockResolvedValue([{
                    currentUri : "test",
                    nextUri: "test",
                    documentNumber: "test"
                },{
                    currentUri : "test2",
                    nextUri: "test2",
                    documentNumber: "test2"
                }]);

                const result = await getCurrentSessionData("Bob","test3", contactId);

                expect(result).toStrictEqual(undefined)
            });
        });

        describe("and we don't have the required data", () => {
            it("will not try to retrieve data if there is no userid", async () => {
                const result = await getCurrentSessionData("","test", "");

                expect(mockReadAllFor).toHaveBeenCalledTimes(0);
                expect(result).toBe(undefined);
            });

            it("will not try to retrieve data if there is no document number", async () => {
                const result = await getCurrentSessionData("Bob","", contactId);

                expect(mockReadAllFor).toHaveBeenCalledTimes(0);
                expect(result).toBe(undefined);
            });
        });

        describe("and there is no session data", () => {
            it("will return undefined", async () => {
                mockReadAllFor.mockResolvedValue(null);

                const result = await getCurrentSessionData("Bob","test", contactId);

                expect(result).toEqual(undefined)
            });
        });
        describe("and something goes wrong", () => {
          it("will return undefined", async () => {
            mockReadAllFor.mockRejectedValue("Error");

            const result = await getCurrentSessionData("Bob","test", contactId);

            expect(result).toEqual(undefined)
          });
        })
    });
});
