import * as Hapi from '@hapi/hapi';

import Controller from '../controllers/transport.controller';
import acceptsHtml from "../helpers/acceptsHtml";
import transportSelectionSchema from '../schemas/catchcerts/transportSelectionSchema';
import trainSchema from '../schemas/catchcerts/trainSchema';
import truckSchema from '../schemas/catchcerts/truckSchema';
import truckCmrSchema from '../schemas/catchcerts/truckCmrSchema';
import planeSchema from '../schemas/catchcerts/planeSchema';
import containerVesselSchema from '../schemas/catchcerts/containerVesselSchema';
import transportSelectionSaveAsDraftSchema from '../schemas/catchcerts/transportSelectionSaveAsDraftSchema';
import truckCmrSaveAsDraftSchema from '../schemas/catchcerts/truckCmrSaveAsDraftSchema';
import truckSaveAsDraftSchema from '../schemas/catchcerts/truckSaveAsDraftSchema';
import planeSaveAsDraftSchema from '../schemas/catchcerts/planeSaveAsDraftSchema';
import trainSaveAsDraftSchema from '../schemas/catchcerts/trainSaveAsDraftSchema';
import containerVesselSaveAsDraftSchema from '../schemas/catchcerts/containerVesselSaveAsDraftSchema';
import errorExtractor, {buildNonJsErrorObject} from '../helpers/errorExtractor';
import {withDocumentLegitimatelyOwned} from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { defineAuthStrategies } from '../helpers/auth';

export default class TransportRoutes {

  public async register(server: Hapi.Server): Promise<any> {

    function nonJSInputHistory(fieldParam, dataObject, arrayOfInputFields) {
      const keys = Object.keys(fieldParam)
        for (const key of keys) {
          if (arrayOfInputFields.includes(key)){
            const fieldChar = "temp"+key.charAt(0).toUpperCase()+key.substring(1, key.length);

            if (fieldParam[key].length !== 0)
              dataObject.transportDetails.push({field: fieldChar, value: fieldParam[key]});
          }
        }
        return dataObject;
    }

    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/transport/add',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransport(request,h,false,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADDING-TRANSPORT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              })
            },
            description: 'Add transport',
            tags: ['api', 'transport'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);

                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: transportSelectionSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/truck/cmr',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTruckCMR(request,h,false,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[ADD-TRUCK-CMR][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add truck CMR details',
            tags: ['api', 'transport'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);

                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload : truckCmrSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/truck/details',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetails(request,h,false,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADD-TRUCK-DETAILS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add truck transport details',
            tags: ['api', 'transport'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const params = {
                  transportDetails:[
                  ]
                }

                const isHtml = acceptsHtml(req.headers);
                const errorObject = errorExtractor(error);

                if (isHtml) {
                  const inputFields = ["registrationNumber", "nationalityOfVehicle", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=`+JSON.stringify(jsErrorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: truckSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/plane/details',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetails(request,h,false,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                  logger.error(`[ADD-PLANE-DETAILS][ERROR][${error.stack || error}`);
                  return h.response().code(500);
                });
            },
            description: 'Add plane transport details',
            tags: ['api', 'transport'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const params = {
                  transportDetails:[]
                }

                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);

                if (isHtml) {
                  const inputFields = ["flightNumber", "containerNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=`+JSON.stringify(jsErrorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },

              payload: planeSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/train/details',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetails(request,h,false,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADD-TRAIN-DETAILS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add train transport details',
            tags: ['api', 'transport'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const params = {
                  transportDetails:[
                  ]
                }

                if (isHtml){
                  const inputFields = ["railwayBillNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=`+JSON.stringify(jsErrorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: trainSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/containerVessel/details',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetails(request,h,false,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                  logger.error(`[ADD-VESSEL-DETAILS][ERROR][${error.stack || error}`);
                  return h.response().code(500);
              });
            },
            description: 'Add container vessel transport details',
            tags: ['api', 'transport'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const params = {
                  transportDetails:[
                  ]
                }

                if (isHtml) {
                  const inputFields = ["vesselName","flagState","containerNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=`+JSON.stringify(jsErrorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: containerVesselSchema
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/transport/details/{journey}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                return await Controller.getTransportDetails(request, userPrincipal, documentNumber, contactId);
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
          method: 'POST',
          path: '/v1/transport/add/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[TRANSPORT-ADD-SAVEDRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add transport and save as draft',
            tags: ['api', 'transport', 'save as draft'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: transportSelectionSaveAsDraftSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/truck/cmr/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTruckCMRSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                  logger.error(`[TRANSPORT-TRUCK-CMR-DRAFT][ERROR][${error.stack || error}`);
                  return h.response().code(500);
                });
            },
            description: 'Add truck CMR details and save as draft',
            tags: ['api', 'transport cmr', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload : truckCmrSaveAsDraftSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/truck/details/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[TRUCK-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add truck transport details',
            tags: ['api', 'transport', 'details', 'save as draft'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);

                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: truckSaveAsDraftSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/plane/details/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[PLANE-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add plane transport details and save as draft',
            tags: ['api', 'plane transport', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: planeSaveAsDraftSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/train/details/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[TRAIN-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add train transport details and save as draft',
            tags: ['api', 'transport details', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: trainSaveAsDraftSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/transport/containerVessel/details/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[VESSEL-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add container vessel transport details and save as draft',
            tags: ['api', 'transport', 'save as draft'],
            validate:{
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);

                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: containerVesselSaveAsDraftSchema
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}
