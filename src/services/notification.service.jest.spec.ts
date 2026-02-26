import NotificationService from './notification.service';
import { SessionStoreFactory } from '../session_store/factory';

describe('NotificationService', () => {

  describe('get', () => {

    let mockGetSessionStore;
    let mockSessionStore;

    beforeEach(() => {
      NotificationService.clearSessionStoreCacheForTests();
      mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');

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

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it(`should return data from the 'notifications' key in redis`, async () => {
      const notification = {title: 'test', message: 'test', isPublished: true};

      mockSessionStore.read.mockResolvedValue(notification);

      const result = await NotificationService.get();

      expect(result).toBe(notification);
      expect(mockSessionStore.read).toHaveBeenCalledWith('notification');
    });

    it('should initialize session store only once across multiple reads', async () => {
      const notification = {title: 'test', message: 'test', isPublished: true};

      mockSessionStore.read.mockResolvedValue(notification);

      await NotificationService.get();
      await NotificationService.get();

      expect(mockGetSessionStore).toHaveBeenCalledTimes(1);
      expect(mockSessionStore.read).toHaveBeenCalledTimes(2);
      expect(mockSessionStore.read).toHaveBeenNthCalledWith(1, 'notification');
      expect(mockSessionStore.read).toHaveBeenNthCalledWith(2, 'notification');
    });

  });

});