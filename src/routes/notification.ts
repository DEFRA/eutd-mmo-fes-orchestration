import * as Hapi from '@hapi/hapi';
import NotificationService from '../services/notification.service';

export default class NotificationRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/notification',
          options: {
            auth: false,
            handler: async function(_: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
              const notification = await NotificationService.get();

              return (notification && notification.isPublished)
                ? h.response({
                    title: notification.title,
                    message: notification.message
                  })
                : h.response().code(204);
            },
            description: 'Get notification for the frontend',
            tags: ['api']
          }
        }
      ]);
      resolve(null);
    });
  }
}