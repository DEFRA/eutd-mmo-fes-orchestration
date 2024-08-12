import * as Hapi from '@hapi/hapi';

export default class HealthRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'GET',
          path: '/health',
          options: {
            auth: false,
            handler: function(req, h) {
              return h.response({status: 'UP'});
            },
            description: 'Health check',
            tags: ['api']
          }
        }
      ]);
      resolve(null);
    });
  }
}