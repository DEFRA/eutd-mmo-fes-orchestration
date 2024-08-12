import * as Hapi from '@hapi/hapi';

import Controller from '../controllers/commodity.controller';

export default class CommodityRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/commodity/search',
          options: {
            security: true,
            cors: true,
            handler: Controller.searchCC,
            description: 'Get available commodity codes',
            tags: ['commodity code', 'fish', 'species', 'state']
          }
        }
      ]);
      resolve(null);
    });
  }
}