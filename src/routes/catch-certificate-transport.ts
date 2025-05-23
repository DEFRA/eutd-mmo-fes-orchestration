import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import { defineAuthStrategies } from '../helpers/auth';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';
import errorExtractor from '../helpers/errorExtractor';
import Controller from '../controllers/catch-certificate-transport.controller';
import { CatchCertificateTransport } from '../persistence/schema/frontEndModels/catchCertificateTransport';
import catchCertificateTransportSchema from '../schemas/catchcerts/catchCertificateTransportSelectionSchema';
import catchCertificateTransportDetailsSchema from '../schemas/catchcerts/catchCertificateTransportDetailsSchema';
import catchCertificateTransportDocumentsSchema from '../schemas/catchcerts/catchCertificateTransportDocumentsSchema';

export default class CatchCertificateTransportRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([{
        method: 'GET',
        path: '/v1/catch-certificate/transportations',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.getTransportations(userPrincipal, documentNumber, contactId);
            }).catch(error => {
              logger.error(`[GET-TRANSPORTATIONS][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Get transportation',
          tags: ['api', 'transport']
        }
      },
      {
        method: 'GET',
        path: '/v1/catch-certificate/transport/{transportId}',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              const transport: CatchCertificateTransport = await Controller.getTransport(request, userPrincipal, documentNumber, contactId);

              if (transport) {
                return transport;
              }

              return h.response().code(404);
            }).catch(error => {
              logger.error(`[GET-TRANSPORT-DETAILS][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Get transport details',
          tags: ['api', 'transport']
        }
      },
      {
        method: 'PUT',
        path: '/v1/catch-certificate/transport/{transportId}',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.updateTransport(request, userPrincipal, documentNumber, contactId);
            }).catch(error => {
              logger.error(`[UPDATE-TRANSPORT-DETAILS][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Update transport details',
          tags: ['api', 'transport'],
          validate: {
            options: {
              abortEarly: false
            },
            failAction: function (req, h, error) {
              const errorObject = errorExtractor(error);

              return h.response(errorObject).code(400).takeover();
            },
            payload: catchCertificateTransportSchema
          }
        }
      },
      {
        method: 'DELETE',
        path: '/v1/catch-certificate/transport/{transportId}',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              await Controller.removeTransportationById(request, userPrincipal, documentNumber, contactId);
              return h.response().code(200);
            }).catch(error => {
              logger.error(`[REMOVE-TRANSPORT-DOCUMENTS][ERROR][${error.stack ?? error}`);
              return h.response().code(500);
            })
          },
          description: 'Update transport documents',
          tags: ['api', 'transportDocuments']
        }
      },
      {
        method: 'PUT',
        path: '/v1/catch-certificate/transport-details/{transportId}',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.updateTransport(request, userPrincipal, documentNumber, contactId);
            }).catch(error => {
              logger.error(`[UPDATE-TRANSPORT-DETAILS][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Update transport details',
          tags: ['api', 'transport'],
          validate: {
            options: {
              abortEarly: false
            },
            failAction: function (req, h, error) {
              const errorObject = errorExtractor(error);

              return h.response(errorObject).code(400).takeover();
            },
            payload: catchCertificateTransportDetailsSchema
          }
        }
      },
      {
        method: 'PUT',
        path: '/v1/catch-certificate/transport-documents/{transportId}',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.updateTransportDocuments(request, userPrincipal, documentNumber, contactId);
            }).catch(error => {

              logger.error(`[UPDATE-TRANSPORT-DOCUMENTS][ERROR][${error.stack ?? error}`);
              return h.response().code(500);
            })
          },
          description: 'Update transport documents',
          tags: ['api', 'transportDocuments'],
          validate: {
            options: {
              abortEarly: false
            },
            failAction: function (req, h, error) {
              const errorObject = errorExtractor(error);
              return h.response(errorObject).code(400).takeover();
            },
            payload: catchCertificateTransportDocumentsSchema
          }
        }
      },
      {
        method: 'GET',
        path: '/v1/catch-certificate/transport/check',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.getTransportationCheck(userPrincipal, documentNumber, contactId);
            }).catch(error => {
              logger.error(`[GET-TRANSPORTATION-CHECK][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Add Another transport check',
          tags: ['api', 'transport']
        }
      },
      {
        method: 'POST',
        path: '/v1/catch-certificate/transport/check',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.addTransportationCheck(request, userPrincipal, documentNumber, contactId);
            }).catch(error => {
              logger.error(`[ADD-TRANSPORTATION-CHECK][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Add Another transport check',
          tags: ['api', 'transport'],
          validate: {
            options: {
              abortEarly: false
            },
            failAction: function (req, h, error) {
              const errorObject = errorExtractor(error);

              return h.response(errorObject).code(400).takeover();
            },
            payload: Joi.object({
              addTransportation: Joi.string().valid("yes", "no").required()
            })
          }
        }
      },
      {
        method: 'POST',
        path: '/v1/catch-certificate/transport/add',
        options: {
          auth: defineAuthStrategies(),
          security: true,
          cors: true,
          handler: async (request, h) => {
            return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
              return await Controller.addTransport(request, userPrincipal, documentNumber, contactId)
            }).catch(error => {
              logger.error(`[ADDING-TRANSPORT][ERROR][${error.stack || error}`);
              return h.response().code(500);
            })
          },
          description: 'Add transport',
          tags: ['api', 'transport'],
          validate: {
            options: {
              abortEarly: false
            },
            failAction: function (req, h, error) {
              const errorObject = errorExtractor(error);

              return h.response(errorObject).code(400).takeover();
            },
            payload: Joi.object({
              vehicle: Joi.string().valid("truck", "plane", "train", "containerVessel").required()
            })
          }
        }
      }]);
      resolve(null);
    })
  }
}