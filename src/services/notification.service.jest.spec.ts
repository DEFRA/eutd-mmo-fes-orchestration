import NotificationService from './notification.service';
import { SessionStoreFactory } from '../session_store/factory';

describe('NotificationService', () => {

  describe('get', () => {

    let mockGetSessionStore;
    let mockSessionStore;

    beforeAll(() => {
      mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    });

    beforeEach(() => {
      mockSessionStore = {
        read: jest.fn(),
        readAll: jest.fn(),
        readAllFor: jest.fn(),
        writeAll: jest.fn(),
        writeAllFor: jest.fn(),
        initialize: jest.fn(),
        cleanUp: jest.fn(),
        getDocument: jest.fn(),
        tagByDocumentNumber: jest.fn(),
        removeTag: jest.fn(),
        getKeysForTag: jest.fn()
      };

      mockGetSessionStore.mockResolvedValue(mockSessionStore);
    });

    it(`should return data from the 'notifications' key in redis`, async () => {
      const notification = {title: 'test', message: 'test', isPublished: true};

      mockSessionStore.read.mockResolvedValue(notification);

      const result = await NotificationService.get();

      expect(result).toBe(notification);
      expect(mockSessionStore.read).toHaveBeenCalledWith('notification');
    });

  });

});