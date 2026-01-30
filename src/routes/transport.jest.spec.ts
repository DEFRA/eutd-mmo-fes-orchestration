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
        verify: (_decoded: any, _req: any) => {
            return { isValid: true };
        },
    });

    server.auth.default("jwt");

    return server;
};

describe("transport routes", () => {

    let server: Hapi.Server<Hapi.ServerApplicationState>;

    const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";

    const document = {
        documentNumber: "GBR-2021-CC-3434343434"
    }

    beforeAll(async () => {
        server = await createServerInstance()
        const routes = new TransportRoutes();
        await routes.register(server);
        await server.initialize();
        await server.start();
    });

    afterAll(async () => {
        await server.stop();
    });

    describe("Transport endpoints", () => {

        let mockWithDocumentLegitimatelyOwned: jest.SpyInstance;
        let mockAddTransport: jest.SpyInstance;
        let mockAddTransportSaveAsDraft: jest.SpyInstance;
        let mockGetTransportDetails: jest.SpyInstance;
        let mockSelectTransport: jest.SpyInstance;
        let mockSelectTransportSaveAsDraft: jest.SpyInstance;
        let mockAddTruckCMR: jest.SpyInstance;
        let mockAddTruckCMRSaveAsDraft: jest.SpyInstance;

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

        function createRequestObj(url: string, additionalPayloadParams = {}, method = 'POST', acceptHtml = false) {
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
                    arrival: false,
                    nationalityOfVehicle: "x",
                    registrationNumber: "x",
                    departurePlace: "x",
                    departurePort: "x",
                    departureCountry: "x",
                    departureDate: '04/07/2024',
                    pointOfDestination: "Calais Port",
                    exportedTo: {
                      officialCountryName: "Nigeria",
                      isoCodeAlpha2: null,
                      isoCodeAlpha3: null,
                      isoNumericCode: null
                    }
                }
            },
            {
                url: '/v1/transport/plane/details',
                otherRequiredFields: {
                    arrival: false,
                    flightNumber: "x",
                    departurePlace: "x",
                    containerNumber: "x",
                    pointOfDestination: "Paris Airport",
                    exportedTo: {
                      officialCountryName: "Nigeria"
                    }
                }
            },
            {
                url: '/v1/transport/train/details',
                otherRequiredFields: {
                    arrival: false,
                    departurePlace: "x",
                    railwayBillNumber: "x",
                    pointOfDestination: "Brussels Station",
                    exportedTo: {
                      officialCountryName: "Nigeria",
                      isoCodeAlpha2: "",
                      isoCodeAlpha3: "x",
                      isoNumericCode: ""
                    }
                }
            },
            {
                url: '/v1/transport/containerVessel/details',
                otherRequiredFields: {
                    arrival: false,
                    vesselName: "x",
                    flagState: "x",
                    containerNumber: "ABCU1234567",
                    departurePlace: "x",
                    pointOfDestination: "Lagos Port",
                    exportedTo: {
                      officialCountryName: "Nigeria",
                      isoCodeAlpha2: undefined,
                      isoCodeAlpha3: undefined,
                      isoNumericCode: undefined
                    },
                    freightBillNumber: "x",
                }
            },
        ]

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
                    // pointOfDestination is always provided from otherRequiredFields, so only expect exportDate error
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

                const today = moment().format('DD/MM/YYYY');
                const tomorrowIso = moment().add(1, 'day').toISOString();
                
                const request = createRequestObj(url, {...otherRequiredFields,
                    ...{facilityArrivalDate: today, exportDate: today, exportDateTo: tomorrowIso}
                })
                const response = await server.inject(request);
                expect(mockAddTransport).toHaveBeenCalled();
                expect(response.statusCode).toBe(200);
                expect(response.result).toEqual({some:'data'});
            });

            it(`returns 200 and doesnt fail when ${url}/saveAsDraft`, async () => {

                const request = createRequestObj(url+'/saveAsDraft', {...otherRequiredFields,
                    ...{exportDate: moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransportSaveAsDraft).toHaveBeenCalled();
                expect(response.statusCode).toBe(200);
                expect(response.result).toEqual({some:'data'});
            });

            it(`returns 400 and does fail when ${url}/saveAsDraft`, async () => {

                const request = createRequestObj(url+'/saveAsDraft', {...otherRequiredFields,
                    ...{dashboardUrl: '/', exportDate: moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
                })
                const response = await server.inject(request);
                expect(mockAddTransportSaveAsDraft).not.toHaveBeenCalled();
                expect(response.statusCode).toBe(400);
                expect(response.result).toEqual({"dashboardUrl": "error.dashboardUrl.object.unknown"});
            });

            it('returns 500 and fails when all required fields given and valid but is 500 Internal Error', async () => {

                mockAddTransport.mockRejectedValue(new Error('an error'));

                const today = moment().format('DD/MM/YYYY');
                const tomorrowIso = moment().add(1, 'day').toISOString();
                
                const request = createRequestObj(url, {...otherRequiredFields,
                    ...{facilityArrivalDate: today, exportDate: today, exportDateTo: tomorrowIso}
                })
                const response = await server.inject(request);
                expect(mockAddTransport).toHaveBeenCalled();
                expect(response.statusCode).toBe(500);
                expect(response.result).toEqual(null);
            });

            it(`returns 500 and fails when all required fields given and valid but is 500 Internal Error when ${url}/saveAsDraft`, async () => {

                mockAddTransportSaveAsDraft.mockRejectedValue(new Error('an error'));

                const request = createRequestObj(url+'/saveAsDraft', {...otherRequiredFields,
                    ...{exportDate:moment().utc().format('DD/MM/YYYY'), exportDateTo: moment().startOf('day').add(1, "day").toISOString()}
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

        it(`returns 400 and FAILS when we POST /v1/transport/add without a vehicle with arrival=true`, async () => {

            const request = createRequestObj('/v1/transport/add', { arrival: true })

            const response = await server.inject(request);
            expect(mockSelectTransport).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            const error = { vehicle: 'error.arrivalVehicle.any.required' }
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

        it('returns 200 when we GET /v1/transport/details/{journey}', async () => {

            const request = createRequestObj(`/v1/transport/details/storageNotes`, {}, 'GET')
            const response = await server.inject(request);
            expect(mockGetTransportDetails).toHaveBeenCalled();
            expect(response.statusCode).toBe(200);
            expect(response.result).toEqual({some: 'data'});
        });

        it('returns 500 when we GET /v1/transport/details/{journey}', async () => {

            mockGetTransportDetails.mockRejectedValue(new Error('an error'));

            const request = createRequestObj(`/v1/transport/details/storageNotes`, {}, 'GET')
            const response = await server.inject(request);
            expect(mockGetTransportDetails).toHaveBeenCalled();
            expect(response.statusCode).toBe(500);
            expect(response.result).toEqual(null);
        });

        it('returns 200 when we POST an arrival /v1/transport/train/details', async () => {
            const request = createRequestObj(`/v1/transport/train/details`, { arrival: true, railwayBillNumber: "RAIL123", placeOfUnloading: "UK", departurePort: "Lexis Port", departureDate: "04/07/2024", departureCountry: "United Kingdom",  }, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({some: 'data'});
        });

        it('returns 400 when we POST an arrival with empty required strings /v1/transport/train/details', async () => {
            const body = {
              journey: "storageNotes",
              railwayBillNumber: "RAIL123",
              placeOfUnloading: "UK",
              freightBillNumber: "",
              departureCountry: "",
              departurePort: "",
              departureDate: "",
              vehicle:"train",
              arrival: true
            };

            const request = createRequestObj(`/v1/transport/train/details`, body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "departureCountry": "error.departureCountry.any.required",
                "departurePort": "error.departurePort.any.required",
                "departureDate": "error.departureDate.any.required"
            });
        });

        it('returns 400 when we POST an arrival /v1/transport/train/details', async () => {
            const request = createRequestObj(`/v1/transport/train/details`, { arrival: true, railwayBillNumber: 'QWERTYUIOPASDFGHJKLZXCVBNMOPQ' }, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
        });

        it('returns 200 when we POST an arrival /v1/transport/truck/details', async () => {
            const request = createRequestObj(`/v1/transport/truck/details`, { arrival: true, nationalityOfVehicle: "UK", departurePort: "Lexis Port", departureDate: "04/07/2024", departureCountry: "United Kingdom", registrationNumber: "Reg123", placeOfUnloading: "UK" }, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({some: 'data'});
        });

        it('returns 200 when we POST an arrival with all required fields /v1/transport/truck/details', async () => {
            const body = {
              journey: "storageNotes",
              nationalityOfVehicle: "UK",
              registrationNumber: "REG123",
              placeOfUnloading: "UK",
              freightBillNumber: "",
              departureCountry: "United Kingdom",
              departurePort: "Lexis Port",
              departureDate: "04/07/2024",
              vehicle:"truck",
              arrival: true
            };

            const request = createRequestObj(`/v1/transport/truck/details`, body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({some: 'data'});
        });

        it('returns 400 when we POST an arrival /v1/transport/truck/details', async () => {
            const request = createRequestObj(`/v1/transport/truck/details`, { arrival: true, registrationNumber: '@£$%^&*@($)@' }, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
        });

        it('returns 400 when we POST an arrival when departureDate is past today\'s date /v1/transport/truck/details', async () => {
            const body = {
              journey: "storageNotes",
              nationalityOfVehicle: "UK",
              registrationNumber: "ACA122", // required field
              freightBillNumber: "",
              departureCountry: "United Kingdom",
              departurePort: "Lucis Port",
              placeOfUnloading: "UK", // required field
              departureDate: moment().add(1, 'day').format('DD/MM/YYYY'),
              vehicle:"truck",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/truck/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "departureDate": "error.departureDate.date.max",
            });
        });

        it('returns 400 when we POST an arrival when registrationNumber and placeOfUnloading are past empty to /v1/transport/truck/details', async () => {
            const body = {
              journey: "storageNotes",
              nationalityOfVehicle: "",
              registrationNumber: "", // required field
              freightBillNumber: "",
              departureCountry: "",
              departurePort: "",
              placeOfUnloading: "", // required field
              departureDate: "",
              vehicle:"truck",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/truck/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "placeOfUnloading": "error.placeOfUnloading.any.required",
                "registrationNumber": "error.registrationNumber.string.empty",
                "departureCountry": "error.departureCountry.any.required",
                "departureDate": "error.departureDate.any.required",
                "departurePort": "error.departurePort.any.required",
                "nationalityOfVehicle": "error.nationalityOfVehicle.string.empty",
            });
        });

        it('returns 200 when we POST an arrival when departureDate is before or equal to today\'s date /v1/transport/truck/details', async () => {
            const body = {
              journey: "storageNotes",
              nationalityOfVehicle: "UK", // required field
              registrationNumber: "Ax2222", // required field
              freightBillNumber: "",
              departureCountry: "United Kingdom", // required field
              departurePort: "Lexis Port", // required field
              placeOfUnloading: "UK", // required field
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"truck",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/truck/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({ some: 'data' });
        });

        it('returns 400 when we POST an arrival when departureDate is past today\'s date /v1/transport/train/details', async () => {
            const body = {
              journey: "storageNotes",
              railwayBillNumber: "RAIL1111",
              freightBillNumber: "",
              departureCountry: "United Kingdom",
              departurePort: "London Port",
              placeOfUnloading: "UK",
              departureDate: moment().add(1, 'day').format('DD/MM/YYYY'),
              vehicle:"train",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/train/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
              departureDate: "error.departureDate.date.max"
            });
        });

        it('returns 400 when we POST an arrival when placeOfUnloading, railwayBillNumber and required arrival fields are empty /v1/transport/train/details', async () => {
            const body = {
              journey: "storageNotes",
              railwayBillNumber: "",
              freightBillNumber: "",
              departureCountry: "",
              departurePort: "",
              placeOfUnloading: "",
              departureDate: "",
              vehicle:"train",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/train/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "placeOfUnloading": "error.placeOfUnloading.any.required",
                "railwayBillNumber": "error.railwayBillNumber.string.empty",
                "departureCountry": "error.departureCountry.any.required",
                "departurePort": "error.departurePort.any.required",
                "departureDate": "error.departureDate.any.required"
            });
        });

        it('returns 200 when we POST an arrival when departureDate is before or equal to today\'s date /v1/transport/train/details', async () => {
            const body = {
              journey: "storageNotes",
              railwayBillNumber: "RAIL1111",
              freightBillNumber: "",
              departureCountry: "United Kingdom",
              departurePort: "London Port",
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"train",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/train/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({ some: 'data' });
        });

                it('returns 400 when we POST an arrival when departureDate is past today\'s date and vessel and place of unloading are empty /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "",
              flagState: "",
              freightBillNumber: "",
              containerNumbers: [],
              departureCountry: "",
              departurePort: "",
              placeOfUnloading: "",
              departureDate: moment().add(1, 'day').format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                departureDate: "error.departureDate.date.max",
                departureCountry: "error.departureCountry.any.required",
                departurePort: "error.departurePort.any.required",
                placeOfUnloading: "error.placeOfUnloading.any.required",
                vesselName: "error.vesselName.string.empty",
                flagState: "error.flagState.string.empty",
                "containerNumbers.0": "error.containerNumbers.array.min",
            });
        });

        it('returns 200 when we POST an arrival when departureDate is before or equal to today\'s date /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111", // required field
              flagState: "UK", // required field
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"], // required field
              placeOfUnloading: "UK", // required field
              departureDate: moment().format('DD/MM/YYYY'), // required field
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port", // required field
              departureCountry: "United Kingdom",  // required field
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({ some: 'data' });
        });

        // FI0-10290: Container vessel arrival transport flagState and containerNumbers validation tests
        it('returns 400 when flagState is empty for arrival container vessel transport /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111",
              flagState: "",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"],
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port",
              departureCountry: "United Kingdom",
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                flagState: "error.flagState.string.empty",
            });
        });

        it('returns 400 when containerNumbers is empty for arrival container vessel transport /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111",
              flagState: "UK",
              freightBillNumber: "",
              containerNumbers: [],
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port",
              departureCountry: "United Kingdom",
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "containerNumbers.0": "error.containerNumbers.array.min",
            });
        });

        it('returns 400 when flagState has invalid characters for arrival container vessel transport /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111",
              flagState: "@#$%^",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"],
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port",
              departureCountry: "United Kingdom",
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                flagState: "error.flagState.string.pattern.base",
            });
        });

        it('returns 400 when containerNumbers contains invalid characters for arrival container vessel transport /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111",
              flagState: "UK",
              freightBillNumber: "",
              containerNumbers: ["CONT@#$"],
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port",
              departureCountry: "United Kingdom",
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "containerNumbers.0": "error.containerNumbers.0.string.pattern.base",
            });
        });

        it('returns 400 when containerNumbers contains empty string for arrival container vessel transport /v1/transport/containerVessel/details', async () => {
            const body = {
              journey: "storageNotes",
              vesselName: "Vessel1111",
              flagState: "UK",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567", ""],
              placeOfUnloading: "UK",
              departureDate: moment().format('DD/MM/YYYY'),
              vehicle:"containerVessel",
              arrival: true,
              departurePort: "Lexis Port",
              departureCountry: "United Kingdom",
            };

            const request = createRequestObj('/v1/transport/containerVessel/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "containerNumbers.1": "error.containerNumbers.1.string.empty",
            });
        });

        it('returns 400 when we POST an arrival when departureDate is past today\'s date and flight number and place of unloading are empty /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "",
              freightBillNumber: "",
              containerNumbers: [],
              departureCountry: "",
              departurePort: "",
              departureDate: moment().add(1, 'day').format('DD/MM/YYYY'),
              placeOfUnloading: "",
              departurePlace: "",
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                flightNumber: "error.flightNumber.string.empty",
                "containerNumbers.0": "error.containerNumbers.array.min",
                departureCountry: "error.departureCountry.string.empty",
                departurePort: "error.departurePort.string.empty",
                placeOfUnloading: "error.placeOfUnloading.any.required",
                departureDate: "error.departureDate.date.max",
            });
        });

        it('returns 200 when we POST an arrival when departureDate is before or equal to today\'s date /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "FLIGHT1111",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"], // required field with ISO format
              departureCountry: "France", // required field
              departurePort: "Calais", // required field
              departureDate: moment().format('DD/MM/YYYY'), // required field
              placeOfUnloading: "UK", // required field
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(200);
            expect(mockAddTransport).toHaveBeenCalled();
            expect(response.result).toEqual({ some: 'data' });
        });

        it('returns 400 when containerNumbers is empty for arrival plane transport /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "FLIGHT1111",
              freightBillNumber: "",
              containerNumbers: [],
              departureCountry: "France",
              departurePort: "Calais",
              departureDate: moment().format('DD/MM/YYYY'),
              placeOfUnloading: "UK",
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                "containerNumbers.0": "error.containerNumbers.array.min"
            });
        });

        it('returns 400 when departureCountry is empty for arrival plane transport /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "FLIGHT1111",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"],
              departureCountry: "",
              departurePort: "Calais",
              departureDate: moment().format('DD/MM/YYYY'),
              placeOfUnloading: "UK",
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                departureCountry: "error.departureCountry.string.empty"
            });
        });

        it('returns 400 when departurePort is empty for arrival plane transport /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "FLIGHT1111",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"],
              departureCountry: "France",
              departurePort: "",
              departureDate: moment().format('DD/MM/YYYY'),
              placeOfUnloading: "UK",
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                departurePort: "error.departurePort.string.empty"
            });
        });

        it('returns 400 when departureDate is empty for arrival plane transport /v1/transport/plane/details', async () => {
            const body = {
              journey: "storageNotes",
              airwayBillNumber: "",
              flightNumber: "FLIGHT1111",
              freightBillNumber: "",
              containerNumbers: ["ABCU1234567"],
              departureCountry: "France",
              departurePort: "Calais",
              departureDate: "",
              placeOfUnloading: "UK",
              vehicle:"plane",
              arrival: true
            };

            const request = createRequestObj('/v1/transport/plane/details', body, 'POST')
            const response = await server.inject(request);
            expect(response.statusCode).toBe(400);
            expect(mockAddTransport).not.toHaveBeenCalled();
            expect(response.result).toEqual({
                departureDate: "error.departureDate.date.format"
            });
        });
    });
});
