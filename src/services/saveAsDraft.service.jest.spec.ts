import SaveAsDraftService from './saveAsDraft.service';
import { MockSessionStorage } from "../../test/session_store/mock";
import { SessionStoreFactory } from '../session_store/factory';
import { SAVE_DRAFT_KEY } from "../session_store/constants";


describe('SaveAsDraftService', () => {
  const contactId = 'contactBob';

  const mockSessionStore = new MockSessionStorage();
  const mockWriteAllFor = jest.fn();
  const mockReadAllFor = jest.fn();
  mockSessionStore.writeAllFor = mockWriteAllFor;
  mockSessionStore.readAllFor = mockReadAllFor;

  const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
  mockGetSessionStore.mockResolvedValue(mockSessionStore);

  describe('Get Draft Link', () => {
    it('should get save as draft details', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

      const payload = {
        journey: 'catchCertificate'
      };

      const expected = {};

      mockReadAllFor.mockReturnValue({});

      const data = await SaveAsDraftService.getDraftLink(USER_ID, payload.journey, contactId);

      expect(data).toStrictEqual(expected);
    });

    it('should get all save as draft details', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

      const payload = {
        journey: 'catchCertificate'
      };

      const sessionStoreData = {
        currentUri: {
          "GBR-2020-CC-AC11E08AB": '/catch-certificates/:documentNumber/exporter-details'
        },
        journey: "catchCertificate",
        user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12"
      };

      const expected = {
        currentUri: {
          "GBR-2020-CC-AC11E08AB": '/catch-certificates/:documentNumber/exporter-details'
        },
        journey: "catchCertificate",
        user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12"
      };

      mockReadAllFor.mockReturnValue(sessionStoreData);

      const data = await SaveAsDraftService.getDraftLink(USER_ID, payload.journey, contactId);

      expect(data).toStrictEqual(expected);
    });

    it('should return an empty object if no draft links are found', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const payload = {
        journey    : 'catchCertificate',
        currentUri : '/catch-certificates/:documentNumber/exporter-details',
        user_id    : 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      };

      mockReadAllFor.mockReturnValue(undefined);

      const data = await SaveAsDraftService.getDraftLink(USER_ID, payload.journey, contactId);

      expect(data).toStrictEqual({});
    });
  });

  describe('Delete Draft Link', () => {
    let mockGetDraftLink;

    beforeEach(() => {
      mockGetDraftLink = jest.spyOn(SaveAsDraftService, 'getDraftLink');
    });

    afterEach(() => {
      mockGetDraftLink.mockRestore();
    });

    it('should remove a Save as Draft link with a document number', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const DOCUMENT_NUMBER = 'GBR-2020-CC-AC11E08AB';
      const journey = 'catchCertificate';

      const expected = {
        currentUri : {},
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      };

      mockGetDraftLink.mockResolvedValue({
        currentUri : {
          "GBR-2020-CC-AC11E08AB" : '/catch-certificates/:documentNumber/exporter-details'
        },
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      });

      await SaveAsDraftService.deleteDraftLink(USER_ID, DOCUMENT_NUMBER, journey, contactId);

      expect(mockWriteAllFor).toHaveBeenCalledWith(USER_ID, contactId, `catchCertificate/${SAVE_DRAFT_KEY}`, expected);
    });

    it('should remove a specified Save as Draft link for given document number', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const DOCUMENT_NUMBER = 'GBR-2020-CC-AC11E08AB';
      const journey = 'catchCertificate';

      const expected = {
        currentUri : {
          "GBR-2020-CC-8D63A9F93" : '/catch-certificates/:documentNumber/add-landings'
        },
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      };

      mockGetDraftLink.mockResolvedValue({
        currentUri : {
          "GBR-2020-CC-AC11E08AB" : '/catch-certificates/:documentNumber/exporter-details',
          "GBR-2020-CC-8D63A9F93" : '/catch-certificates/:documentNumber/add-landings'
        },
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      });

      await SaveAsDraftService.deleteDraftLink(USER_ID, DOCUMENT_NUMBER, journey, contactId);

      expect(mockWriteAllFor).toHaveBeenCalledWith(USER_ID, contactId, `catchCertificate/${SAVE_DRAFT_KEY}`, expected);
    });

    it('should not remove a Save as Draft link for undefined document number', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const DOCUMENT_NUMBER = undefined;
      const journey = 'catchCertificate';

      const expected = {
        currentUri : {
          "GBR-2020-CC-AC11E08AB" : '/catch-certificates/:documentNumber/exporter-details',
          "GBR-2020-CC-8D63A9F93" : '/catch-certificates/:documentNumber/add-landings'
        },
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      };

      mockGetDraftLink.mockResolvedValue({
        currentUri : {
          "GBR-2020-CC-AC11E08AB" : '/catch-certificates/:documentNumber/exporter-details',
          "GBR-2020-CC-8D63A9F93" : '/catch-certificates/:documentNumber/add-landings'
        },
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      });

      await SaveAsDraftService.deleteDraftLink(USER_ID, DOCUMENT_NUMBER, journey, contactId);

      expect(mockWriteAllFor).toHaveBeenCalledWith(USER_ID, contactId, `catchCertificate/${SAVE_DRAFT_KEY}`, expected);
    });

    it('should not remove a Save as Draft link for empty currentUri object', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const DOCUMENT_NUMBER = 'GBR-2020-CC-AC11E08AB';
      const journey = 'catchCertificate';

      const expected = {
        currentUri : {},
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      };

      mockGetDraftLink.mockResolvedValue({
        currentUri : {},
        journey: 'catchCertificate',
        user_id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
      });

      await SaveAsDraftService.deleteDraftLink(USER_ID, DOCUMENT_NUMBER, journey, contactId);

      expect(mockWriteAllFor).toHaveBeenCalledWith(USER_ID, contactId, `catchCertificate/${SAVE_DRAFT_KEY}`, expected);
    });

    it('should not attempt to delete a Save as Draft link for an undefined currentUri', async () => {
      const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
      const DOCUMENT_NUMBER = 'GBR-2020-CC-AC11E08AB';
      const journey = 'catchCertificate';

      mockGetDraftLink.mockResolvedValue(null);

      await SaveAsDraftService.deleteDraftLink(USER_ID, DOCUMENT_NUMBER, journey, contactId);

      expect(mockWriteAllFor).toHaveBeenCalledTimes(0);
    });
  });
});