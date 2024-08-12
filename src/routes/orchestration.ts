import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import OrchestrationService, { storageNote, processingStatement } from '../services/orchestration.service';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';
import { defineAuthStrategies } from '../helpers/auth';

export default class ProcessingStatementRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/{redisKey}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(req,h,async (userPrincipal,documentNumber, contactId) => {
                return await OrchestrationService.get(req, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[GETTING-SD-PS][ERROR][${error.stack || error}`);
                return h.response('error').code(500);
              });
            },
            description: 'Get the processing statement',
            tags: ['api']
          }
        },
        {
          method: 'POST',
          path: '/v1/{redisKey}/saveAndValidate',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async function(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
              return await withDocumentLegitimatelyOwned(req,h, async (userPrincipal, documentNumber, contactId) => {
                return await OrchestrationService.saveAndValidate(req, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[SAVING-SD-PS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Save processing statement',
            tags: ['api']
          }
        },
        {
          method: 'GET',
          path: '/v1/{redisKey}/back',
          options: {
            security: true,
            cors: true,
            handler: async function(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
              await OrchestrationService.back(req,h);
            },
            description: 'Add a new key',
            tags: ['api']
          }
        },
        {
          method: 'POST',
          path: '/v1/{redisKey}/removeKey',
          options: {
            security: true,
            cors: true,
            handler: async function(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
              await OrchestrationService.removeKey(req,h);
            },
            description: 'Remove key',
            tags: ['api']
          }
        },
        {
          method: 'POST',
          path: '/v1/{redisKey}/generatePdf',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async function(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
              return await withDocumentLegitimatelyOwned(req,h,async (userPrincipal, documentNumber) => {
                return await OrchestrationService.generatePdf(req, h, userPrincipal, documentNumber);
              }).catch(error => {
                logger.error(`[CREATING-PS-SD][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            description: 'generate the processing statement pdf',
            tags: ['api'],
            validate: {
              params: Joi.object({
                redisKey: Joi.string().valid(storageNote, processingStatement).insensitive()
              })
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}
