import * as Hapi from '@hapi/hapi';
import NotificationRoutes from './notification';
import NotificationService from '../services/notification.service';

describe('notification routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new NotificationRoutes()
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('GET /v1/notifications', () => {

    const request: any = {
      method: 'GET',
      url: '/v1/notification'
    }

    let mockGetNotification;

    beforeAll(() => {
      mockGetNotification = jest.spyOn(NotificationService, 'get');
    })

    it('should return 204 if there is no notification', async () => {
      mockGetNotification.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();
    });

    it('should return 200 if there is a notification and it is published', async () => {
      const notification = {
        title: 'title',
        message: 'message',
        isPublished: true
      }

      mockGetNotification.mockResolvedValue(notification);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(200);
      expect(response.result).toStrictEqual({
        title: 'title',
        message: 'message'
      });
    });

    it('should return 204 if there is a notification and it is not published', async () => {
      const notification = {
        title: 'title',
        message: 'message',
        isPublished: false
      }

      mockGetNotification.mockResolvedValue(notification);

      const response = await server.inject(request);

      expect(response.statusCode).toBe(204);
      expect(response.result).toBeNull();
    });

  });

});
