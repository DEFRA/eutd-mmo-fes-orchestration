import * as Hapi from '@hapi/hapi';
import * as fs from 'fs'


const gitHash = (() => {
  try {
    return fs.readFileSync('./githash', 'utf8').trim();
  }
  catch( err) {
    return '';
  }
})();


export default class GeneralRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'GET',
          path: '/',
          options: {
            auth: false,
            cors: true,
            handler: function(_req, _h) {
              return 'Server is successfully running - please use one of the API endpoints';
            },
            description: 'Just a sanity check',
            tags: ['api']
          }
        },
        {
          method: 'GET',
          path: '/v1/version-info',
          handler: (_req, h) => {
            return h.response({ gitHash });
          }
        },
        {
          method: 'GET',
          path: '/v1/client-ip',
          handler: (req, h) => {
            const xFF = req.headers['x-forwarded-for'];
            const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;
            return h.response(ip);
          }
        }
      ]);
      resolve(null);
    });
  }
}
