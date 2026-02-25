import * as Hapi from "@hapi/hapi";
import DocumentController from "./document.controller";
import Logger from '../logger';
import * as DraftValidator from "../validators/draftCreationValidator"
import * as CatchCertService from "../persistence/services/catchCert"
import * as StorageDocService from "../persistence/services/storageDoc"
import * as ProcessingStatementService from "../persistence/services/processingStatement"
import * as ReferenceDataService from "../services/reference-data.service"
import DocumentNumberService, { catchCerts, processingStatement, storageNote } from '../services/documentNumber.service'
import { DOCUMENT_NUMBER_KEY } from "../session_store/constants";

const h = {
  response: () => {
    function code(httpCode) {
      return httpCode;
    }

    return { code: code }
  },
  redirect: () => {
  }
} as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

const error = 'error';
const unauthorised = 'unauthorised';

describe("Document controller", () => {
  describe("When creating a new draft", () => {
    describe("And the journey is CC", () => {
      let draftValidator;
      let mockCreateDraft;
      let mockRedirect;
      let mockResponse;
      let mockReportDraftCreated;
      let mockLoggerInfo;
      let mockLoggerError;

      beforeEach(() => {
        draftValidator = jest.spyOn(DraftValidator,'userCanCreateDraft');
        mockCreateDraft = jest.spyOn(CatchCertService,'createDraft');
        mockRedirect = jest.spyOn(h, 'redirect');
        mockResponse = jest.spyOn(h, 'response');
        mockReportDraftCreated = jest.spyOn(ReferenceDataService, 'reportDraftCreated');
        mockLoggerInfo = jest.spyOn(Logger, 'info');
        mockLoggerError = jest.spyOn(Logger, 'error');
      });

      afterEach(() => {
        draftValidator.mockRestore();
        mockCreateDraft.mockRestore();
        mockRedirect.mockRestore();
        mockResponse.mockRestore();
        mockReportDraftCreated.mockRestore();
        mockLoggerInfo.mockRestore();
        mockLoggerError.mockRestore();
      });

      describe("It will fulfill the request successfully", () => {
        it("When the draft validator says it is OK to proceed", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", contactId: 'contactId', roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, request.app.claims.contactId);
          expect(mockReportDraftCreated).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${testDocumentNumber}/test`);
        });

        it("When the draft created by FES-API for CC", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com", fesApi: true}},
            params : {documentType: "catchCertificate"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        it("When the draft created by MMO-FE-CC-V2 for CC", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"},
            payload : {
              mmov2: true
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        describe("When the request is from an admin", () => {
          it("will send requestByAdmin as true for an MMO-ECC-Service-Management", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", contactId: 'contactBob', roles: ["MMO-ECC-Service-Management"], email: "test@test.com"}},
              params : {documentType: "catchCertificate"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });

          it("will send requestByAdmin as true for an MMO-ECC-Support-User", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", contactId: 'contactBob', roles: ["MMO-ECC-Support-User"], email: "test@test.com"}},
              params : {documentType: "catchCertificate"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });


          it("will send requestByAdmin as false if roles is not defined", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", contactId: 'contactBob', email: "test@test.com"}},
              params : {documentType: "catchCertificate"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][false]');
          });
        });

        it('will create a draft and fail gracefully if the report draft API call errors', async () => {
          const testDocumentNumber = "34734428328423752384238423";

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockRejectedValue(new Error('error'));

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockReportDraftCreated).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${testDocumentNumber}/test`);
          expect(mockLoggerError).toHaveBeenCalledWith(`[REPORT-CC-DOCUMENT-DRAFT][${testDocumentNumber}][ERROR][Error: error]`);
        });
      });

      describe("It will fail the request", () => {
        it("When the draft validator says it is NOT OK to proceed", async () => {
          draftValidator.mockResolvedValue(false);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"}
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(unauthorised);
        });

        it("When something goes wrong when checking if user can create draft", async () => {
          draftValidator.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"}
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });

        it("When something goes wrong when creating the draft", async () => {
          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "catchCertificate"}
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });
      });
    });

    describe("And the journey is SD", () => {
      let draftValidator;
      let mockCreateDraft;
      let mockRedirect;
      let mockResponse;
      let mockReportDraftCreated;
      let mockLoggerInfo;
      let mockLoggerError;

      beforeEach(() => {
        draftValidator = jest.spyOn(DraftValidator, 'userCanCreateDraft');
        mockCreateDraft = jest.spyOn(StorageDocService, 'createDraft');
        mockRedirect = jest.spyOn(h, 'redirect');
        mockResponse = jest.spyOn(h, 'response');
        mockLoggerInfo = jest.spyOn(Logger, 'info');
        mockLoggerError = jest.spyOn(Logger, 'error');
        mockReportDraftCreated = jest.spyOn(ReferenceDataService, 'reportDraftCreated');
      });

      afterEach(() => {
        draftValidator.mockRestore();
        mockCreateDraft.mockRestore();
        mockRedirect.mockRestore();
        mockResponse.mockRestore();
        mockReportDraftCreated.mockRestore();
        mockLoggerError.mockRestore();
      });

      describe("It will fulfill the request successfully", () => {

        it("When the draft created by FES-API for SD", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com", fesApi: true}},
            params : {documentType: "storageDocument"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        it("When the draft validator says it is OK to proceed", async () => {
          const documentNumber = 'GBR-342432-234234-234234'
          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(documentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageDocument"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, undefined);
          expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][false]');
          expect(mockReportDraftCreated).toHaveBeenCalledWith(documentNumber);
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${documentNumber}/test`);
        });

        it("When the draft created by MMO-FE-CC-V2 for SD", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request : any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageNotes"},
            payload : {
              mmov2: true
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        describe("When the request is from an admin", () => {
          it("will send requestByAdmin as true for an MMO-ECC-Service-Management", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", roles: ["MMO-ECC-Service-Management"], email: "test@test.com"}},
              params : {documentType: "storageDocument"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, undefined);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });

          it("will send requestByAdmin as true for an MMO-ECC-Support-User", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", roles: ["MMO-ECC-Support-User"], email: "test@test.com"}},
              params : {documentType: "storageDocument"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, undefined);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });

          it("will send requestByAdmin as false if roles is not defined", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", email: "test@test.com"}},
              params : {documentType: "storageDocument"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, undefined);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][false]');
          });

        });

        it('will create a draft and fail gracefully if the report draft API call errors', async () => {
          const testDocumentNumber = "34734428328423752384238423";

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockRejectedValue(new Error('error'));

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageDocument"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockReportDraftCreated).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${testDocumentNumber}/test`);
          expect(mockLoggerError).toHaveBeenCalledWith(`[REPORT-SD-DOCUMENT-DRAFT][${testDocumentNumber}][ERROR][Error: error]`);
        });
      });

      describe("It will fail the request", () => {
        it("When the draft validator says it is NOT OK to proceed", async () => {
          draftValidator.mockResolvedValue(false);


          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageDocument"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(unauthorised);
        });

        it("When something goes wrong when checking if user can create draft", async () => {
          draftValidator.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageDocument"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });

        it("When something goes wrong when creating the draft", async () => {
          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "storageDocument"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });
      });
    });

    describe("And the journey is PS", () => {
      let draftValidator;
      let mockCreateDraft;
      let mockRedirect;
      let mockResponse;
      let mockReportDraftCreated;
      let mockLoggerInfo;
      let mockLoggerError;

      beforeEach(() => {
        draftValidator = jest.spyOn(DraftValidator, 'userCanCreateDraft');
        mockCreateDraft = jest.spyOn(ProcessingStatementService, 'createDraft');
        mockRedirect = jest.spyOn(h, 'redirect');
        mockResponse = jest.spyOn(h, 'response');
        mockLoggerInfo = jest.spyOn(Logger, 'info');
        mockLoggerError = jest.spyOn(Logger, 'error');
        mockReportDraftCreated = jest.spyOn(ReferenceDataService, 'reportDraftCreated');
      });

      afterEach(() => {
        draftValidator.mockRestore();
        mockCreateDraft.mockRestore();
        mockRedirect.mockRestore();
        mockResponse.mockRestore();
        mockLoggerInfo.mockRestore();
        mockReportDraftCreated.mockRestore();
      });

      describe("It will fulfill the request successfully", () => {

        it("When the draft created by FES-API for PS", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com", fesApi: true}},
            params : {documentType: "processingStatement"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        it("When the draft created by MMO-FE-CC-V2 for PS", async () => {
          const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "processingStatement"},
            payload : {
              mmov2: true
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockResponse).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledTimes(0);
        });

        it("When the draft validator says it is OK to proceed", async () => {
          const documentNumber = 'GBR-342432-234234-234234'
          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(documentNumber);
          mockReportDraftCreated.mockResolvedValue(null);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com", contactId: 'contactBob'}},
            params : {documentType: "processingStatement"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request,h);

          expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, request.app.claims.contactId);
          expect(mockReportDraftCreated).toHaveBeenCalledWith(documentNumber);
          expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][false]');
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${documentNumber}/test`);
        });

        describe("When the request is from an admin", () => {
          it("will send requestByAdmin as true for an MMO-ECC-Service-Management", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", roles: ["MMO-ECC-Service-Management"], email: "test@test.com", contactId: 'contactBob'}},
              params : {documentType: "processingStatement"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });

          it("will send requestByAdmin as true for an MMO-ECC-Support-User", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", roles: ["MMO-ECC-Support-User"], email: "test@test.com", contactId: 'contactBob'}},
              params : {documentType: "processingStatement"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, true, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][true]');
          });

          it("will send requestByAdmin as false if roles is not defined", async () => {
            const testDocumentNumber = 'jdkjsdoifjsdoifjiosdf';

            draftValidator.mockResolvedValue(true);
            mockCreateDraft.mockResolvedValue(testDocumentNumber);
            mockReportDraftCreated.mockResolvedValue(null);

            const request: any = {
              app : {claims: {sub: "test", email: "test@test.com", contactId: 'contactBob'}},
              params : {documentType: "processingStatement"},
              payload : {
                nextUri: '/test-url/{documentNumber}/test'
              }
            };

            await DocumentController.createDraft(request, h);

            expect(mockCreateDraft).toHaveBeenCalledWith(request.app.claims.sub, request.app.claims.email, false, request.app.claims.contactId);
            expect(mockLoggerInfo).toHaveBeenCalledWith('[ORCHESTRATOR][REQUEST-BY-EACC-ADMIN][false]');
          });
        });

        it('will create a draft and fail gracefully if the report draft API call errors', async () => {
          const testDocumentNumber = "34734428328423752384238423";

          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockResolvedValue(testDocumentNumber);
          mockReportDraftCreated.mockRejectedValue(new Error('error'));

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "processingStatement"},
            payload : {
              nextUri: '/test-url/{documentNumber}/test'
            }
          };

          await DocumentController.createDraft(request, h);

          expect(mockReportDraftCreated).toHaveBeenCalledWith(testDocumentNumber);
          expect(mockRedirect).toHaveBeenCalledWith(`/test-url/${testDocumentNumber}/test`);
          expect(mockLoggerError).toHaveBeenCalledWith(`[REPORT-PS-DOCUMENT-DRAFT][${testDocumentNumber}][ERROR][Error: error]`);
        });
      });

      describe("It will fail the request", () => {
        it("When the draft validator says it is NOT OK to proceed", async () => {
          draftValidator.mockResolvedValue(false);

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "processingStatement"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(unauthorised);
        });

        it("When something goes wrong when checking if user can create draft", async () => {
          draftValidator.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "processingStatement"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });

        it("When something goes wrong when creating the draft", async () => {
          draftValidator.mockResolvedValue(true);
          mockCreateDraft.mockRejectedValue("Error");

          const request: any = {
            app : {claims: {sub: "test", roles: ["test"], email: "test@test.com"}},
            params : {documentType: "processingStatement"}
          };

          await DocumentController.createDraft(request,h);

          expect(mockResponse).toHaveBeenCalledWith(error);
        });
      });
    });
  });

  describe('getCompletedDocument', () => {

    let mockReq;
    let mockH;
    let mockGetDocument;

    beforeEach(() => {
      mockReq = {
        app: { claims: { sub: 'Bob' } },
        params: { documentNumber: 'docNum' }
      };

      mockH = {
        response: jest.fn().mockReturnValue({
          code: jest.fn().mockImplementation(code => code)
        })
      };

      mockGetDocument = jest.spyOn(DocumentNumberService, 'getDocument');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return document data if it is returned', async () => {
      const document = {test: test};

      mockGetDocument.mockResolvedValue(document);

      await DocumentController.getDocument(mockReq, mockH);

      expect(mockH.response).toHaveBeenCalledWith(document);
    });

    it('should return 404 if no data is returned', async () => {
      mockGetDocument.mockResolvedValue(null);

      const result = await DocumentController.getDocument(mockReq, mockH);

      expect(result).toBe(404);
    });

  });

  describe('getDocumentFromRedis', () => {
    let mockReq;
    let mockGetDraftDocuments;

    beforeEach(() => {
      mockReq = {
        app: { claims: { sub: 'Bob', contactId: 'contactBob' } },
        params: { documentNumber: 'docNum' },
        query: { service: 'service' }
      };

      mockGetDraftDocuments = jest.spyOn(DocumentNumberService, 'getDraftDocuments');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return document data if it is returned', async () => {
      // Arrange
      const document = { test: 'test' };
      const docKey = mockReq.query.service + '/' + DOCUMENT_NUMBER_KEY;
      mockGetDraftDocuments.mockResolvedValue(document);

      // Act
      const result = await DocumentController.getDocumentFromRedis(mockReq);

      // Assert
      expect(result).toEqual(document);
      expect(mockGetDraftDocuments).toHaveBeenCalledWith(mockReq.app.claims.sub, docKey, mockReq.app.claims.contactId);
    });


  });

  describe('getAllDocuments', () => {
    let mockReq;
    let mockGetDraftCatchCertHeadersForUser: jest.SpyInstance;
    let mockGetAllCatchCertsForUserByYearAndMonth: jest.SpyInstance;
    let mockGetDraftProcessingStatementsForUser: jest.SpyInstance;
    let mockGetAllProcessingStatementsForUserByYearAndMonth: jest.SpyInstance;
    let mockGetDraftStorageDocumentsForUser: jest.SpyInstance;
    let mockGetAllStorageDocsForUserByYearAndMonth: jest.SpyInstance;

    const inProgressCC = { cc: "in progress" };
    const completedCC = { cc: "completed" };
    const inProgressPS = { ps: "in progress" };
    const completedPS = { ps: "completed" };
    const inProgressSD = { sd: "in progress" };
    const completedSD = { sd: "completed" };

    beforeAll(() => {
      mockReq = {
        app: { claims: { sub: "Bob", contactId: 'contactBob' } },
        params: { month: "Jan", year: "2020" },
        query: { type: "" },
      };

      mockGetDraftCatchCertHeadersForUser = jest.spyOn(CatchCertService, 'getDraftCatchCertHeadersForUser');
      mockGetDraftCatchCertHeadersForUser.mockReturnValue(inProgressCC);
      mockGetAllCatchCertsForUserByYearAndMonth = jest.spyOn(CatchCertService, 'getAllCatchCertsForUserByYearAndMonth');
      mockGetAllCatchCertsForUserByYearAndMonth.mockReturnValue(completedCC);

      mockGetDraftProcessingStatementsForUser = jest.spyOn(ProcessingStatementService, 'getDraftDocumentHeaders');
      mockGetDraftProcessingStatementsForUser.mockReturnValue(inProgressPS);
      mockGetAllProcessingStatementsForUserByYearAndMonth = jest.spyOn(ProcessingStatementService, 'getAllProcessingStatementsForUserByYearAndMonth');
      mockGetAllProcessingStatementsForUserByYearAndMonth.mockReturnValue(completedPS);

      mockGetDraftStorageDocumentsForUser = jest.spyOn(StorageDocService, 'getDraftDocumentHeaders');
      mockGetDraftStorageDocumentsForUser.mockReturnValue(inProgressSD);
      mockGetAllStorageDocsForUserByYearAndMonth = jest.spyOn(StorageDocService, 'getAllStorageDocsForUserByYearAndMonth');
      mockGetAllStorageDocsForUserByYearAndMonth.mockReturnValue(completedSD);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('case default', async () => {
      // Arrange
      mockReq.query.type = '';

      // Act
      const response = await DocumentController.getAllDocuments(mockReq);

      // Assert
      expect(response).toEqual({
        completed: [],
        inProgress: [],
      });
    });

    it('case catchCerts', async () => {
      // Arrange
      mockReq.query.type = catchCerts;

      // Act
      const response = await DocumentController.getAllDocuments(mockReq);

      // Assert
      expect(response).toEqual({
        completed: { ...completedCC },
        inProgress: { ...inProgressCC },
      });
      expect(mockGetDraftCatchCertHeadersForUser).toHaveBeenCalledWith(mockReq.app.claims.sub, mockReq.app.claims.contactId);
      expect(mockGetAllCatchCertsForUserByYearAndMonth).toHaveBeenCalledWith(
        `${mockReq.params.month}-${mockReq.params.year}`,
        mockReq.app.claims.sub,
        mockReq.app.claims.contactId
      );
    });

    it('case catchCerts executes inProgress and completed lookups concurrently', async () => {
      // Arrange
      mockReq.query.type = catchCerts;
      let resolveInProgress;
      let completedLookupCalled = false;

      const inProgressPromise = new Promise(resolve => {
        resolveInProgress = resolve;
      });

      mockGetDraftCatchCertHeadersForUser.mockReturnValue(inProgressPromise);
      mockGetAllCatchCertsForUserByYearAndMonth.mockImplementation(() => {
        completedLookupCalled = true;
        return Promise.resolve(completedCC);
      });

      // Act
      const responsePromise = DocumentController.getAllDocuments(mockReq);
      await Promise.resolve();

      // Assert
      expect(completedLookupCalled).toBeTruthy();

      resolveInProgress(inProgressCC);
      const response = await responsePromise;
      expect(response).toEqual({
        completed: { ...completedCC },
        inProgress: { ...inProgressCC },
      });
    });

    it('case processingStatement', async () => {
      // Arrange
      mockReq.query.type = processingStatement;

      // Act
      const response = await DocumentController.getAllDocuments(mockReq);

      // Assert
      expect(response).toEqual({
        completed: { ...completedPS },
        inProgress: { ...inProgressPS },
      });
      expect(mockGetDraftProcessingStatementsForUser).toHaveBeenCalledWith(mockReq.app.claims.sub, mockReq.app.claims.contactId);
      expect(mockGetAllProcessingStatementsForUserByYearAndMonth).toHaveBeenCalledWith(
        `${mockReq.params.month}-${mockReq.params.year}`,
        mockReq.app.claims.sub,
        mockReq.app.claims.contactId
      );
    });

    it('case storageNote', async () => {
      // Arrange
      mockReq.query.type = storageNote;

      // Act
      const response = await DocumentController.getAllDocuments(mockReq);

      // Assert
      expect(response).toEqual({
        completed: { ...completedSD },
        inProgress: { ...inProgressSD },
      });
      expect(mockGetDraftStorageDocumentsForUser).toHaveBeenCalledWith(mockReq.app.claims.sub, 'contactBob');
      expect(mockGetAllStorageDocsForUserByYearAndMonth).toHaveBeenCalledWith(
        `${mockReq.params.month}-${mockReq.params.year}`,
        mockReq.app.claims.sub,
        'contactBob'
      );
    });

    it("when exception thrown", async () => {
      // Arrange
      const error = new Error("error message");
      mockReq.query.type = catchCerts;
      mockGetDraftCatchCertHeadersForUser = jest.spyOn(
        CatchCertService,
        "getDraftCatchCertHeadersForUser"
      );
      mockGetDraftCatchCertHeadersForUser.mockImplementation(() => {
        throw error;
      });
      const mockLogger = jest.spyOn(Logger, "error");
      mockLogger.mockReturnValue(null);

      // Act
      const response = await DocumentController.getAllDocuments(mockReq);

      // Assert
      expect(response).toEqual({
        completed: [],
        inProgress: [],
      });
      expect(mockLogger).toHaveBeenCalledWith(error);
    });

  });

  describe('getDocumentPdf', () => {

    let mockGetDocument;

    beforeEach(() => {
      mockGetDocument = jest.spyOn(DocumentNumberService, 'getDocument');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return document data if it is returned', async () => {
      const document = {
        documentNumber: 'DOCUMENT123',
        documentUri: 'some-document-uri',
        documentStatus: 'COMPLETE'
      };

      mockGetDocument.mockResolvedValue(document);

      const result = await DocumentController.getDocumentPdf('DOCUMENT123', 'Bob', 'contactBob');

      expect(result).toEqual({
        documentNumber: 'DOCUMENT123',
        status: "COMPLETE",
        uri: "some-document-uri",
      });
    });

    it('should return 404 if no data is returned', async () => {
      mockGetDocument.mockResolvedValue(null);

      const result = await DocumentController.getDocumentPdf('DOCUMENT123', 'Bob', undefined);

      expect(result).toBeNull();
    });
  });

  describe('getCompletedDocuments', () => {
    let mockCountDocuments;
    let mockGetCompletedDocuments;

    beforeEach(() => {
      mockCountDocuments = jest.spyOn(DocumentNumberService, 'countDocuments');
      mockGetCompletedDocuments = jest.spyOn(DocumentNumberService, 'getCompletedDocuments');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return completed documents', async () => {
      const mockReq: any = {
        app: { claims: { sub: 'Bob', contactId: 'contactBob' } },
        params: { documentType: 'catchCertificate' },
        query: { },
      };

      const mockedDocuments = [
        {
          documentNumber: 'GBR-2021-CC-469123515',
          status: 'COMPLETE',
          documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
          createdAt: '2021-10-11T15:01:18.000Z',
          userReference: '',
        },
      ];

      mockCountDocuments.mockResolvedValue(1);
      mockGetCompletedDocuments.mockResolvedValue(mockedDocuments);

      const result = await DocumentController.getAllCompletedDocuments(mockReq);

      const expectedResult = {
        pageNumber: 1,
        pageLimit: 50,
        totalPages: 1,
        totalRecords: 1,
        data: [
          {
            documentNumber: 'GBR-2021-CC-469123515',
            status: 'COMPLETE',
            documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
            createdAt: '2021-10-11T15:01:18.000Z',
            userReference: '',
          },
        ],
      };

      expect(result).toEqual(expectedResult);
    });

    it('should return compledted documents when pageNumber and limit are provided', async () => {
      const mockReq: any = {
        app: { claims: { sub: 'Bob', contactId: 'contactBob' } },
        params: { documentType: 'catchCertificate' },
        query: { pageNumber: 1, pageLimit: 1 },
      };

      const mockedDocuments = [
        {
          documentNumber: 'GBR-2021-CC-469123515',
          status: 'COMPLETE',
          documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
          createdAt: '2021-10-11T15:01:18.000Z',
          userReference: '',
        },
      ];

      mockCountDocuments.mockResolvedValue(1);
      mockGetCompletedDocuments.mockResolvedValue(mockedDocuments);

      const result = await DocumentController.getAllCompletedDocuments(mockReq);

      const expectedResult = {
        pageNumber: 1,
        pageLimit: 1,
        totalPages: 1,
        totalRecords: 1,
        data: [
          {
            documentNumber: 'GBR-2021-CC-469123515',
            status: 'COMPLETE',
            documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
            createdAt: '2021-10-11T15:01:18.000Z',
            userReference: '',
          },
        ],
      };

      expect(result).toEqual(expectedResult);
    });
  });
});
