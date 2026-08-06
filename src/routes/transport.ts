import * as Hapi from '@hapi/hapi';

import Controller from '../controllers/transport.controller';
import acceptsHtml from "../helpers/acceptsHtml";
import transportSelectionSchema from '../schemas/catchcerts/transportSelectionSchema';
import trainSchema from '../schemas/catchcerts/trainSchema';
import truckSchema from '../schemas/catchcerts/truckSchema';
import planeSchema from '../schemas/catchcerts/planeSchema';
import containerVesselSchema from '../schemas/catchcerts/containerVesselSchema';
import transportSelectionSaveAsDraftSchema from '../schemas/catchcerts/transportSelectionSaveAsDraftSchema';
import errorExtractor, { buildNonJsErrorObject } from '../helpers/errorExtractor';
import { withDocumentLegitimatelyOwned } from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { defineAuthStrategies } from '../helpers/auth';
import trainSaveAsDraftSchema from '../schemas/catchcerts/trainSaveAsDraftSchema';
import truckSaveAsDraftSchema from '../schemas/catchcerts/truckSaveAsDraftSchema';
import planeSaveAsDraftSchema from '../schemas/catchcerts/planeSaveAsDraftSchema';
import containerVesselSaveAsDraftSchema from '../schemas/catchcerts/containerVesselSaveAsDraftSchema';
import { nonJSInputHistory } from '../helpers/utils/utils';

export default class TransportRoutes {

  public async register(server: Hapi.Server): Promise<any> {

    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/transport/add',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransport(request, h, false, userPrincipal, documentNumber, contactId)
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
                const errorObject = errorExtractor(error) as any;

                if (errorObject.vehicle && req.payload && (req.payload as any).arrival === true) {
                  errorObject.vehicle = 'error.arrivalVehicle.any.required';
                }

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
          path: '/v1/transport/truck/details',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetails(request, h, false, userPrincipal, documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADD-TRUCK-DETAILS][ERROR][${error.stack ?? error}`);
                return h.response().code(500);
              });
            },
            description: 'Add truck transport details',
            tags: ['api', 'transport'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const params = {
                  transportDetails: [
                  ]
                }
                const payload = req.payload as any;
                const isHtml = acceptsHtml(req.headers);
                const errorObject = errorExtractor(error);
                const vehicleCapitalized = payload?.vehicle ? payload.vehicle.charAt(0).toUpperCase() + payload.vehicle.slice(1) : '';
                const hasDepartureDateMaxError = (error as any)?.details?.some(
                  (d: any) => d.path?.[0] === 'departureDate' && d.type === 'date.max'
                );

                if (hasDepartureDateMaxError && vehicleCapitalized) {
                  errorObject['departureDate'] = payload.facilityArrivalDate
                    ? `error${vehicleCapitalized}DepartureDateAnyMax`
                    : `error${vehicleCapitalized}DepartureDateTodayMax`;
                }
                if (isHtml) {
                  const inputFields = ["registrationNumber", "nationalityOfVehicle", "departurePlace", "exportDate", "facilityArrivalDate"];
                  const result = nonJSInputHistory(payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  if (hasDepartureDateMaxError && vehicleCapitalized) {
                    jsErrorObject['departureDate'] = payload.facilityArrivalDate
                      ? `error${vehicleCapitalized}DepartureDateAnyMax`
                      : `error${vehicleCapitalized}DepartureDateTodayMax`;
                  }

                  return h.redirect(`${payload.currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetails(request, h, false, userPrincipal, documentNumber, contactId)
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
                  transportDetails: []
                }
                const payload = req.payload as any;
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const vehicleCapitalized = payload?.vehicle ? payload.vehicle.charAt(0).toUpperCase() + payload.vehicle.slice(1) : '';
                const hasDepartureDateMaxError = (error as any)?.details?.some(
                  (d: any) => d.path?.[0] === 'departureDate' && d.type === 'date.max'
                );

                if (hasDepartureDateMaxError && vehicleCapitalized) {
                  errorObject['departureDate'] = payload.facilityArrivalDate
                    ? `error${vehicleCapitalized}DepartureDateAnyMax`
                    : `error${vehicleCapitalized}DepartureDateTodayMax`;
                }

                if (isHtml) {
                  const inputFields = ["flightNumber", "containerNumber", "departurePlace", "exportDate", "facilityArrivalDate"];
                  const result = nonJSInputHistory(payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  if (hasDepartureDateMaxError && vehicleCapitalized) {
                    jsErrorObject['departureDate'] = payload.facilityArrivalDate
                      ? `error${vehicleCapitalized}DepartureDateAnyMax`
                      : `error${vehicleCapitalized}DepartureDateTodayMax`;
                  }

                  return h.redirect(`${payload.currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetails(request, h, false, userPrincipal, documentNumber, contactId)
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
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const payload = req.payload as any;
                const params = {
                  transportDetails: [
                  ]
                }
                const vehicleCapitalized = payload?.vehicle ? payload.vehicle.charAt(0).toUpperCase() + payload.vehicle.slice(1) : '';
                const hasDepartureDateMaxError = (error as any)?.details?.some(
                  (d: any) => d.path?.[0] === 'departureDate' && d.type === 'date.max'
                );

                if (hasDepartureDateMaxError && vehicleCapitalized) {
                  errorObject['departureDate'] = payload.facilityArrivalDate
                    ? `error${vehicleCapitalized}DepartureDateAnyMax`
                    : `error${vehicleCapitalized}DepartureDateTodayMax`;
                }

                if (isHtml) {
                  const inputFields = ["railwayBillNumber", "departurePlace", "exportDate", "facilityArrivalDate"];
                  const result = nonJSInputHistory(payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  if (hasDepartureDateMaxError && vehicleCapitalized) {
                    jsErrorObject['departureDate'] = payload.facilityArrivalDate
                      ? `error${vehicleCapitalized}DepartureDateAnyMax`
                      : `error${vehicleCapitalized}DepartureDateTodayMax`;
                  }

                  return h.redirect(`${payload.currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetails(request, h, false, userPrincipal, documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADD-VESSEL-DETAILS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add container vessel transport details',
            tags: ['api', 'transport'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const payload = req.payload as any;
                const params = {
                  transportDetails: [
                  ]
                }
                const vehicleCapitalized = payload?.vehicle ? payload.vehicle.charAt(0).toUpperCase() + payload.vehicle.slice(1) : '';
                const hasDepartureDateMaxError = (error as any)?.details?.some(
                  (d: any) => d.path?.[0] === 'departureDate' && d.type === 'date.max'
                );

                if (hasDepartureDateMaxError && vehicleCapitalized) {
                  errorObject['departureDate'] = payload.facilityArrivalDate
                    ? `error${vehicleCapitalized}DepartureDateAnyMax`
                    : `error${vehicleCapitalized}DepartureDateTodayMax`;
                }

                if (isHtml) {
                  const inputFields = ["vesselName", "flagState", "containerNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  if (hasDepartureDateMaxError && vehicleCapitalized) {
                    jsErrorObject['departureDate'] = payload.facilityArrivalDate
                      ? `error${vehicleCapitalized}DepartureDateAnyMax`
                      : `error${vehicleCapitalized}DepartureDateTodayMax`;
                  }

                  return h.redirect(`${payload.currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportSaveAsDraft(request, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[TRANSPORT-ADD-SAVEDRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add transport and save as draft',
            tags: ['api', 'transport', 'save as draft'],
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
              payload: transportSelectionSaveAsDraftSchema
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[TRUCK-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add truck transport details',
            tags: ['api', 'transport', 'details', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const params = {
                  transportDetails: [
                  ]
                }

                const isHtml = acceptsHtml(req.headers);
                const errorObject = errorExtractor(error);

                if (isHtml) {
                  const inputFields = ["registrationNumber", "nationalityOfVehicle", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request, h, userPrincipal, documentNumber, contactId);
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
                const params = {
                  transportDetails: []
                }

                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);

                if (isHtml) {
                  const inputFields = ["flightNumber", "containerNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request, h, userPrincipal, documentNumber, contactId);
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
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const params = {
                  transportDetails: [
                  ]
                }

                if (isHtml) {
                  const inputFields = ["railwayBillNumber", "departurePlace", "exportDate", "facilityArrivalDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addTransportDetailsSaveAsDraft(request, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[VESSEL-DETAILS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add container vessel transport details and save as draft',
            tags: ['api', 'transport', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                const isHtml = acceptsHtml(req.headers);
                const params = {
                  transportDetails: [
                  ]
                }

                if (isHtml) {
                  const inputFields = ["vesselName", "flagState", "containerNumber", "departurePlace", "exportDate"];
                  const result = nonJSInputHistory(req.payload, params, inputFields);
                  const jsErrorObject = buildNonJsErrorObject(error, result);

                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(jsErrorObject)).takeover();
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
