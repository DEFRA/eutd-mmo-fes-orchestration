import * as Hapi from "@hapi/hapi";
import TransportRoutes from "./transport";
import * as moment from 'moment';
import * as DocumentOwnershipValidator from "../validators/documentOwnershipValidator";
import Controller from '../controllers/transport.controller';

const createServerInstance = async () => {
    const server = Hapi.server();
    await server.register(require("@hapi/basic"));
    await server.register(require("hapi-auth-jwt2"));

    const fesApiValidate = async (
        _request: Hapi.Request,
        _username: string,
        _password: string
    ) => {
        const isValid = true;
        const credentials = { id: 'fesApi', name: 'fesApi' };
        return { isValid, credentials };
    };

    server.auth.strategy("fesApi", "basic", {
        validate: fesApiValidate,
    });

    server.auth.strategy("jwt", "jwt", {
        verify: (_decoded, _req) => {
            return { isValid: true };
        },
    });

    server.auth.default("jwt");

    return server;
};

describe("transport routes", () => {

    let server;

    const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";

    const document = {
        documentNumber: "GBR-2021-CC-3434343434"
    }

    beforeAll(async () => {
        server = await createServerInstance()
        const routes = await new TransportRoutes();
        await routes.register(server);
        await server.initialize();
        await server.start();
    });

    afterAll(async () => {
        await server.stop();
    });

    describe("Transport endpoints", () => {

        let mockWithDocumentLegitimatelyOwned;
        let mockAddTransport;
        let mockAddTransportSaveAsDraft;
        let mockGetTransportDetails;
        let mockSelectTransport;
        let mockSelectTransportSaveAsDraft;
        let mockAddTruckCMR;
        let mockAddTruckCMRSaveAsDraft;

        beforeEach(() => {
            mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
            mockWithDocumentLegitimatelyOwned.mockResolvedValue(document);

            mockAddTransport = jest.spyOn(Controller, 'addTransportDetails');
            mockAddTransport.mockResolvedValue({ some : 'data' });

            mockSelectTransport = jest.spyOn(Controller, 'addTransport');
            mockSelectTransport.mockResolvedValue({ some : 'data' });

            mockSelectTransportSaveAsDraft = jest.spyOn(Controller, 'addTransportSaveAsDraft');
            mockSelectTransportSaveAsDraft.mockResolvedValue({ some : 'data' });

            mockAddTransportSaveAsDraft = jest.spyOn(Controller, 'addTransportDetailsSaveAsDraft');
            mockAddTransportSaveAsDraft.mockResolvedValue({ some : 'data' });

            mockGetTransportDetails = jest.spyOn(Controller, 'getTransportDetails');
            mockGetTransportDetails.mockResolvedValue({ some : 'data' });

            mockAddTruckCMR = jest.spyOn(Controller, 'addTruckCMR');
            mockAddTruckCMR.mockResolvedValue({ some : 'data' });

            mockAddTruckCMRSaveAsDraft = jest.spyOn(Controller, 'addTruckCMRSaveAsDraft');
            mockAddTruckCMRSaveAsDraft.mockResolvedValue({ some : 'data' });

        })

        afterEach(() => {
            jest.restoreAllMocks();
        });

        function createRequestObj(url, additionalPayloadParams = {}, method = 'POST', acceptHtml = false) {
            const request: any = {
                method,
                url,
                app: {
                    claims: {
                        sub: "Bob",
                    },
                },
                headers: {
                    documentnumber: DOCUMENT_NUMBER,
                    accept: acceptHtml ? 'text/html' : 'application/json',
                    Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
                },
                payload: method === 'GET' ? undefined : {
                    ...additionalPayloadParams,
                    "journey": "storageNotes"
                },
            };

            return request
        }

        const saveVehicleEndpointTestCases = [
            {
                url: '/v1/transport/truck/details',
                otherRequiredFields: {
                    "nationalityOfVehicle": "x",
                    "registrationNumber": "x",
                    "departurePlace": "x"
                }
            },
            {
                url: '/v1/transport/plane/details',
                otherRequiredFields: {
                    "flightNumber": "x",
                    "departurePlace": "x",
                    "containerNumber": "x"
                }
            },
            {
                url: '/v1/transport/train/details',
                otherRequiredFields: {
                    "departurePlace": "x",
                    "railwayBillNumber": "x",
                }
            },
            {
                url: '/v1/transport/containerVessel/details',
                otherRequiredFields: {
                    vesselName: "x",
                    flagState: "x",
                    containerNumber: "x",
                    departurePlace: "x",
                }
            },
        ]

        // testing save /v1/transport/{vehicle}/details and /v1/transport/{vehicle}/details/saveAsDraft
        for (const endpoint of saveVehicleEndpointTestCases) {
            const {url, otherRequiredFields} = endpoint;

            const exportDateFailureCases = [
                {
                    testText: 'will return error if no exportDate given',
                    exportDateErrorText: 'error.exportDate.any.required',
                    exportDateFields: { exportDateTo: moment().startOf('day').add(1, "day").toISOString() }
                },
                {
                    testText: 'will return error if exportDate is not in right date format',
                    exportDateErrorText: 'error.exportDate.date.format',
                    exportDateFields: {"exportDate": "not the right format!", exportDateTo: moment().startOf('day').add(1, "day").toISOString() }
                },
                {
                    testText: 'will return error if exportDate is BEYOND the range of 1 day in future',
                    exportDateErrorText: 'error.exportDate.date.max',
                    exportDateFields: {"exportDate": moment().utc().add(2, 'day').format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                },
            ]

            for (const theCase of exportDateFailureCases) {
                const {testText, exportDateErrorText, exportDateFields} = theCase;

                it(testText + '(400) for ' + url, async () => {
                    const request = createRequestObj(url, {...otherRequiredFields,
                        ...exportDateFields
                    })
                    const response = await server.inject(request);
                    const error = { exportDate: exportDateErrorText };
                    expect(mockAddTransport).not.toHaveBeenCalled();
                    expect(response.statusCode).toBe(400);
                    expect(response.payload).toStrictEqual(JSON.stringify(error));
                });

                it(testText + '(302) for acceptHtml '+ url, async () => {
                    const request = createRequestObj(url, {...otherRequiredFields,
                        ...exportDateFields, ...{currentUri: '/uri'}
                    }, 'POST', true)
                    const response = await server.inject(request);
                    expect(mockAddTransport).not.toHaveBeenCalled();
                    expect(response.statusCode).toBe(302);
                });
            }

            it('returns 200 and doesnt fail when export date given in right format and within range of 1 day in future', async () => {

                const request = createRequestObj(url, {...otherRequiredFields,
                    ...{exportDate:moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransport).toHaveBeenCalled();
                expect(response.statusCode).toBe(200);
                expect(response.result).toEqual({some:'data'});
            });

            it(`returns 200 and doesnt fail when ${url}/saveAsDraft`, async () => {

                const request = createRequestObj(url+'/saveAsDraft', {...otherRequiredFields,
                    ...{dashboardUri: '/uri', exportDate:moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransportSaveAsDraft).toHaveBeenCalled();
                expect(response.statusCode).toBe(200);
                expect(response.result).toEqual({some:'data'});
            });

            it('returns 500 and fails when all required fields given and valid but is 500 Internal Error', async () => {

                mockAddTransport.mockRejectedValue(new Error('an error'));

                const request = createRequestObj(url, {...otherRequiredFields,
                    ...{exportDate:moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransport).toHaveBeenCalled();
                expect(response.statusCode).toBe(500);
                expect(response.result).toEqual(null);
            });

            it(`returns 500 and fails when all required fields given and valid but is 500 Internal Error when ${url}/saveAsDraft`, async () => {

                mockAddTransportSaveAsDraft.mockRejectedValue(new Error('an error'));

                const request = createRequestObj(url+'/saveAsDraft', {...otherRequiredFields,
                    ...{dashboardUri: '/uri', exportDate:moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransportSaveAsDraft).toHaveBeenCalled();
                expect(response.statusCode).toBe(500);
                expect(response.result).toEqual(null);
            });

           

           
        } // end of testing saveVehicleEndpointTestCases

        // transport/add cases with saveAsDraft

        it(`returns 200 and doesnt fail when we POST /v1/transport/add`, async () => {

            const request = createRequestObj('/v1/transport/add', {
                vehicle: "train"
            })

            const response = await server.inject(request);
            expect(mockSelectTransport).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some:'data'});
        });

        it(`returns 500 and FAILS when we POST /v1/transport/add`, async () => {

            mockSelectTransport.mockRejectedValue(new Error('an error'))

            const request = createRequestObj('/v1/transport/add', {
                vehicle: "train"
            })

            const response = await server.inject(request);
            expect(mockSelectTransport).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

        it(`returns 400 and FAILS when we POST /v1/transport/add without a vehicle`, async () => {

            const request = createRequestObj('/v1/transport/add', {})

            const response = await server.inject(request);
            expect(mockSelectTransport).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            const error = { vehicle: 'error.vehicle.any.required' }
            expect(response.payload).toStrictEqual(JSON.stringify(error));
        });

        it(`returns 200 and doesnt fail when we POST /v1/transport/add/saveAsDraft`, async () => {

            const request = createRequestObj('/v1/transport/add/saveAsDraft', {
                vehicle: "train",
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockSelectTransportSaveAsDraft).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some:'data'});
        });

        it(`returns 500 and FAILS when we POST /v1/transport/add/saveAsDraft`, async () => {

            mockSelectTransportSaveAsDraft.mockRejectedValue(new Error('an error'))

            const request = createRequestObj('/v1/transport/add/saveAsDraft', {
                vehicle: "train",
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockSelectTransportSaveAsDraft).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

        it(`returns 400 and FAILS when we POST /v1/transport/add/saveAsDraft without a vehicle`, async () => {

            const request = createRequestObj('/v1/transport/add/saveAsDraft', {
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockSelectTransportSaveAsDraft).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            const error = { vehicle: 'error.vehicle.any.required' }
            expect(response.payload).toStrictEqual(JSON.stringify(error));
        });

        it(`returns 302 and FAILS when we POST /v1/transport/add without a vehicle and acceptHtml`, async () => {

            const request = createRequestObj('/v1/transport/add', {
            }, 'POST', true)

            const response = await server.inject(request);
            expect(mockSelectTransport).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(302);
        });

        it(`returns 302 and FAILS when we POST /v1/transport/add/saveAsDraft without a vehicle and acceptHtml`, async () => {

            const request = createRequestObj('/v1/transport/add/saveAsDraft', {
            }, 'POST', true)

            const response = await server.inject(request);
            expect(mockSelectTransportSaveAsDraft).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(302);
        });

        // /v1/transport/truck/cmr (with saveAsDraft) cases

        it(`returns 200 and doesnt fail when we POST /v1/transport/truck/cmr`, async () => {

            const request = createRequestObj('/v1/transport/truck/cmr', {
                cmr: "xs"
            })

            const response = await server.inject(request);
            expect(mockAddTruckCMR).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some:'data'});
        });

        it(`returns 500 and FAILS when we POST /v1/transport/truck/cmr`, async () => {

            mockAddTruckCMR.mockRejectedValue(new Error('an error'))

            const request = createRequestObj('/v1/transport/truck/cmr', {
                cmr: "train"
            })

            const response = await server.inject(request);
            expect(mockAddTruckCMR).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

        it(`returns 400 and FAILS when we POST /v1/transport/truck/cmr without a cmr`, async () => {

            const request = createRequestObj('/v1/transport/truck/cmr', {})

            const response = await server.inject(request);
            expect(mockAddTruckCMR).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            const error = { cmr: 'error.cmr.any.required' }
            expect(response.payload).toStrictEqual(JSON.stringify(error));
        });

        it(`returns 302 and FAILS when we POST /v1/transport/truck/cmr without a cmr`, async () => {

            const request = createRequestObj('/v1/transport/truck/cmr', {
                dashboardUri: '/uri',
                currentUri: '/uri',
            }, 'POST', true)

            const response = await server.inject(request);
            expect(mockAddTruckCMR).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(302);
        });

        it(`returns 200 and doesnt fail when we POST /v1/transport/truck/cmr/saveAsDraft`, async () => {

            const request = createRequestObj('/v1/transport/truck/cmr/saveAsDraft', {
                cmr: "x",
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockAddTruckCMRSaveAsDraft).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some:'data'});
        });

        it(`returns 500 and FAILS when we POST /v1/transport/truck/cmr/saveAsDraft`, async () => {

            mockAddTruckCMRSaveAsDraft.mockRejectedValue(new Error('an error'))

            const request = createRequestObj('/v1/transport/truck/cmr/saveAsDraft', {
                cmr: "x",
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockAddTruckCMRSaveAsDraft).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

        it(`returns 400 and FAILS when we POST /v1/transport/truck/cmr/saveAsDraft without a cmr`, async () => {

            const request = createRequestObj('/v1/transport/truck/cmr/saveAsDraft', {
                dashboardUri: '/uri',
                currentUri: '/uri',
            })

            const response = await server.inject(request);
            expect(mockAddTruckCMRSaveAsDraft).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            const error = { cmr: 'error.cmr.any.required' }
            expect(response.payload).toStrictEqual(JSON.stringify(error));
        });

        it('returns 302 and FAILS when we POST /v1/transport/truck/cmr/saveAsDraft without a cmr', async () => {

            const request = createRequestObj('/v1/transport/truck/cmr/saveAsDraft', {
                dashboardUri: '/uri',
                currentUri: '/uri',
            }, 'POST', true)

            const response = await server.inject(request);
            expect(mockAddTruckCMRSaveAsDraft).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(302);
        });

        it(`returns 200 when we GET /v1/transport/details/{journey}`, async () => {

            const request = createRequestObj(`/v1/transport/details/storageNotes`, {}, 'GET')
            const response = await server.inject(request);
            expect(mockGetTransportDetails).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some: 'data'});
        });

        it(`returns 500 when we GET /v1/transport/details/{journey}`, async () => {

            mockGetTransportDetails.mockRejectedValue(new Error('an error'));

            const request = createRequestObj(`/v1/transport/details/storageNotes`, {}, 'GET')
            const response = await server.inject(request);
            expect(mockGetTransportDetails).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

    });
});
