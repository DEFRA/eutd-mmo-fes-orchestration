import * as Hapi from '@hapi/hapi';
import Controller from '../controllers/protection-monitoring.controller';


export default class ProtectiveMonitoringRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/monitoring-event/post',
          options: {
            security: true,
            cors: true,
            handler: Controller.postEvent,
            description: 'Post Protective Monitoring Event',
            tags: ['api', 'post-protective-monitoring-event']
          }
        }
      ]);
      resolve(null);
    });
  }
}