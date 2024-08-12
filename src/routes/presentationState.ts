import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import Controller from '../controllers/presentationState.controller';

export default class PresentationStateRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/presentation-state/search',
          options: {
            security: true,
            cors: true,
            handler: Controller.getPS,
            description: 'Get available presentation and state for a species FAO code',
            tags: ['presentation', 'fish', 'species', 'state'],
            validate: {
              query: Joi.object({
                speciesFaoCode: Joi.string()
              })
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}