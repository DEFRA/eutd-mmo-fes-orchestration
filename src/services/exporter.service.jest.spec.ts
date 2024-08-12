import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import ExporterService from './exporter.service';
import * as SessionManager from "../helpers/sessionManager"


describe('Exporter Service', () => {

  const contactId = 'contactBob';

  describe('save', () => {

    describe('if saving an exporter for a CC', () => {

      let mockGetFn;
      let getUserSessionDataMock;
      let sessionManagerMock;

      beforeEach(() => {
        mockGetFn = jest.spyOn(CatchCertService, 'getDraftData');
        getUserSessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData')
        sessionManagerMock = jest.spyOn(SessionManager,'withUserSessionDataStored');
      });

      afterEach(() => {
        mockGetFn.mockRestore();
        getUserSessionDataMock.mockRestore();
        sessionManagerMock.mockRestore();
      });

    it('should save the data to mongo, merge the response and retrieve current session data', async () => {
        sessionManagerMock.mockResolvedValue(null);
        mockGetFn.mockResolvedValue({name: 'Bob'});
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        const result = await ExporterService.save({age: 30}, 'Bob','GB-34324-34234-234234', `catchCertificate/exporter`, contactId);

        const expectedResult = {
          age: 30,
          currentUri: "test/test.html",
          name: 'Bob',
          nextUri: "test/test2.html",
          user_id: "Bob"
        }

        expect(result).toStrictEqual(expectedResult);
      });

    it('should save session data in REDIS', async function () {
        sessionManagerMock.mockResolvedValue(null);

        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };
        mockGetFn.mockResolvedValue({name: 'Bob'});
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob','GB-34324-34234-234234',`catchCertificate/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

    it('should save session data in REDIS when its start of journey and there is no doc number', async function () {
        sessionManagerMock.mockResolvedValue(null);
        const mockUpsert = jest.spyOn(CatchCertService, 'upsertExporterDetails');


        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };

        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockUpsert.mockResolvedValue();
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob', 'GB-34324-34234-234234', `catchCertificate/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

      describe("When there is no session data", () => {
      it('will not return the properties if there is no data at all', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          getUserSessionDataMock.mockResolvedValue(undefined)

          const result = await ExporterService.save({age: 30}, 'Bob', 'GB-34324-34234-234234',`catchCertificate/exporter`, contactId);

          const expectedResult = {
            age: 30,
            name: 'Bob',
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });

        it('will return undefined if there is data but required properties are not present', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          getUserSessionDataMock.mockResolvedValue({name: "Bob"})

          const result = await ExporterService.save({age: 30}, 'Bob', 'GB-34324-34234-234234',`catchCertificate/exporter`, contactId);

          const expectedResult = {
            age: 30,
            currentUri: undefined,
            name: 'Bob',
            nextUri: undefined,
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });
      });

    });

    describe('if saving an exporter for a PS', () => {

      let mockGetFn;
      let mockUpsertFn;
      let mockDocumentNumber;
      let getUserSessionDataMock;
      let sessionManagerMock;

      beforeEach(() => {
        mockGetFn = jest.spyOn(ProcessingStatementService, 'getDraftData');
        mockUpsertFn = jest.spyOn(ProcessingStatementService, 'upsertExporterDetails');
        mockDocumentNumber = jest.spyOn(ProcessingStatementService,'getDraftCertificateNumber');
        getUserSessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData');
        sessionManagerMock = jest.spyOn(SessionManager,'withUserSessionDataStored');
      });

      afterEach(() => {
        mockGetFn.mockRestore();
        mockUpsertFn.mockRestore();
        mockDocumentNumber.mockRestore();
        getUserSessionDataMock.mockRestore();
        sessionManagerMock.mockRestore();
      });

      it('should save the data to mongo, merge the response and retrieve current session data', async () => {
        sessionManagerMock.mockResolvedValue(null);
        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })


        const result = await ExporterService.save({age: 30}, 'Bob', 'GB-34324-34234-234234',`processingStatement/exporter`, contactId);

        const expectedResult = {
          age: 30,
          currentUri: "test/test.html",
          name: 'Bob',
          nextUri: "test/test2.html",
          user_id: "Bob"
        }

        expect(result).toStrictEqual(expectedResult);
      });

      it('should save session data in REDIS', async function () {
        sessionManagerMock.mockResolvedValue(null);

        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };
        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob', 'GB-34324-34234-234234',`processingStatement/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

      it('should save session data in REDIS when its start of journey and there is no doc number', async function () {
        sessionManagerMock.mockResolvedValue(null);
        const mockUpsert = jest.spyOn(ProcessingStatementService, 'upsertExporterDetails');

        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };

        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockUpsert.mockResolvedValue();
        mockDocumentNumber.mockReturnValueOnce(undefined)
          .mockReturnValueOnce('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob', 'GB-34324-34234-234234', `processingStatement/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

      describe("When there is no session data", () => {
        it('will not return the properties if there is no data at all', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
          getUserSessionDataMock.mockResolvedValue(undefined)

          const result = await ExporterService.save({age: 30}, 'Bob', 'GB-34324-34234-234234', `processingStatement/exporter`, contactId);

          const expectedResult = {
            age: 30,
            name: 'Bob',
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });

        it('will return undefined if there is data but required properties are not present', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
          getUserSessionDataMock.mockResolvedValue({name: "Bob"})

          const result = await ExporterService.save({age: 30}, 'Bob', 'GB-34324-34234-234234', `processingStatement/exporter`, contactId);

          const expectedResult = {
            age: 30,
            currentUri: undefined,
            name: 'Bob',
            nextUri: undefined,
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });
      });
    });

    describe('if saving an exporter for a SD', () => {

      let mockGetFn;
      let mockUpsertFn;
      let mockDocumentNumber;
      let getUserSessionDataMock;
      let sessionManagerMock;

      beforeEach(() => {
        mockGetFn = jest.spyOn(StorageDocumentService, 'getDraftData');
        mockUpsertFn = jest.spyOn(StorageDocumentService, 'upsertDraftData');
        mockDocumentNumber = jest.spyOn(StorageDocumentService,'getDraftCertificateNumber');
        getUserSessionDataMock = jest.spyOn(SessionManager,'getCurrentSessionData');
        sessionManagerMock = jest.spyOn(SessionManager,'withUserSessionDataStored');
      });

      afterEach(() => {
        mockGetFn.mockRestore();
        mockUpsertFn.mockRestore();
        mockDocumentNumber.mockRestore();
        getUserSessionDataMock.mockRestore();
        sessionManagerMock.mockRestore();
      });

      it('should save the data to mongo and merge the response', async () => {
        sessionManagerMock.mockResolvedValue(null);
        mockGetFn.mockResolvedValue({ name: 'Bob' });
        mockUpsertFn.mockResolvedValue(null);
        mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })


        const result = await ExporterService.save({ age: 30 }, 'Bob', undefined,`storageNotes/exporter`, contactId);

        const expectedResult = {
          age: 30,
          currentUri: "test/test.html",
          name: 'Bob',
          nextUri: "test/test2.html",
          user_id: "Bob"
        }

        expect(result).toStrictEqual(expectedResult);
      });

      it('should save session data in REDIS', async function () {
        sessionManagerMock.mockResolvedValue(null);

        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };
        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob',undefined, `storageNotes/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

      it('should save session data in REDIS when its start of journey and there is no doc number', async function () {
        sessionManagerMock.mockResolvedValue(null);
        const mockUpsert = jest.spyOn(StorageDocumentService, 'upsertExporterDetails');

        const payload  = {
          age: "30",
          user_id: "Bob",
          currentUri: "Test",
          nextUri: "Test"
        };

        mockGetFn.mockResolvedValue({name: 'Bob'});
        mockUpsert.mockResolvedValue();
        mockDocumentNumber.mockReturnValueOnce(undefined)
          .mockReturnValueOnce('GB-34324-34234-234234');
        getUserSessionDataMock.mockResolvedValue({documentNumber:'GB-34324-34234-234234',currentUri: "test/test.html", nextUri: "test/test2.html" })

        await ExporterService.save(payload, 'Bob',undefined, `storageNotes/exporter`, contactId);

        expect(sessionManagerMock).toHaveBeenCalledTimes(1);
      });

      describe("When there is no session data", () => {
        it('will not return the properties if there is no data at all', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
          getUserSessionDataMock.mockResolvedValue(undefined)

          const result = await ExporterService.save({age: 30}, 'Bob', undefined,`storageNotes/exporter`, contactId);

          const expectedResult = {
            age: 30,
            name: 'Bob',
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });

        it('will return undefined if there is data but required properties are not present', async () => {
          sessionManagerMock.mockResolvedValue(null);
          mockGetFn.mockResolvedValue({name: 'Bob'});
          mockDocumentNumber.mockReturnValue('GB-34324-34234-234234');
          getUserSessionDataMock.mockResolvedValue({name: "Bob"})

          const result = await ExporterService.save({age: 30}, 'Bob',undefined, `storageNotes/exporter`, contactId);

          const expectedResult = {
            age: 30,
            currentUri: undefined,
            name: 'Bob',
            nextUri: undefined,
            user_id: "Bob"
          }

          expect(result).toStrictEqual(expectedResult);
        });
      });

    });

  });

});