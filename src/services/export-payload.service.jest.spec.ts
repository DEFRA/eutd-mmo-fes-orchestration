import axios from 'axios';
import logger from '../logger';

import { SessionStoreFactory } from "../session_store/factory";
import * as RedisSessionStore from "../session_store/redis";
import ExportPayloadService from "./export-payload.service";
import * as CatchCertService from "../persistence/services/catchCert";
import CatchCertificateTransportation  from "./catch-certificate-transport.service";
import { MockSessionStorage } from "../../test/session_store/mock";
import * as PayloadSchema from "../persistence/schema/frontEndModels/payload";
import { SessionLanding, SessionStore } from "../helpers/sessionManager";
import * as SessionManager from "../helpers/sessionManager";
import VesselLandingsRefresher from "./vesselLandingsRefresher.service";
import * as SystemBlocks from "../persistence/services/systemBlock";
import * as ReferenceDataService from '../services/reference-data.service';
import SummaryErrorsService from '../services/summaryErrors.service';
import { DocumentStatuses, LandingsEntryOptions, CatchCertificate } from '../persistence/schema/catchCert';
import { IExportCertificateResults } from '../persistence/schema/exportCertificateResults';
import * as crypto from "crypto";
import applicationConfig from '../applicationConfig';
import * as LandingsConsolidateService from "./landings-consolidate.service";
import * as pdfService from 'mmo-ecc-pdf-svc';
import * as EuCountriesService from './eu-countries.service';

const sinon = require('sinon');
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.setTimeout(30000);

let sandbox: any;

const sessionStore = sinon.stub(RedisSessionStore);

const sessionStoreFactory = sinon.stub(SessionStoreFactory, "getSessionStore");
sessionStoreFactory.returns(sessionStore);

beforeAll(() => {
  sandbox = sinon.createSandbox();
  sessionStore.readAllFor = () => exportPayload;
});

afterEach(() => {
  sandbox.restore();
});

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const CONTACT_ID = 'contactBob';
const PRODUCT_ID = "00a6687d-62e4-4e46-a3f2-P00000000001";

const exportPayload = {
  items: [
    {
      product: {
        id: PRODUCT_ID,
        commodityCode: '03044990',
        presentation: {
          code: 'FIL',
          label: 'Filleted'
        },
        state: {
          code: 'FRE',
          label: 'Fresh'
        },
        species: {
          code: 'BSS',
          label: 'European seabass (BSS)'
        }
      }
    }
  ]
};

describe('getItemByProductId', () => {

  let mockGetDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(CatchCertService, 'getExportPayload');
  });

  afterEach(() => {
    mockGetDraftData.mockRestore();
  });


  it('should return a product if it exists in the export payload', async () => {
    const expected = { items: [{ product: { id: PRODUCT_ID } }] };
    mockGetDraftData.mockReturnValue(expected);

    const product = await ExportPayloadService.getItemByProductId(USER_ID, PRODUCT_ID, undefined, CONTACT_ID);

    expect(product).not.toBeNull();
    expect(product['id']).toBe(PRODUCT_ID);
  });

  it('should return a product with doc number', async () => {
    const expected = { items: [{ product: { id: PRODUCT_ID } }] };
    mockGetDraftData.mockReturnValue(expected);

    await ExportPayloadService.getItemByProductId(USER_ID, PRODUCT_ID, 'GBR-34424342-32423423-234234', CONTACT_ID);

    expect(mockGetDraftData).toHaveBeenCalledWith("ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12", "GBR-34424342-32423423-234234", CONTACT_ID);
  });

  it('should error if there is no product in the export payload', async () => {
    const invalidId = "12345";
    const expected = { items: [{ product: { id: PRODUCT_ID } }] };
    mockGetDraftData.mockReturnValue(expected);

    await expect(ExportPayloadService.getItemByProductId(USER_ID, invalidId, undefined, CONTACT_ID))
      .rejects
      .toThrow(`[PRODUCT-NOT-FOUND][PRODUCT-ID:${invalidId}]`);
  });

  it('should throw product-not-found when exportPayload has no items (exportPayload?.items is falsy)', async () => {
    mockGetDraftData.mockReturnValue(null); // becomes {} after || {}; {}.items is undefined

    await expect(ExportPayloadService.getItemByProductId(USER_ID, PRODUCT_ID, undefined, CONTACT_ID))
      .rejects
      .toThrow(`[PRODUCT-NOT-FOUND][PRODUCT-ID:${PRODUCT_ID}]`);
  });

});

describe('get', () => {

  const vessel: PayloadSchema.Vessel = {
    pln: "test",
    vesselName: "WIRON 5",
    homePort: "Wigan",
    licenceNumber: "4324239423842384",
    licenceValidTo: "December",
    rssNumber: "4234234RF",
    vesselLength: 5,
    label: "test",
    domId: "test"
  }

  const landing: PayloadSchema.Landing = {
    id: "landing_id_test",
    numberOfSubmissions: 0,
    vessel: vessel,
    dateLanded: "01/01/2010",
    exportWeight: 5,
    faoArea: "TEST"
  }

  const sessionLanding: SessionLanding = {
    landingId: "landing_id_test",
    addMode: true,
    editMode: false,
    error: "missing PLN",
    errors: "test",
    modelCopy: landing,
    model: landing
  }

  const sessionStore: SessionStore = {
    documentNumber: "test",
    landings: [sessionLanding]
  }

  let mockGetDraftData: jest.SpyInstance;
  let mockGetSessionData: jest.SpyInstance;
  let mockGetDocNumber: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(CatchCertService, 'getExportPayload');
    mockGetSessionData = jest.spyOn(SessionManager, 'getCurrentSessionData');
    mockGetDocNumber = jest.spyOn(CatchCertService, 'getDraftCertificateNumber');
  });

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockGetSessionData.mockRestore();
    mockGetDocNumber.mockRestore();
  });

  it('should return payload data from draft data with given doc number', async function () {
    const expected = { someData: "data" };
    mockGetDraftData.mockReturnValue(expected);
    mockGetSessionData.mockReturnValue({ test: "test" });

    const result = await ExportPayloadService.get('User 1', 'GBR-8795678965-53435', CONTACT_ID);

    expect(result).toStrictEqual(expected);
    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', 'GBR-8795678965-53435', CONTACT_ID);
  });

  it('should return payload data from draft data', async function () {
    const expected = { someData: "data" };
    mockGetDraftData.mockReturnValue(expected);
    mockGetSessionData.mockReturnValue({ test: "test" });
    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result).toStrictEqual(expected);
    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', undefined, CONTACT_ID);

  });

  it('should retrieve related session data for landings and merge it into draft data', async () => {
    const exportPayload = {
      items: [
        {
          product: {
            id: "test_product1",
            commodityCode: '03044990',
            presentation: {
              code: 'FIL',
              label: 'Filleted'
            },
            state: {
              code: 'FRE',
              label: 'Fresh'
            },
            species: {
              code: 'BSS',
              label: 'European seabass (BSS)'
            }
          },
          landings: [{
            model: {
              id: "landing_id_test",
              vessel: {
                pln: "test",
                vesselName: "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }]
        }
      ]
    };

    const expected: PayloadSchema.LandingStatus = {
      addMode: true,
      editMode: false,
      error: "missing PLN",
      errors: "test",
      model: landing,
      modelCopy: landing
    };

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings[0]).toStrictEqual(expected);
  });

  it('should continue as normal if session landing does not exist', async () => {
    const exportPayload = {
      items: [
        {
          product: {
            id: "test_product1",
            commodityCode: '03044990',
            presentation: {
              code: 'FIL',
              label: 'Filleted'
            },
            state: {
              code: 'FRE',
              label: 'Fresh'
            },
            species: {
              code: 'BSS',
              label: 'European seabass (BSS)'
            }
          },
          landings: [{
            model: {
              id: "myTest",
              vessel: {
                pln: "test",
                vesselName: "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }]
        }
      ]
    };

    const expected = {
      model: {
        id: "myTest",
        vessel: vessel,
        dateLanded: "01/01/2010",
        exportWeight: 5,
        faoArea: "TEST"
      }
    };

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings[0]).toStrictEqual(expected);
  });

  it('should continue as normal if session has no landings', async () => {
    const exportPayload = {
      items: [
        {
          product: {
            id: "test_product1",
            commodityCode: '03044990',
            presentation: {
              code: 'FIL',
              label: 'Filleted'
            },
            state: {
              code: 'FRE',
              label: 'Fresh'
            },
            species: {
              code: 'BSS',
              label: 'European seabass (BSS)'
            }
          },
          landings: [{
            model: {
              id: "myTest",
              vessel: {
                pln: "test",
                vesselName: "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }]
        }
      ]
    };

    const expected = {
      model: {
        id: "myTest",
        vessel: vessel,
        dateLanded: "01/01/2010",
        exportWeight: 5,
        faoArea: "TEST"
      }
    };

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue({
      documentNumber: "test"
    });

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings[0]).toStrictEqual(expected);
  });

  it('should continue as normal if there is no landings at all', async () => {
    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings).toEqual(undefined);
  });

  it('P1/P2 optimization: getFromDraft should use provided draft and NOT call getExportPayload DB fetch', async () => {
    const providedDraft = {
      documentNumber: 'GBR-2020-CC-TEST123',
      exportData: {
        products: [{
          id: 'product-1',
          species: { label: 'COD', value: 'COD' },
          state: { label: 'FRE', value: 'FRE' },
          presentation: { label: 'WHL', value: 'WHL' },
          commodityCode: '03025110',
          caughtBy: [{
            id: 'landing-1',
            vessel: { label: 'WIRON 5 (PLN2674)', value: 'PLN2674' },
            faoArea: 'FAO27',
            dateLanded: '2020-01-01',
            exportWeight: 100
          }]
        }]
      }
    } as any as CatchCertificate;

    const mockGetExportPayload = jest.spyOn(CatchCertService, 'getExportPayload');
    mockGetSessionData.mockReturnValue({ landings: [] });

    const result = await ExportPayloadService.getFromDraft(providedDraft as any, 'User1', 'GBR-2020-CC-TEST123', CONTACT_ID);

    // Verify: getExportPayload was called with the provided draft (not fetching from DB)
    expect(mockGetExportPayload).toHaveBeenCalledWith('User1', 'GBR-2020-CC-TEST123', CONTACT_ID, providedDraft);
    // Verify: result contains expected data
    expect(result).toBeDefined();
    expect(result.items).toBeDefined();

    mockGetExportPayload.mockRestore();
  });

  it('P1/P2 optimization: getFromDraft should merge session data same as get method', async () => {
    const providedDraft = {
      exportData: {
        products: [{
          id: 'product-1',
          species: { label: 'COD', value: 'COD' },
          state: { label: 'FRE', value: 'FRE' },
          presentation: { label: 'WHL', value: 'WHL' },
          commodityCode: '03025110',
          caughtBy: [{
            id: 'landing-1',
            vessel: { label: 'WIRON 5 (PLN2674)', value: 'PLN2674' },
            faoArea: 'FAO27',
            dateLanded: '2020-01-01',
            exportWeight: 100
          }]
        }]
      }
    } as any as CatchCertificate;

    const sessionData = {
      landings: [{
        landingId: 'landing-1',
        addMode: true,
        editMode: false,
        error: null
      }]
    };

    const mockGetExportPayload = jest.spyOn(CatchCertService, 'getExportPayload');
    mockGetExportPayload.mockReturnValue({
      items: [{
        product: providedDraft.exportData.products[0],
        landings: [{
          model: {
            id: 'landing-1',
            vessel: { label: 'WIRON 5 (PLN2674)', value: 'PLN2674' },
            faoArea: 'FAO27',
            dateLanded: '2020-01-01',
            exportWeight: 100
          },
          addMode: false,
          editMode: false
        }]
      }]
    } as any);
    mockGetSessionData.mockReturnValue(sessionData);

    const result = await ExportPayloadService.getFromDraft(providedDraft as any, 'User1', 'DOC-123', CONTACT_ID);

    // Verify: session data was applied to landings
    expect(result.items[0].landings[0].addMode).toBe(true);
    expect(result.items[0].landings[0].editMode).toBe(false);

    mockGetExportPayload.mockRestore();
  });

  it('should retrieve multiple related session data for landings and merge it into draft data', async () => {
    const exportPayload: PayloadSchema.ProductsLanded = {
      items: [
        {
          product: {
            id: "test_product1",
            commodityCode: '03044990',
            presentation: {
              code: 'FIL',
              label: 'Filleted'
            },
            state: {
              code: 'FRE',
              label: 'Fresh'
            },
            species: {
              code: 'BSS',
              label: 'European seabass (BSS)'
            }
          },
          landings: [{
            model: {
              id: "landing_id_test",
              vessel: {
                pln: "test",
                vesselName: "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }, {
            model: {
              id: "landing_id_test2",
              vessel: {
                pln: "test",
                vesselName: "WIRON 2",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }]
        }
      ]
    };

    const vessel2: PayloadSchema.Vessel = {
      pln: "test",
      vesselName: "WIRON 2",
      homePort: "Wigan",
      licenceNumber: "4324239423842384",
      licenceValidTo: "December",
      rssNumber: "4234234RF",
      vesselLength: 5,
      label: "test",
      domId: "test"
    }

    const landing2: PayloadSchema.Landing = {
      id: "landing_id_test2",
      numberOfSubmissions: 0,
      vessel: vessel2,
      dateLanded: "01/01/2010",
      exportWeight: 5,
      faoArea: "TEST"
    }

    const sessionLanding2: SessionLanding = {
      landingId: "landing_id_test2",
      addMode: true,
      editMode: false,
      error: "missing PLN",
      errors: "test",
      modelCopy: landing2,
      model: landing2
    }

    const sessionStore: SessionStore = {
      documentNumber: "test",
      landings: [sessionLanding, sessionLanding2]
    }

    const expected: PayloadSchema.LandingStatus[] = [{
      addMode: true,
      editMode: false,
      error: "missing PLN",
      errors: "test",
      model: landing,
      modelCopy: landing
    }, {
      addMode: true,
      editMode: false,
      error: "missing PLN",
      errors: "test",
      model: landing2,
      modelCopy: landing2
    }];

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings).toStrictEqual(expected);
  });

  it('should return null as payload if no data payload is found', async function () {
    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(null);
    mockGetSessionData.mockReturnValue(null);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result).toBeNull();

    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', undefined, CONTACT_ID);
  });

  it('should return a payload with the landing from sessionLanding for an erroneous landings from MONGO', async () => {
    const exportPayload: PayloadSchema.ProductsLanded = {
      items: [{
        product: {
          id: "test_product_1",
          commodityCode: "some-commodity-code",
          species: {
            code: "COD",
            label: "Atlantic COD Fish"
          }
        },
        landings: [{
          model: {
            id: "landing_id_test",
            numberOfSubmissions: 0,
            vessel: {
              vesselName: "ADAM THOMAS",
              pln: "N/A"
            },
            faoArea: "FAO27",
            dateLanded: "Future Date",
            exportWeight: undefined
          },
          error: "invalid",
          errors: { error1: "error1", error2: "error2", error3: "error3" },
        }]
      }]
    };

    const landing: PayloadSchema.Landing = {
      id: "landing_id_test",
      numberOfSubmissions: 0,
      vessel: {
        vesselName: 'ADAM THOMAS',
        pln: "test"
      },
      dateLanded: "01/01/2010",
      exportWeight: 34,
      faoArea: "FAO27"
    }

    const sessionLanding: SessionLanding = {
      landingId: "landing_id_test",
      addMode: true,
      editMode: false,
      error: "invalid",
      errors: { error1: "error1", error2: "error2", error3: "error3" },
      modelCopy: landing,
      model: landing
    }

    const sessionStore: SessionStore = {
      documentNumber: "test",
      landings: [sessionLanding]
    }

    const expected: PayloadSchema.ProductsLanded = {
      items: [{
        product: {
          id: "test_product_1",
          commodityCode: "some-commodity-code",
          species: {
            code: "COD",
            label: "Atlantic COD Fish"
          }
        },
        landings: [{
          model: {
            id: "landing_id_test",
            numberOfSubmissions: 0,
            vessel: {
              vesselName: 'ADAM THOMAS',
              pln: "test"
            },
            dateLanded: "01/01/2010",
            exportWeight: 34,
            faoArea: "FAO27"
          },
          modelCopy: {
            id: "landing_id_test",
            numberOfSubmissions: 0,
            vessel: {
              vesselName: 'ADAM THOMAS',
              pln: "test"
            },
            dateLanded: "01/01/2010",
            exportWeight: 34,
            faoArea: "FAO27"
          },
          addMode: true,
          editMode: false,
          error: "invalid",
          errors: { error1: "error1", error2: "error2", error3: "error3" },
        }]
      }]
    }

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432");
    mockGetSessionData.mockReturnValue(sessionStore);
    mockGetDraftData.mockReturnValue(exportPayload);
    const result = await ExportPayloadService.get('Bob', undefined, CONTACT_ID);
    expect(result).toStrictEqual(expected);
  });

  it('should continue as normal if there is no session data', async () => {
    const exportPayload = {
      items: [
        {
          product: {
            id: "test_product1",
            commodityCode: '03044990',
            presentation: {
              code: 'FIL',
              label: 'Filleted'
            },
            state: {
              code: 'FRE',
              label: 'Fresh'
            },
            species: {
              code: 'BSS',
              label: 'European seabass (BSS)'
            }
          },
          landings: [{
            model: {
              id: "myTest",
              vessel: {
                pln: "test",
                vesselName: "WIRON 5",
                homePort: "Wigan",
                licenceNumber: "4324239423842384",
                licenceValidTo: "December",
                rssNumber: "4234234RF",
                vesselLength: 5,
                label: "test",
                domId: "test"
              },
              dateLanded: "01/01/2010",
              exportWeight: 5,
              faoArea: "TEST"
            }
          }]
        }
      ]
    };

    const expected = {
      model: {
        id: "myTest",
        vessel: vessel,
        dateLanded: "01/01/2010",
        exportWeight: 5,
        faoArea: "TEST"
      }
    };

    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432")
    mockGetDraftData.mockReturnValue(exportPayload);
    mockGetSessionData.mockReturnValue(undefined);

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    expect(result.items[0].landings[0]).toStrictEqual(expected);
  });

  it('should not merge session data when exportPayload has no items (exportPayload?.items is falsy)', async () => {
    mockGetDocNumber.mockReturnValue("GB-3423423-432423-432");
    mockGetDraftData.mockReturnValue({}); // no items property
    mockGetSessionData.mockReturnValue(sessionStore); // sessionStore has landings — truthy

    const result = await ExportPayloadService.get('User 1', undefined, CONTACT_ID);

    // sessionData?.landings is truthy but exportPayload?.items is undefined,
    // so the merge forEach is skipped and the bare {} is returned
    expect(result).toStrictEqual({});
  });

});

describe('getDirectLanding', () => {

  const vessel: PayloadSchema.Vessel = {
    pln: "test",
    vesselName: "WIRON 5",
    homePort: "Wigan",
    licenceNumber: "4324239423842384",
    licenceValidTo: "December",
    rssNumber: "4234234RF",
    vesselLength: 5,
    label: "test",
    domId: "test"
  }

  const landing: PayloadSchema.Landing = {
    id: "landing_id_test",
    numberOfSubmissions: 0,
    vessel: vessel,
    dateLanded: "01/01/2010",
    exportWeight: 5,
    faoArea: "TEST"
  }

  const sessionLanding: SessionLanding = {
    landingId: "landing_id_test",
    addMode: true,
    editMode: false,
    error: "missing PLN",
    errors: "test",
    modelCopy: landing,
    model: landing
  }

  const sessionStore: SessionStore = {
    documentNumber: "test",
    landings: [sessionLanding]
  }

  let mockGetDraftData: jest.SpyInstance;
  let mockGetSessionData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(CatchCertService, 'getDirectExportPayload');
    mockGetSessionData = jest.spyOn(SessionManager, 'getCurrentSessionData');
  });

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockGetSessionData.mockRestore();
  });

  it('should return payload data from draft data with given doc number', async function () {
    const expected = { someData: "data" };
    mockGetDraftData.mockReturnValue(expected);
    mockGetSessionData.mockReturnValue({ test: "test" });

    const result = await ExportPayloadService.getDirectLanding('User 1', 'GBR-8795678965-53435', CONTACT_ID);

    expect(result).toStrictEqual(expected);
    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', 'GBR-8795678965-53435', CONTACT_ID);
  });

  it('should return payload data from draft data', async function () {
    const expected = { someData: "data" };
    mockGetDraftData.mockReturnValue(expected);
    mockGetSessionData.mockReturnValue({ test: "test" });

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toStrictEqual(expected);
    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', undefined, CONTACT_ID);
  });

  it('should retrieve related session data for landings and merge it into draft data', async () => {
    const directLanding: PayloadSchema.DirectLanding = {
      id: "landing_id_test",
      vessel: {
        pln: "CA182",
        vesselName: "AWEL-Y-MOR",
        flag: "GBR",
        cfr: "GBR000B11999",
        homePort: "PORTHGAIN",
        licenceNumber: "22896",
        imoNumber: null,
        licenceValidTo: "2382-12-31T00:00:00",
        rssNumber: "B11999",
        vesselLength: 6.55,
        label: "AWEL-Y-MOR (CA182)",
        domId: "AWEL-Y-MOR-CA182"
      },
      dateLanded: "2020-10-10",
      faoArea: "FAO27",
      weights: [{
        speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
        exportWeight: 988
      }]
    };

    const expected: PayloadSchema.DirectLanding = {
      ...directLanding,
      error: "missing PLN",
      errors: "test"
    };

    mockGetDraftData.mockReturnValue(directLanding);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(mockGetSessionData).toHaveBeenCalledWith('User 1', undefined, CONTACT_ID);
    expect(result).toStrictEqual(expected);
  });

  it('should continue as normal if session landing does not exist', async () => {
    const directLanding: PayloadSchema.DirectLanding = {
      id: "id_test",
      vessel: {
        pln: "CA182",
        vesselName: "AWEL-Y-MOR",
        flag: "GBR",
        cfr: "GBR000B11999",
        homePort: "PORTHGAIN",
        licenceNumber: "22896",
        imoNumber: null,
        licenceValidTo: "2382-12-31T00:00:00",
        rssNumber: "B11999",
        vesselLength: 6.55,
        label: "AWEL-Y-MOR (CA182)",
        domId: "AWEL-Y-MOR-CA182"
      },
      dateLanded: "2020-10-10",
      faoArea: "FAO27",
      weights: [{
        speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
        exportWeight: 988
      }]
    };

    const expected: PayloadSchema.DirectLanding = {
      id: "id_test",
      vessel: {
        pln: "CA182",
        vesselName: "AWEL-Y-MOR",
        flag: "GBR",
        cfr: "GBR000B11999",
        homePort: "PORTHGAIN",
        licenceNumber: "22896",
        imoNumber: null,
        licenceValidTo: "2382-12-31T00:00:00",
        rssNumber: "B11999",
        vesselLength: 6.55,
        label: "AWEL-Y-MOR (CA182)",
        domId: "AWEL-Y-MOR-CA182"
      },
      dateLanded: "2020-10-10",
      faoArea: "FAO27",
      weights: [{
        speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
        exportWeight: 988
      }]
    };

    mockGetDraftData.mockReturnValue(directLanding);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toStrictEqual(expected);
  });

  it('should continue as normal if session has no landings', async () => {
    const directLanding: PayloadSchema.DirectLanding = {
      id: "id_test",
      vessel: {
        pln: "CA182",
        vesselName: "AWEL-Y-MOR",
        flag: "GBR",
        cfr: "GBR000B11999",
        homePort: "PORTHGAIN",
        licenceNumber: "22896",
        imoNumber: null,
        licenceValidTo: "2382-12-31T00:00:00",
        rssNumber: "B11999",
        vesselLength: 6.55,
        label: "AWEL-Y-MOR (CA182)",
        domId: "AWEL-Y-MOR-CA182"
      },
      dateLanded: "2020-10-10",
      faoArea: "FAO27",
      weights: [{
        speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
        exportWeight: 988
      }]
    };

    const expected: PayloadSchema.DirectLanding = {
      ...directLanding
    };

    mockGetDraftData.mockReturnValue(directLanding);
    mockGetSessionData.mockReturnValue({
      documentNumber: "test"
    });

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toStrictEqual(expected);
  });

  it('should continue as normal if there is no landings at all', async () => {
    mockGetDraftData.mockReturnValue(null);
    mockGetSessionData.mockReturnValue(sessionStore);

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toBeNull();
  });

  it('should return null as payload if no data payload is found', async function () {
    mockGetDraftData.mockReturnValue(null);
    mockGetSessionData.mockReturnValue(null);

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toBeNull();
    expect(mockGetDraftData).toHaveBeenCalledWith('User 1', undefined, CONTACT_ID);
  });

  it('should continue as normal if there is no session data', async () => {
    const directLanding: PayloadSchema.DirectLanding = {
      id: "id_test",
      vessel: {
        pln: "CA182",
        vesselName: "AWEL-Y-MOR",
        flag: "GBR",
        cfr: "GBR000B11999",
        homePort: "PORTHGAIN",
        licenceNumber: "22896",
        imoNumber: null,
        licenceValidTo: "2382-12-31T00:00:00",
        rssNumber: "B11999",
        vesselLength: 6.55,
        label: "AWEL-Y-MOR (CA182)",
        domId: "AWEL-Y-MOR-CA182"
      },
      dateLanded: "2020-10-10",
      faoArea: "FAO27",
      weights: [{
        speciesId: "GBR-2021-CC-8386AADB5-798bb990-9198-47c7-818f-f3309881f222",
        speciesLabel: "Atlantic cod (COD), Fresh, Filleted and skinned, 03044410",
        exportWeight: 988
      }]
    };

    const expected = {
      ...directLanding
    };

    mockGetDraftData.mockReturnValue(directLanding);
    mockGetSessionData.mockReturnValue(undefined);

    const result = await ExportPayloadService.getDirectLanding('User 1', undefined, CONTACT_ID);

    expect(result).toStrictEqual(expected);
  });

});

describe('upsertLanding', () => {

  let mockSessionData: jest.SpyInstance;
  const mockReadAllFor = jest.fn();
  const mockWriteAllFor = jest.fn();
  const mockSessionStore = new MockSessionStorage();
  mockSessionStore.readAllFor = mockReadAllFor;
  mockSessionStore.writeAllFor = mockWriteAllFor;

  let mockGetDraftData: jest.SpyInstance;
  let mockUpsertDraftData: jest.SpyInstance;

  beforeAll(() => {
    const mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue(mockSessionStore);
  });

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(CatchCertService, 'getExportPayload');
    mockUpsertDraftData = jest.spyOn(CatchCertService, 'upsertExportPayload');
    mockSessionData = jest.spyOn(SessionManager, 'getCurrentSessionData');
    mockReadAllFor.mockReset();
    mockWriteAllFor.mockReset();
  });

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockUpsertDraftData.mockRestore();
    mockSessionData.mockRestore();
  });


  it('will throw an error when vesselOverriddenByAdmin is true in the db', async () => {

    const productsLanded: PayloadSchema.ProductsLanded = {
      items: [
        {
          product: {
            id: 'productId',
            commodityCode: 'code',
            species: {
              code: 'COD',
              label: 'Cod'
            }
          },
          landings: [
            {
              model: {
                id: 'landingId',
                vessel: {
                  pln: 'pln',
                  vesselName: 'name',
                  vesselOverriddenByAdmin: true
                },
                exportWeight: 1000
              }
            }
          ]
        }
      ]
    };

    const landing = {
      model: {
        id: 'landingId',
        vessel: {
          pln: 'pln',
          vesselName: 'name'
        },
        exportWeight: 2000
      }
    };

    mockSessionData.mockReturnValue({});
    mockGetDraftData.mockReturnValue(productsLanded);
    mockUpsertDraftData.mockReturnValue(null);

    await expect(async () => ExportPayloadService.upsertLanding('productId', landing, 'Bob', 'GB-34324-34234-234234', CONTACT_ID))
      .rejects.toThrow('cannot update an overridden landing');

    expect(mockUpsertDraftData).not.toHaveBeenCalled();

  });

  it('will throw an error when vesselOverriddenByAdmin is true in the request', async () => {

    const productsLanded: PayloadSchema.ProductsLanded = {
      items: [
        {
          product: {
            id: 'productId',
            commodityCode: 'code',
            species: {
              code: 'COD',
              label: 'Cod'
            }
          },
          landings: [
            {
              model: {
                id: 'landingId',
                vessel: {
                  pln: 'pln',
                  vesselName: 'name'
                },
                exportWeight: 1000
              }
            }
          ]
        }
      ]
    };

    const landing = {
      model: {
        id: 'landingId',
        vessel: {
          pln: 'pln',
          vesselName: 'name',
          vesselOverriddenByAdmin: true
        },
        exportWeight: 2000
      }
    };

    mockSessionData.mockReturnValue({});
    mockGetDraftData.mockReturnValue(productsLanded);
    mockUpsertDraftData.mockReturnValue(null);

    await expect(async () => ExportPayloadService.upsertLanding('productId', landing, 'Bob', 'GB-34324-34234-234234', CONTACT_ID))
      .rejects.toThrow('cannot update an overridden landing');

    expect(mockUpsertDraftData).not.toHaveBeenCalled();

  });

  it('should save and return  payload data from draft data with a document number', async function () {
    const expected = { items: [{ "product": { "id": "someProdId" } }], model: { id: "test" } };
    mockSessionData.mockReturnValue({ test: "test" });
    mockReadAllFor.mockResolvedValue(expected);
    mockWriteAllFor.mockReturnValue(expected);
    mockGetDraftData.mockReturnValue(expected);
    mockUpsertDraftData.mockReturnValue(expected);

    await ExportPayloadService.upsertLanding('someProdId', expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GB-34324-34234-234234', CONTACT_ID);
  });

  it('should save and return  payload data from draft data', async function () {
    const expected = { items: [{ "product": { "id": "someProdId" } }], model: { id: "test" } };
    mockSessionData.mockReturnValue({ test: "test" });
    mockReadAllFor.mockResolvedValue(expected);
    mockWriteAllFor.mockReturnValue(expected);
    mockGetDraftData.mockReturnValue(expected);
    mockUpsertDraftData.mockReturnValue(expected);

    await ExportPayloadService.upsertLanding('someProdId', expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GB-34324-34234-234234', CONTACT_ID);
  });

  it('should save session data in REDIS', async () => {
    const expected = { items: [{ "product": { "id": "someProdId" } }], model: { id: "test" } };
    mockSessionData.mockReturnValue({ test: "test" });
    mockReadAllFor.mockResolvedValue(expected);
    mockWriteAllFor.mockReturnValue(expected);
    mockGetDraftData.mockReturnValue(expected);
    mockUpsertDraftData.mockReturnValue(expected);

    await ExportPayloadService.upsertLanding('someProdId', expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(mockReadAllFor).toHaveBeenCalledTimes(1);
    expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
  });

  it('should save data to REDIS if there are validation errors', async function () {
    const expected = { items: [{ "product": { "id": "someProdId" }, "landings": [{ "model": { "id": "test" } }] }], model: { id: "test" }, error: "test" };
    mockSessionData.mockReturnValue({ test: "test" });
    mockReadAllFor.mockResolvedValue(expected);
    mockWriteAllFor.mockReturnValue(expected);
    mockGetDraftData.mockReturnValue(expected);
    mockUpsertDraftData.mockReturnValue(expected);

    await ExportPayloadService.upsertLanding('someProdId', expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
  });

  it('should save data to REDIS with values from session data', async function () {
    const expected = { items: [{ "product": { "id": "someProdId" }, "landings": [{ "model": { "id": "test" } }] }], model: { id: "test" }, error: "test" };
    mockSessionData.mockReturnValue({ landings: [
      { "landingId": "test", addMode: false }
    ] });
    mockReadAllFor.mockResolvedValue(expected);
    mockWriteAllFor.mockReturnValue(expected);
    mockGetDraftData.mockReturnValue(expected);
    mockUpsertDraftData.mockReturnValue(expected);

    await ExportPayloadService.upsertLanding('someProdId', expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(mockWriteAllFor).toHaveBeenCalledTimes(1);
  });

  describe('POST ExportPayload to mongo with errors', () => {
    let mockCatchCertUpsertDraftData: jest.SpyInstance;

    beforeEach(() => {
      mockCatchCertUpsertDraftData = jest.spyOn(CatchCertService, 'upsertDraftData');
    });

    afterEach(() => {
      mockCatchCertUpsertDraftData.mockRestore();
    })

    it('should return a payload when exportWeight is a string', async function () {
      const newLanding = {
        model: {
          id: "someLandingId",
          vessel: {
            vesselName: "vesselLabel"
          },
          faoArea: "FAO27",
          dateLanded: "02/03/2020",
          exportWeight: "Hello World"
        },
        error: "invalid",
        errors: {
          exportWeight: "error.exportWeight.number.base"
        }
      };

      const expected = {
        items: [{
          product: {
            id: "someProdId",
            commodityCode: "03035410",
            presentation: {
              code: "WHL",
              label: "Whole"
            },
            state: {
              code: "FRO",
              label: "Frozen"
            },
            species: {
              code: "MAS",
              label: "Pacific chub mackerel (MAS)"
            }
          },
          landings: [{
            model: {
              id: "someLandingId",
              vessel: {
                label: "vesselLabel"
              },
              faoArea: "FA027",
              dateLanded: "02/03/2020",
              exportWeight: "Hello World",
              numberOfSubmissions: 0
            },
            editMode: true,
            error: "invalid",
            errors: {
              exportWeight: "error.exportWeight.number.base"
            }
          }]
        }]
      };

      const result = [{
        "species": "Pacific chub mackerel (MAS)",
        "speciesId": "someProdId",
        "speciesCode": "MAS",
        "commodityCode": "03035410",
        "state": {
          "code": "FRO",
          "name": "Frozen"
        },
        "presentation": {
          "code": "WHL",
          "name": "Whole"
        },
        "caughtBy": [{
          "vessel": "vesselLabel",
          "id": "someLandingId",
          "date": "02/03/2020",
          "faoArea": "FAO27",
          "numberOfSubmissions": 0
        }]
      }];

      mockSessionData.mockReturnValue({ test: "test" });
      mockGetDraftData.mockReturnValue(expected);
      mockCatchCertUpsertDraftData.mockReturnValue(null);
      mockReadAllFor.mockResolvedValue(expected);
      mockWriteAllFor.mockReturnValue(expected);

      await ExportPayloadService.upsertLanding('someProdId', newLanding, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

      expect(mockCatchCertUpsertDraftData).toHaveBeenCalledWith("Bob", 'GB-34324-34234-234234', {
        '$set': {
          'exportData.products': result
        }
      }, CONTACT_ID);
    });

    it('should return a payload when dateLanded is in the future', async function () {
      const newLanding = {
        model: {
          id: "someLandingId",
          vessel: {
            vesselName: "vesselLabel"
          },
          faoArea: "FAO27",
          dateLanded: "futureDate",
          exportWeight: 34
        },
        error: "invalid",
        errors: {
          dateLanded: "error.dateLanded.date.max"
        }
      };

      const expected = {
        items: [{
          product: {
            id: "someProdId",
            commodityCode: "03035410",
            presentation: {
              code: "WHL",
              label: "Whole"
            },
            state: {
              code: "FRO",
              label: "Frozen"
            },
            species: {
              code: "MAS",
              label: "Pacific chub mackerel (MAS)"
            }
          },
          landings: [{
            model: {
              id: "someLandingId",
              vessel: {
                label: "vesselLabel"
              },
              faoArea: "FAO27",
              dateLanded: "futureDate",
              exportWeight: 34,
              numberOfSubmissions: 0
            },
            editMode: true,
            error: "invalid",
            errors: {
              dateLanded: "error.dateLanded.date.max"
            }
          }]
        }]
      };

      const result = [{
        "species": "Pacific chub mackerel (MAS)",
        "speciesId": "someProdId",
        "speciesCode": "MAS",
        "commodityCode": "03035410",
        "state": {
          "code": "FRO",
          "name": "Frozen"
        },
        "presentation": {
          "code": "WHL",
          "name": "Whole"
        },
        "caughtBy": [{
          "vessel": "vesselLabel",
          "id": "someLandingId",
          "faoArea": "FAO27",
          "weight": 34,
          "numberOfSubmissions": 0
        }]
      }];

      mockSessionData.mockReturnValue({ test: "test" });
      mockGetDraftData.mockReturnValue(expected);
      mockCatchCertUpsertDraftData.mockReturnValue(null);
      mockReadAllFor.mockResolvedValue(expected);
      mockWriteAllFor.mockReturnValue(expected);

      await ExportPayloadService.upsertLanding('someProdId', newLanding, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

      expect(mockCatchCertUpsertDraftData).toHaveBeenCalledWith("Bob", 'GB-34324-34234-234234', {
        '$set': {
          'exportData.products': result
        }
      }, CONTACT_ID);
    });

    it('when using JS should return a payload when landing contains a vessel error', async function () {
      const newLanding = {
        model: {
          id: "someLandingId",
          vessel: {
            label: ""
          },
          faoArea: "FAO27",
          dateLanded: "02/02/2020",
          exportWeight: 34
        },
        error: "invalid",
        errors: {
          "vessel.vesselName": "error.vessel.vesselName.any.required"
        }
      };

      const expected = {
        items: [{
          product: {
            id: "someProdId",
            commodityCode: "03035410",
            presentation: {
              code: "WHL",
              label: "Whole"
            },
            state: {
              code: "FRO",
              label: "Frozen"
            },
            species: {
              code: "MAS",
              label: "Pacific chub mackerel (MAS)"
            }
          },
          landings: [{
            model: {
              id: "someLandingId",
              vessel: {
                label: ""
              },
              faoArea: "FAO27",
              dateLanded: "02/02/2020",
              exportWeight: 34,
              numberOfSubmissions: 0
            },
            editMode: true,
            error: "invalid",
            errors: {
              "vessel.vesselName": "error.vessel.vesselName.any.required"
            }
          }]
        }]
      };

      const result = [{
        "species": "Pacific chub mackerel (MAS)",
        "speciesId": "someProdId",
        "speciesCode": "MAS",
        "commodityCode": "03035410",
        "state": {
          "code": "FRO",
          "name": "Frozen"
        },
        "presentation": {
          "code": "WHL",
          "name": "Whole"
        },
        "caughtBy": [{
          "id": "someLandingId",
          "faoArea": "FAO27",
          "weight": 34,
          "date": "02/02/2020",
          "numberOfSubmissions": 0
        }]
      }];

      mockSessionData.mockReturnValue({ test: "test" });
      mockGetDraftData.mockReturnValue(expected);
      mockCatchCertUpsertDraftData.mockReturnValue(null);
      mockReadAllFor.mockResolvedValue(expected);
      mockWriteAllFor.mockReturnValue(expected);

      await ExportPayloadService.upsertLanding('someProdId', newLanding, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

      expect(mockCatchCertUpsertDraftData).toHaveBeenCalledWith("Bob", 'GB-34324-34234-234234', {
        '$set': {
          'exportData.products': result
        }
      }, CONTACT_ID);
    });

    it('when using NO JS should return a payload when landing contains a vessel error', async function () {
      const newLanding = {
        model: {
          id: "someLandingId",
          vessel: {
            label: ""
          },
          faoArea: "FAO27",
          dateLanded: "02/02/2020",
          exportWeight: 34
        },
        error: "invalid",
        errors: {
          "vessel.label": "error.vessel.label.any.empty"
        }
      };

      const expected = {
        items: [{
          product: {
            id: "someProdId",
            commodityCode: "03035410",
            presentation: {
              code: "WHL",
              label: "Whole"
            },
            state: {
              code: "FRO",
              label: "Frozen"
            },
            species: {
              code: "MAS",
              label: "Pacific chub mackerel (MAS)"
            }
          },
          landings: [{
            model: {
              id: "someLandingId",
              faoArea: "FAO27",
              dateLanded: "02/02/2020",
              exportWeight: 34,
              numberOfSubmissions: 0
            },
            editMode: true,
            error: "invalid",
            errors: {
              "vessel.label": "error.vessel.label.any.empty"

            }
          }]
        }]
      };

      const result = [{
        "species": "Pacific chub mackerel (MAS)",
        "speciesId": "someProdId",
        "speciesCode": "MAS",
        "commodityCode": "03035410",
        "state": {
          "code": "FRO",
          "name": "Frozen"
        },
        "presentation": {
          "code": "WHL",
          "name": "Whole"
        },
        "caughtBy": [{
          "id": "someLandingId",
          "faoArea": "FAO27",
          "weight": 34,
          "date": "02/02/2020",
          "numberOfSubmissions": 0
        }]
      }];

      mockSessionData.mockReturnValue({ test: "test" });
      mockGetDraftData.mockReturnValue(expected);
      mockCatchCertUpsertDraftData.mockReturnValue(null);
      mockReadAllFor.mockResolvedValue(expected);
      mockWriteAllFor.mockReturnValue(expected);

      await ExportPayloadService.upsertLanding('someProdId', newLanding, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

      expect(mockCatchCertUpsertDraftData).toHaveBeenCalledWith("Bob", 'GB-34324-34234-234234', {
        '$set': {
          'exportData.products': result
        }
      }, CONTACT_ID);

    });
  });

  it('should skip session-data merge and return payload with empty items when exportPayload has no items (exportPayload?.items is falsy)', async () => {
    mockGetDraftData.mockReturnValue({}); // no items property
    mockSessionData.mockReturnValue({ landings: [{ landingId: 'test', addMode: true }] });

    const result = await ExportPayloadService.upsertLanding('someProdId', { model: { id: 'newId' } }, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    // exportPayload?.items is undefined → forEach skipped; then !exportPayload.items sets items = []
    expect(result).toStrictEqual({ items: [] });
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('should replace an empty-slot landing when lnd.model?.id is undefined (second find path)', async () => {
    const existingPayload = {
      items: [{
        product: { id: 'someProdId' },
        landings: [{
          model: { id: undefined, numberOfSubmissions: 2 }
        }]
      }]
    };
    const newLanding = {
      model: { id: 'newLandingId', numberOfSubmissions: 0 },
      error: null,
      errors: null
    };
    mockGetDraftData.mockReturnValue(existingPayload);
    mockSessionData.mockReturnValue({ test: 'test' }); // no landings → sessionData?.landings falsy
    mockUpsertDraftData.mockReturnValue(null);
    mockReadAllFor.mockResolvedValue(existingPayload);
    mockWriteAllFor.mockReturnValue(existingPayload);

    const result = await ExportPayloadService.upsertLanding('someProdId', newLanding, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    // first find: lnd.model.id (undefined) !== 'newLandingId' → no match
    // second find: lnd.model?.id === undefined → true → empty slot found and replaced
    expect(result.items[0].landings[0].model.id).toBe('newLandingId');
    // numberOfSubmissions preserved from the empty slot
    expect(result.items[0].landings[0].model.numberOfSubmissions).toBe(2);
  });

});

describe('save', () => {

  let mockUpsertDraftData: jest.SpyInstance;
  let mockWithUserSessionDataStored: jest.SpyInstance;

  beforeAll(() => {
    mockWithUserSessionDataStored = jest.spyOn(SessionManager, 'withUserSessionDataStored');

    mockUpsertDraftData = jest.spyOn(CatchCertService, 'upsertExportPayload');
    mockUpsertDraftData.mockReturnValue(null);
  });

  afterAll(() => {
    mockUpsertDraftData.mockRestore();
    mockWithUserSessionDataStored.mockRestore();
  });

  it('should save and return payload data', async function () {
    const expected = {
      items: [{
        "product": {
          "id": "2095272b-9440-4b88-badb-e77fcdc57322",
          "commodityCode": "03035100",
          "presentation": {
            "code": "WHL",
            "label": "Whole"
          },
          "state": {
            "code": "FRO",
            "label": "Frozen"
          },
          "species": {
            "code": "HER",
            "label": "Atlantic herring (HER)"
          }
        },
        "landings": [{
          "model": {
            "id": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
            "vessel": {
              "pln": "YH4",
              "vesselName": "ALEXI ROSE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
          "addMode": false,
          "editMode": true,
          "modelCopy": {
            "id": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
            "vessel": {
              "pln": "YH4",
              "vesselName": "ALEXI ROSE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }, {
          "model": {
            "id": "739100be-077b-40ee-8feb-8524a6da355b",
            "vessel": {
              "pln": "K373",
              "vesselName": "AALSKERE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "739100be-077b-40ee-8feb-8524a6da355b",
          "addMode": false,
          "editMode": false,
          "modelCopy": {
            "id": "739100be-077b-40ee-8feb-8524a6da355b",
            "vessel": {
              "pln": "K373",
              "vesselName": "AALSKERE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }, {
          "model": {
            "id": "02195119-3e8c-448d-89f6-3e00956e6b5d",
            "vessel": {
              "pln": "BA817",
              "vesselName": "ACADEMUS"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "02195119-3e8c-448d-89f6-3e00956e6b5d",
          "addMode": false,
          "editMode": false,
          "modelCopy": {
            "id": "02195119-3e8c-448d-89f6-3e00956e6b5d",
            "vessel": {
              "pln": "BA817",
              "vesselName": "ACADEMUS"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }]
      }]
    }

    mockWithUserSessionDataStored.mockReturnValue(null);

    const result = await ExportPayloadService.save(expected, 'Bob', 'GB-34324-34234-234234', CONTACT_ID);

    expect(result).toStrictEqual(expected);
    expect(mockWithUserSessionDataStored).toHaveBeenCalledTimes(3);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', expected, 'GB-34324-34234-234234', CONTACT_ID);
    expect(mockUpsertDraftData).toHaveBeenCalledTimes(1);
  });

  it('should save with document number and return payload data', async function () {
    const expected = {
      items: [{
        "product": {
          "id": "2095272b-9440-4b88-badb-e77fcdc57322",
          "commodityCode": "03035100",
          "presentation": {
            "code": "WHL",
            "label": "Whole"
          },
          "state": {
            "code": "FRO",
            "label": "Frozen"
          },
          "species": {
            "code": "HER",
            "label": "Atlantic herring (HER)"
          }
        },
        "landings": [{
          "model": {
            "id": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
            "vessel": {
              "pln": "YH4",
              "vesselName": "ALEXI ROSE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
          "addMode": false,
          "editMode": true,
          "modelCopy": {
            "id": "ac9eb5a7-8778-4145-b927-46e67a2f54e0",
            "vessel": {
              "pln": "YH4",
              "vesselName": "ALEXI ROSE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }, {
          "model": {
            "id": "739100be-077b-40ee-8feb-8524a6da355b",
            "vessel": {
              "pln": "K373",
              "vesselName": "AALSKERE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "739100be-077b-40ee-8feb-8524a6da355b",
          "addMode": false,
          "editMode": false,
          "modelCopy": {
            "id": "739100be-077b-40ee-8feb-8524a6da355b",
            "vessel": {
              "pln": "K373",
              "vesselName": "AALSKERE"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }, {
          "model": {
            "id": "02195119-3e8c-448d-89f6-3e00956e6b5d",
            "vessel": {
              "pln": "BA817",
              "vesselName": "ACADEMUS"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          },
          "landingId": "02195119-3e8c-448d-89f6-3e00956e6b5d",
          "addMode": false,
          "editMode": false,
          "modelCopy": {
            "id": "02195119-3e8c-448d-89f6-3e00956e6b5d",
            "vessel": {
              "pln": "BA817",
              "vesselName": "ACADEMUS"
            },
            "faoArea": "FAO27",
            "dateLanded": "2020-02-17",
            "exportWeight": 23
          }
        }]
      }]
    }

    mockWithUserSessionDataStored.mockReturnValue(null);

    await ExportPayloadService.save(expected, 'Bob', 'GBR-34444-234423-23444', CONTACT_ID);

    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', expected, 'GBR-34444-234423-23444', CONTACT_ID);
  });
});

describe('createExportCerticate', () => {
  let stubGetBlockingStatus: any;
  let stubGetBlockingStatuses: any;
  let mockExportPayload: any;
  let mockGetExportPayload: jest.SpyInstance;
  let mockGetExportLocation: jest.SpyInstance;
  let mockGetDraft: jest.SpyInstance;
  let mockCheckCertificate: jest.SpyInstance;
  let mockReportDocumentSubmitted: jest.SpyInstance;
  let mockAddIsLegallyDue: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockIsOfflineValidation: jest.SpyInstance;
  let mockRefreshParallel: jest.SpyInstance;
  let mockRefreshSerial: jest.SpyInstance;
  let mockUpdateCertificateStatus: jest.SpyInstance;
  let mockSaveErrors: jest.SpyInstance;
  let mockSaveSystemErrors: jest.SpyInstance;
  let mockMapValidationFailure: jest.SpyInstance;
  let mockLoggerDebug: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;
  let mockClearSessionData: jest.SpyInstance;
  let mockUpdateConsolidateLandings: jest.SpyInstance;
  let mockSetCatchSubmissionInProgress: jest.SpyInstance;

  beforeAll(() => {
    const mockGetExporterDetails = jest.spyOn(CatchCertService, 'getExporterDetails');
    mockGetExportLocation = jest.spyOn(CatchCertService, 'getExportLocation');
    const mockGetCatchCertificateTransportDetails = jest.spyOn(CatchCertificateTransportation, 'getTransportationDetails');
    const mockGetConvservation = jest.spyOn(CatchCertService, 'getConservation');
    const mockCompleteDraft = jest.spyOn(CatchCertService, 'completeDraft');
    const mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');

    const mockGetLandingsRefreshData = jest.spyOn(VesselLandingsRefresher, 'getLandingsRefreshData');
    const mockRefresh = jest.spyOn(VesselLandingsRefresher, 'refresh');

    // FI0-11132: getDraft is now called explicitly in gatherExportInfo and Phase 2;
    // mockGetDraft is set up per-test in beforeEach so no setup needed here

    const mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem');
    mockSubmitToCatchSystem.mockResolvedValue(undefined);

    mockInvalidateDraftCache.mockResolvedValue(undefined);

    mockIsOfflineValidation = jest.spyOn(applicationConfig, 'isOfflineValidation');
    mockRefreshParallel = jest.spyOn(ExportPayloadService, 'performParallelRefresh');
    mockRefreshSerial = jest.spyOn(ExportPayloadService, 'performSerialRefresh');

    mockGetExportPayload = jest.spyOn(CatchCertService, 'getExportPayload');
    mockReportDocumentSubmitted = jest.spyOn(ReferenceDataService, 'reportDocumentSubmitted');
    mockAddIsLegallyDue = jest.spyOn(ReferenceDataService, 'addIsLegallyDue');

    const stubGeneratePdfAndUpload = sinon.stub(pdfService, 'generatePdfAndUpload');

    stubGetBlockingStatus = sinon.stub(SystemBlocks, 'getBlockingStatus');
    stubGetBlockingStatuses = sinon.stub(SystemBlocks, 'getBlockingStatuses');
    stubGetBlockingStatuses.resolves(new Map());

    mockGetExporterDetails.mockResolvedValue({
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterFullName: "Exporter one",
        exporterCompanyName: "company name",
        addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        buildingNumber: '123',
        subBuildingName: 'Unit 1',
        buildingName: 'CJC Fish Ltd',
        streetName: '17  Old Edinburgh Road',
        county: 'West Midlands',
        country: 'England',
        townCity: 'Aberdeen',
        postcode: 'AB1 2XX',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        },
        user_id: "",
        journey: "",
        currentUri: "",
        nextUri: ""
      }
    });

    mockGetExportLocation.mockResolvedValue({
      exportedFrom: "United Kingdom",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });

    mockGetCatchCertificateTransportDetails.mockResolvedValue({
      id: "0",
      vehicle: "directLanding"
    })

    jest.spyOn(CatchCertificateTransportation, 'getTransportations').mockResolvedValue([{
      id: "0",
      vehicle: "directLanding"
    }]);

    mockCompleteDraft.mockResolvedValue(null);

    mockGetLandingsRefreshData.mockReturnValue(null);
    mockRefresh.mockResolvedValue(null);
    stubGeneratePdfAndUpload.returns({
      uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
    });

    mockGetConvservation.mockResolvedValue({
      conservationReference: "UK Fisheries Policy",
      legislation: [
        "UK Fisheries Policy"
      ],
      caughtInUKWaters: "Y",
      user_id: "Test",
      currentUri: "Test",
      nextUri: "Test"
    });

    mockReportDocumentSubmitted.mockResolvedValue(null);
    mockAddIsLegallyDue.mockResolvedValue(undefined);
  });

  beforeEach(() => {
    mockExportPayload = {
      items: [
        {
          product: {
            id: "1de313bc-b310-478b-9e63-d24d54b88938",
            commodityCode: "03022980",
            presentation: {
              code: "GUT",
              label: "Gutted"
            },
            state: {
              code: "FRE",
              label: "Fresh"
            },
            species: {
              code: "PLE",
              label: "European plaice (PLE)"
            }
          },
          landings: [
            {
              model: {
                id: "5c05b3f0-509c-4403-a5cc-e8760815a51e",
                numberOfSubmissions: 0,
                vessel: {
                  pln: "LN129",
                  vesselName: "BOY STEVEN",
                  label: "BOY STEVEN (LN129)"
                },
                faoArea: "FAO27",
                dateLanded: "2020-02-14",
                exportWeight: 133
              }
            }
          ]
        }
      ]
    };

    // Ensure getDraft and other persistence methods never hit the real DB during these tests
    mockGetDraft = jest.spyOn(CatchCertService, 'getDraft');
    mockGetDraft.mockResolvedValue({
      exportData: {
        products: mockExportPayload.items.map(_i => ({ /* minimal back-end shape for safety */ })),
        transportations: [],
        exporterDetails: {},
        exportedFrom: {},
        exportedTo: {},
        landingsEntryOption: LandingsEntryOptions.UploadEntry
      }
    } as any);

    // Defensive mocks for methods that call findOneAndUpdate/findOne
    const mockCompleteDraft = jest.spyOn(CatchCertService, 'completeDraft');
    mockCompleteDraft.mockResolvedValue(null);
    const mockUpsertDraftData = jest.spyOn(CatchCertService, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(null as any);
    const mockUpsertExportPayload = jest.spyOn(CatchCertService, 'upsertExportPayload');
    mockUpsertExportPayload.mockResolvedValue(null as any);
    mockUpdateCertificateStatus = jest.spyOn(CatchCertService, 'updateCertificateStatus');
    mockUpdateCertificateStatus.mockResolvedValue(null);

    mockUpdateCertificateStatus = jest.spyOn(CatchCertService, 'updateCertificateStatus');
    mockUpdateCertificateStatus.mockResolvedValue(null);

    mockSaveErrors = jest.spyOn(SummaryErrorsService, 'saveErrors');
    mockSaveErrors.mockResolvedValue(null);

    mockSaveSystemErrors = jest.spyOn(SummaryErrorsService, 'saveSystemError');
    mockSaveSystemErrors.mockResolvedValue(null);

    mockMapValidationFailure = jest.spyOn(PayloadSchema, 'toFrontEndValidationFailure');
    mockClearSessionData = jest.spyOn(SessionManager, 'clearSessionDataForCurrentJourney');
    mockClearSessionData.mockResolvedValue(null);

    mockCheckCertificate = jest.spyOn(ExportPayloadService, 'checkCertificate');
    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: [
          "3D",
          "4A"
        ]
      }
      ],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    mockGetExportPayload.mockResolvedValue(mockExportPayload);

    mockedAxios.put.mockResolvedValueOnce(null);

    mockLoggerDebug = jest.spyOn(logger, 'debug');
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');

    mockRefreshParallel.mockResolvedValue(null);
    mockRefreshSerial.mockResolvedValue(null);
    mockUpdateConsolidateLandings = jest.spyOn(LandingsConsolidateService, 'updateConsolidateLandings');
    mockUpdateConsolidateLandings.mockResolvedValue(undefined);

    mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress');
    mockSetCatchSubmissionInProgress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    stubGetBlockingStatus.reset();
    stubGetBlockingStatuses.reset();
    stubGetBlockingStatuses.resolves(new Map());
    mockRefreshParallel.mockReset();
    mockRefreshSerial.mockReset();

    mockLoggerDebug.mockRestore();
    mockLoggerInfo.mockRestore();
    mockUpdateCertificateStatus.mockRestore();
    mockSaveErrors.mockRestore();

    mockClearSessionData.mockRestore();
    mockCheckCertificate.mockRestore();
    mockUpdateConsolidateLandings.mockRestore();

    mockSetCatchSubmissionInProgress.mockRestore();

    if (mockGetDraft) mockGetDraft.mockRestore();

    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  })

  it('should create an export certificate when CC_3c is true for an export with a matching species on a landing', async () => {
    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', false], ['CC_4a', false]]));

    const expected = {
      report: [],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    expect(result).toEqual(expected);
    expect(mockReportDocumentSubmitted).toHaveBeenCalled();
    expect(mockReportDocumentSubmitted).toHaveBeenCalledWith('/v1/catchcertificates/data-hub/submit', [{
      documentNumber: 'test-document-number',
      documentType: 'catchCertificates',
      createAt: '2020-02-14T00:00:00.000Z',
      extended: {
        species: "PLE",
        presentation: "GUT",
        state: "FRE"
      }
    }
    ]);
    expect(mockReportDocumentSubmitted).toHaveBeenCalledTimes(1);
    expect(mockUpdateConsolidateLandings).toHaveBeenCalled();
    expect(mockUpdateConsolidateLandings).toHaveBeenCalledTimes(1);
    expect(mockAddIsLegallyDue).toHaveBeenCalled();
    expect(mockAddIsLegallyDue).toHaveBeenCalledTimes(1);
  });

  it('passes exportedTo.exportedTo to isEuCountry when export location contains exportedTo property', async () => {
    // FI0-11132: getExportLocation is now called once in gatherExportInfo and the result is reused
    mockGetExportLocation.mockResolvedValueOnce({
      exportedFrom: 'United Kingdom',
      exportedTo: { officialCountryName: 'SPAIN', isoCodeAlpha2: 'ES', isoCodeAlpha3: 'A3', isoNumericCode: 'SP' }
    });

    const mockIsEu = jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(true);
    const mockCatchSubmit = jest.spyOn(ExportPayloadService, 'catchSubmissionForCC').mockResolvedValue(undefined as any);

    // Ensure blocking status allows submission path
    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    // Act
    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    // FI0-11132: submitToCatchIfEu is fire-and-forget, flush microtasks
    await new Promise(process.nextTick);

    // Assert: isEuCountry called with the isoCodeAlpha2 from exportedTo
    expect(mockIsEu).toHaveBeenCalledWith('ES');
    expect(mockCatchSubmit).toHaveBeenCalledWith('GBR-2020-CC-F9F69D192');

    // Cleanup
    mockIsEu.mockRestore();
    mockCatchSubmit.mockRestore();
  });

  it('should submit to EU CATCH when exportedTo is an EU country', async () => {
    // ensure exportedTo resolves to an EU country
    jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(true);
    const submitSpy = jest.spyOn(require('./reference-data.service'), 'submitToCatchSystem').mockResolvedValue(undefined);
    const setCatchSpy = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    // FI0-11132: submitToCatchIfEu is fire-and-forget, flush microtasks for nested async calls
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(setCatchSpy).toHaveBeenCalledWith('GBR-2020-CC-F9F69D192');
    expect(submitSpy).toHaveBeenCalledWith('GBR-2020-CC-F9F69D192', 'submit');
    submitSpy.mockRestore();
    setCatchSpy.mockRestore();
  });

  it('should NOT submit to EU CATCH when exportedTo is not an EU country', async () => {
    jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);
    const submitSpy = jest.spyOn(require('./reference-data.service'), 'submitToCatchSystem').mockResolvedValue(undefined);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(submitSpy).not.toHaveBeenCalled();
    submitSpy.mockRestore();
  });

  it('should pass exportedTo.exportedTo to isEuCountry when export location contains exportedTo property', async () => {
    // prepare spies
    const getLocSpy = jest.spyOn(CatchCertService, 'getExportLocation').mockResolvedValue({ exportedTo: { officialCountryName: 'Spain', isoCodeAlpha2: 'ES' }});
    const isEuSpy = jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(true);
    const submitSpy = jest.spyOn(require('./reference-data.service'), 'submitToCatchSystem').mockResolvedValue(undefined);
    const setCatchSpy = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress').mockResolvedValue(undefined);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(getLocSpy).toHaveBeenCalled();
    expect(isEuSpy).toHaveBeenCalledWith('ES');

    // cleanup
    submitSpy.mockRestore();
    isEuSpy.mockRestore();
    getLocSpy.mockRestore();
    setCatchSpy.mockRestore();
  });

  it('should not create an export certificate when CC_3c is true for an export without a matching species on a landing', async () => {

    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: [
          "3C",
          "3D",
          "4A"
        ]
      }
      ],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', false], ['CC_4a', false]]));

    const expected = {
      report: [{
        "date": new Date('2020-02-14T00:00:00.000Z'),
        "failures": [
          "3C",
        ],
        "presentation": "GUT",
        "species": "PLE",
        "state": "FRE",
        "vessel": "BOY STEVEN",
      }],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: ""
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    expect(result).toEqual(expected);
    expect(mockReportDocumentSubmitted).toHaveBeenCalled();
    expect(mockReportDocumentSubmitted).toHaveBeenCalledWith('/v1/catchcertificates/data-hub/submit', [{
      documentNumber: 'test-document-number',
      documentType: 'catchCertificates',
      createAt: '2020-02-14T00:00:00.000Z',
      extended: {
        species: "PLE",
        presentation: "GUT",
        state: "FRE"
      }
    }
    ]);
    expect(mockReportDocumentSubmitted).toHaveBeenCalledTimes(1);
    expect(mockAddIsLegallyDue).toHaveBeenCalled();
    expect(mockAddIsLegallyDue).toHaveBeenCalledTimes(1);
  });

  it('logs an error when email is missing for createExportCertificate', async () => {
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    // ensure flow proceeds past email check by stubbing downstream calls
    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);
    jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);
    const pdfSpy = jest.spyOn(pdfService, 'generatePdfAndUpload').mockResolvedValue({ uri: 'fake.pdf' } as any);
    const completeDraftSpy = jest.spyOn(CatchCertService, 'completeDraft').mockResolvedValue(undefined as any);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', null as any, CONTACT_ID).catch(() => { /* ignore thrown for test */ });

    expect(loggerSpy).toHaveBeenCalled();
    const calledWith = loggerSpy.mock.calls.find(call => call[0].includes('Missing email for user'));
    expect(calledWith).toBeDefined();

    pdfSpy.mockRestore();
    completeDraftSpy.mockRestore();
    loggerSpy.mockRestore();
  });

  it('should not create an export certificate when application fails on noDataSubmitted', async () => {

    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: ["noDataSubmitted"]
      }
      ],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', false], ['CC_4a', false]]));

    const expected = {
      report: [{
        "date": new Date('2020-02-14T00:00:00.000Z'),
        "failures": [
          "noDataSubmitted",
        ],
        "presentation": "GUT",
        "species": "PLE",
        "state": "FRE",
        "vessel": "BOY STEVEN",
      }],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: ""
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    expect(result).toEqual(expected);
  });

  describe('When processing the validation offline fails', () => {

    const expected = {
      report: [{
        "date": new Date('2020-02-14T00:00:00.000Z'),
        "failures": [
          "noDataSubmitted",
        ],
        "presentation": "GUT",
        "species": "PLE",
        "state": "FRE",
        "vessel": "BOY STEVEN",
      }],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: ""
    };

    beforeEach(() => {
      mockIsOfflineValidation.mockReturnValue(true);

      mockCheckCertificate.mockResolvedValue({
        report: [{
          species: "PLE",
          presentation: "GUT",
          state: "FRE",
          date: new Date("2020-02-14T00:00:00.000Z"),
          vessel: "BOY STEVEN",
          failures: ["noDataSubmitted"]
        }
        ],
        rawData: [{
          documentNumber: 'test-document-number',
          documentType: 'catchCertificates',
          createAt: '2020-02-14T00:00:00.000Z',
          extended: {
            species: "PLE",
            presentation: "GUT",
            state: "FRE"
          }
        }]
      });

      stubGetBlockingStatus.onCall(0).returns(true);
      stubGetBlockingStatus.onCall(1).returns(false);
      stubGetBlockingStatus.onCall(2).returns(false);
      stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', false], ['CC_4a', false]]));
    });

    it('should refresh landings in serial for offline validation', async () => {

      await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockIsOfflineValidation).toHaveBeenCalledTimes(1);
      expect(mockRefreshParallel).not.toHaveBeenCalled();
      expect(mockRefreshSerial).toHaveBeenCalled();
    });

    it('should update certificate status when document fails validation for an offline validation', async () => {
      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][UPDATED-STATUS][DRAFT]');
      expect(result).toEqual(expected);
    });

    it('should catch errors thrown whilst updating the status to DRAFT', async () => {
      const error: Error = new Error('some went wrong');

      mockUpdateCertificateStatus.mockRejectedValue(error);

      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerInfo).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][UPDATE-STATUS][DRAFT][ERROR], ${error}`);
      expect(result).toEqual(expected);
    });

    it("should call toFrontEndValidationFailure once with the right parameters if offline validation returns a validation failure", async () => {
      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockMapValidationFailure).toHaveBeenCalledTimes(1);
      expect(mockMapValidationFailure).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
    });

    it("should call saveErrors once if offline validation returns a validation failure", async () => {
      const failure: PayloadSchema.ValidationFailure[] = [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        rules: ["noDataSubmitted"]
      }]
      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockSaveErrors).toHaveBeenCalledTimes(1);
      expect(mockSaveErrors).toHaveBeenCalledWith('GBR-2020-CC-F9F69D192', failure);
      expect(result).toEqual(expected);
    });

    it('should catch errors thrown whilst saving validation results', async () => {
      const error: Error = new Error('some went wrong');

      mockSaveErrors.mockRejectedValue(error);

      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(mockSaveErrors).toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SAVE-ERRORS], ${error}`);
      expect(result).toEqual(expected);
    });

    it("should log the fact that createExportCertificate has failed and set the document to DRAFT", async () => {
      const error = new Error('an error has occurred');
      mockCheckCertificate.mockRejectedValue(error);

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SERVICE][ERROR][${error.stack}]`);
    });

    it("should log the fact that updateCertificateStatus failed", async () => {
      const error = new Error('an error has occurred');
      mockCheckCertificate.mockRejectedValue(error);
      mockUpdateCertificateStatus.mockRejectedValue(error);

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenNthCalledWith(1, `[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SERVICE][ERROR][${error.stack}]`);
      expect(mockLoggerDebug).not.toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][UPDATED-STATUS][DRAFT]');
      expect(mockLoggerError).toHaveBeenNthCalledWith(2, `[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][UPDATE-STATUS][DRAFT][ERROR], ${error}`);
    });

    it("should log the fact that saveErrors failed", async () => {
      const error = new Error('an error has occurred');
      mockCheckCertificate.mockRejectedValue(error);
      mockSaveSystemErrors.mockRejectedValue(error);

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockSaveSystemErrors).toHaveBeenCalledTimes(1);
      expect(mockSaveSystemErrors).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', {
        error: 'SYSTEM_ERROR'
      }, CONTACT_ID);
      expect(mockLoggerError).toHaveBeenNthCalledWith(1, `[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SERVICE][ERROR][${error.stack}]`);
      expect(mockLoggerError).toHaveBeenNthCalledWith(2, `[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SAVE-ERRORS], ${error}`);
    });

    it("should catch a log the stack of any errors thrown whilst getting blocked status", async () => {
      const error = new Error('an error has occurred');
      stubGetBlockingStatus.onCall(2).throws(error);
      stubGetBlockingStatuses.rejects(error);

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenCalledWith(`[GETTING-BLOCKING-STATUS-CC][ERROR][${error.stack}]`);
    });

    it("should catch a log any errors thrown whilst getting blocked status", async () => {
      const error = {
        message: 'an error has occurred'
      };
      stubGetBlockingStatus.onCall(2).throws(error);
      stubGetBlockingStatuses.rejects(error);

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenCalledWith(`[GETTING-BLOCKING-STATUS-CC][ERROR][${error}]`);
    });

    it("should throw with empty message when error has no message property (e?.message is undefined)", async () => {
      const error = {}; // no message, no stack properties
      stubGetBlockingStatus.onCall(2).throws(error);
      stubGetBlockingStatuses.rejects(error);

      // e?.message is undefined → new Error(undefined) is thrown → message is ""
      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow();

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenCalledWith(`[GETTING-BLOCKING-STATUS-CC][ERROR][${error}]`);
    });

    it("should save any errors thrown whilst setting status to DRAFT", async () => {
      const error = new Error('an error has occurred');
      stubGetBlockingStatus.onCall(2).throws(error);
      stubGetBlockingStatuses.rejects(error);
      mockUpdateCertificateStatus.mockRejectedValue(error)

      await expect(() => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toThrow('an error has occurred');

      expect(mockUpdateCertificateStatus).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', 'contactBob', 'DRAFT');
      expect(mockLoggerError).toHaveBeenNthCalledWith(3, `[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][UPDATE-STATUS][DRAFT][ERROR], ${error}`);
      expect(mockSaveSystemErrors).toHaveBeenCalledWith('Bob', 'GBR-2020-CC-F9F69D192', {
        error: 'SYSTEM_ERROR'
      }, CONTACT_ID);
    });
  });

  describe('When processing the validation offline passes', () => {

    beforeEach(() => {
      mockIsOfflineValidation.mockReturnValue(true);

      mockCheckCertificate.mockResolvedValue({
        report: [],
        rawData: [{
          documentNumber: 'test-document-number',
          documentType: 'catchCertificates',
          createAt: '2020-02-14T00:00:00.000Z',
          extended: {
            species: "PLE",
            presentation: "GUT",
            state: "FRE"
          }
        }]
      });
    });

    it("should not change status if clear session data errors", async () => {
      const expected = {
        report: [],
        isBlockingEnabled: true,
        documentNumber: "GBR-2020-CC-F9F69D192",
        uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
      }

      const error = new Error('an error has occurred');
      mockClearSessionData.mockRejectedValue(error);

      const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

      expect(await mockUpdateCertificateStatus).not.toHaveBeenCalledWith('GBR-2020-CC-F9F69D192', 'DRAFT');
      expect(await mockLoggerError).toHaveBeenCalledWith(`[CLEAR-SESSION-DATA][ERROR][${error}]`)
      expect(result).toEqual(expected);
    });
  })

  it('should gracefully handle SUBMIT event failure', async () => {
    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: []
      }
      ],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(true);
    stubGetBlockingStatus.onCall(2).returns(true);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', true], ['CC_4a', true]]));

    mockReportDocumentSubmitted.mockRejectedValue(new Error('error'));

    const expected = {
      report: [],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    expect(result).toEqual(expected);
    expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-CC-DOCUMENT-SUBMIT][GBR-2020-CC-F9F69D192][ERROR][Error: error]');
  });

  it('should gracefully handle SUBMIT landing consolidate failure', async () => {
    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: []
      }
      ],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(true);
    stubGetBlockingStatus.onCall(2).returns(true);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', true], ['CC_4a', true]]));

    mockUpdateConsolidateLandings.mockRejectedValue(new Error('error'));

    const expected = {
      report: [],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    expect(result).toEqual(expected);
    expect(mockLoggerError).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][GBR-2020-CC-F9F69D192][ERROR][Error: error]');
  });

  it('should increment the number of submissions for each landings on each product', async () => {

    mockCheckCertificate.mockResolvedValue({
      report: [{
        species: "PLE",
        presentation: "GUT",
        state: "FRE",
        date: new Date("2020-02-14T00:00:00.000Z"),
        vessel: "BOY STEVEN",
        failures: []
      }],
      rawData: [{
        documentNumber: 'test-document-number',
        documentType: 'catchCertificates',
        createAt: '2020-02-14T00:00:00.000Z',
        extended: {
          species: "PLE",
          presentation: "GUT",
          state: "FRE"
        }
      }]
    });

    stubGetBlockingStatus.onCall(0).returns(true);
    stubGetBlockingStatus.onCall(1).returns(true);
    stubGetBlockingStatus.onCall(2).returns(true);
    stubGetBlockingStatuses.resolves(new Map([['CC_3c', true], ['CC_3d', true], ['CC_4a', true]]));

    const expected = {
      report: [],
      isBlockingEnabled: true,
      documentNumber: "GBR-2020-CC-F9F69D192",
      uri: "_69642de5-e69a-4314-aef6-bda8e7ad67e8.pdf"
    };

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(result).toEqual(expected);
  });

  it('should refresh landings in parallel for online validation', async () => {
    mockIsOfflineValidation.mockReturnValue(false);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(mockIsOfflineValidation).toHaveBeenCalledTimes(1);
    expect(mockRefreshSerial).not.toHaveBeenCalled();
    expect(mockRefreshParallel).toHaveBeenCalled();
  });

  it('should catch, log, and rethrow any errors', async () => {

    const e = new Error('something went wrong');

    mockCheckCertificate.mockRejectedValue(e);

    await expect(async () => ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID)).rejects.toEqual(e);

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(`[CREATE-EXPORT-CERTIFICATE][GBR-2020-CC-F9F69D192][SERVICE][ERROR][${e.stack || e}]`);
  });

  it('should use empty object when exporter.model is null', async () => {
    const mockGetExporterDetails = jest.spyOn(CatchCertService, 'getExporterDetails');

    mockGetExporterDetails.mockResolvedValueOnce({
      model: null as any
    });

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(result).toBeDefined();
    expect(result.documentNumber).toBe('GBR-2020-CC-F9F69D192');
  });

  it('should use empty object when exporter.model is undefined', async () => {
    const mockGetExporterDetails = jest.spyOn(CatchCertService, 'getExporterDetails');

    mockGetExporterDetails.mockResolvedValueOnce({
      model: undefined as any
    });

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(result).toBeDefined();
    expect(result.documentNumber).toBe('GBR-2020-CC-F9F69D192');
  });

  it('should use empty array when transportations is not an array (null)', async () => {
    const mockGetTransportations = jest.spyOn(CatchCertificateTransportation, 'getTransportations');

    mockGetTransportations.mockResolvedValueOnce(null as any);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(result).toBeDefined();
    expect(result.documentNumber).toBe('GBR-2020-CC-F9F69D192');
  });

  it('should use empty array when transportations is a non-array object', async () => {
    const mockGetTransportations = jest.spyOn(CatchCertificateTransportation, 'getTransportations');

    mockGetTransportations.mockResolvedValueOnce({ invalid: 'data' } as any);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    const result = await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);

    expect(result).toBeDefined();
    expect(result.documentNumber).toBe('GBR-2020-CC-F9F69D192');
  });

  it('should not call isEuCountry and should log export location when exportLocation is null', async () => {
    const isEuSpy = jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);

    await (ExportPayloadService as any).submitToCatchIfEu('GBR-2020-CC-F9F69D192', null);

    expect(isEuSpy).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      '[SUBMIT-TO-CATCH-SYSTEM][GBR-2020-CC-F9F69D192][EXPORT-LOCATION][null]'
    );

    isEuSpy.mockRestore();
  });

  it('should log CHECK-EU-ERROR and not rethrow when isEuCountry check throws', async () => {
    const euError = new Error('EU country check failed');
    jest.spyOn(EuCountriesService, 'isEuCountry').mockRejectedValue(euError);

    await (ExportPayloadService as any).submitToCatchIfEu('GBR-2020-CC-F9F69D192', { exportedTo: { isoCodeAlpha2: 'ES' } });

    expect(mockLoggerError).toHaveBeenCalledWith(
      `[SUBMIT-TO-CATCH-SYSTEM][GBR-2020-CC-F9F69D192][CHECK-EU-ERROR][${euError}]`
    );
  });

  it('should call isEuCountry with the isoCodeAlpha2 extracted from an exportedTo object (line 403)', async () => {
    const isEuSpy = jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);

    await (ExportPayloadService as any).submitToCatchIfEu('GBR-2020-CC-F9F69D192', { exportedTo: { isoCodeAlpha2: 'FR', officialCountryName: 'France' } });

    expect(isEuSpy).toHaveBeenCalledWith('FR');

    isEuSpy.mockRestore();
  });

  it('should call isEuCountry with undefined when exportedTo is a legacy string (line 403)', async () => {
    const isEuSpy = jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);

    await (ExportPayloadService as any).submitToCatchIfEu('GBR-2020-CC-F9F69D192', { exportedTo: 'France' });

    // toExportedTo('France') returns { officialCountryName: 'France' } which has no isoCodeAlpha2
    expect(isEuSpy).toHaveBeenCalledWith(undefined);

    isEuSpy.mockRestore();
  });

  it('should log SET-CATCH-SUBMISSION-IN-PROGRESS error when setCatchSubmissionInProgress rejects during createExportCertificate', async () => {
    const error = new Error('setCatchSubmissionInProgress failed');
    mockSetCatchSubmissionInProgress.mockRejectedValue(error);
    jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(true);
    // FI0-11132: reset reportDocumentSubmitted to prevent leaking mockRejectedValue from prior test
    mockReportDocumentSubmitted.mockResolvedValue(null);

    stubGetBlockingStatus.onCall(0).returns(false);
    stubGetBlockingStatus.onCall(1).returns(false);
    stubGetBlockingStatus.onCall(2).returns(false);

    await ExportPayloadService.createExportCertificate('Bob', 'GBR-2020-CC-F9F69D192', 'foo@foo.com', CONTACT_ID);
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(mockLoggerError).toHaveBeenCalledWith(
      `[SET-CATCH-SUBMISSION-IN-PROGRESS][GBR-2020-CC-F9F69D192][ERROR][${error}]`
    );
  });
});

describe('updateCertificateStatus', () => {

  let mockServiceLayer: jest.SpyInstance;

  beforeEach(() => {
    mockServiceLayer = jest.spyOn(CatchCertService, 'updateCertificateStatus');
  });

  afterEach(() => {
    mockServiceLayer.mockRestore();
  });

  it('should call the service layer', async () => {
    mockServiceLayer.mockResolvedValue(null);

    await ExportPayloadService.updateCertificateStatus(USER_ID, 'test', CONTACT_ID, DocumentStatuses.Draft);

    expect(mockServiceLayer).toHaveBeenCalledWith("ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12", "test", "contactBob", "DRAFT");
  });

  it('should bubble up any errors', async () => {
    const error = new Error('an error occurred');

    mockServiceLayer.mockRejectedValue(error);

    await expect(async () => { await ExportPayloadService.updateCertificateStatus(USER_ID, 'test', CONTACT_ID, DocumentStatuses.Draft) }).rejects.toThrow(error);
  });

});

describe('getCertificateStatus', () => {

  let mockGetCertificateStatus: jest.SpyInstance;

  beforeEach(() => {
    mockGetCertificateStatus = jest.spyOn(CatchCertService, 'getCertificateStatus');
  });

  afterEach(() => {
    mockGetCertificateStatus.mockRestore();
  });

  it('should return the status of document', async () => {
    mockGetCertificateStatus.mockResolvedValue(DocumentStatuses.Locked);

    const result = await ExportPayloadService.getCertificateStatus('Bob', 'test', CONTACT_ID);

    expect(mockGetCertificateStatus).toHaveBeenCalledWith('Bob', 'test', CONTACT_ID);
    expect(result).toBe('LOCKED');
  })

  it('should catch any errors thrown', async () => {
    const error = new Error('error');

    mockGetCertificateStatus.mockRejectedValue(error);

    await expect(async () => { await ExportPayloadService.getCertificateStatus('Bob', 'test', CONTACT_ID) }).rejects.toThrow(error);
  });

});

describe('isSubmissionFailure', () => {

  const validationResults: IExportCertificateResults = {
    documentNumber: 'documentNumber',
    uri: 'uri',
    report: [{
      failures: ['3C', '3D', '4A'],
      state: 'test',
      species: 'test',
      presentation: 'test',
      vessel: 'test',
      date: new Date('2019-11-25')
    }],
    isBlockingEnabled: true
  }

  it('will return true if the report has items and blocking is not enabled', async () => {
    expect(ExportPayloadService.isSubmissionFailure(validationResults)).toBe(true);
  });

  it('will return false if blocking is not enabled', async () => {
    expect(ExportPayloadService.isSubmissionFailure({ ...validationResults, isBlockingEnabled: false })).toBe(false);
  });

  it('will return false if the report has no items', async () => {
    expect(ExportPayloadService.isSubmissionFailure({ ...validationResults, report: [] })).toBe(false);
  });

});

describe('getCertificateHash', () => {

  const userPrincipal = "a User Id";
  const documentNumber = "a document number";
  const mockCertificateData = { some: "data" };
  const mockValidHash = crypto.createHash('sha1')
    .update(JSON.stringify(mockCertificateData))
    .digest('base64') as string;
  let mockGetCertificate: jest.SpyInstance;

  beforeAll(() => {
    mockGetCertificate = jest.spyOn(ExportPayloadService, 'get');
    mockGetCertificate.mockResolvedValue(mockCertificateData);
  });

  afterAll(() => {
    jest.clearAllMocks();

  });

  it('should call get certificate method once with the right arguments', async () => {
    await ExportPayloadService.getCertificateHash(userPrincipal, documentNumber, CONTACT_ID);

    expect(mockGetCertificate).toHaveBeenCalledTimes(1)
    expect(mockGetCertificate).toHaveBeenCalledWith(userPrincipal, documentNumber, CONTACT_ID)

  });

  it('should return valid certificate hash', async () => {
    const result = await ExportPayloadService.getCertificateHash(userPrincipal, documentNumber, CONTACT_ID);

    expect(result).toEqual(mockValidHash);
  });
});

describe('performRefresh', () => {
  let mockRefreshData: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;

  beforeEach(() => {
    mockRefreshData = jest.spyOn(VesselLandingsRefresher, 'refresh');
    mockRefreshData.mockResolvedValue(null);

    mockLoggerInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockRefreshData.mockRestore();
    mockLoggerInfo.mockRestore();
  });

  it('should call vessel landings refresher for serial refreshes', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          }
        }
      }]
    }];

    await ExportPayloadService.performSerialRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: false]');
  });

  it('should call vessel landings refresher for serial refreshes with a true legally due', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true
        }
      }]
    }];

    await ExportPayloadService.performSerialRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for serial refreshes with a true legally due for multiple landings with at least one legally due landing', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true,
          exportWeight: 51
        }
      },{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false,
          exportWeight: 49
        }
      }]
    }];

    await ExportPayloadService.performSerialRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for serial refreshes with a true legally due for multiple landings with different products with at least one legally due landing', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true,
          exportWeight: 51
        }
      }]
    },{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'HER',
          label: 'Atlantic Herring'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false,
          exportWeight: 49
        }
      }]
    }];

    await ExportPayloadService.performSerialRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for serial refreshes with mutiple landings with differing landings', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-20',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true,
          exportWeight: 51
        }
      }]
    },{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'HER',
          label: 'Atlantic Herring'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false,
          exportWeight: 49
        }
      }]
    }];

    await ExportPayloadService.performSerialRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-20, IS-LEGALLY-DUE: true]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-SERIAL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: false]');
  });

  it('should call vessel landings refresher for parallel refreshes', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          }
        }
      }]
    }];

    await ExportPayloadService.performParallelRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: false]');
  });

  it('should call vessel landings refresher for parallel refreshes with a true legally due', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true
        }
      }]
    }];

    await ExportPayloadService.performParallelRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for parallel refreshes with a true legally due for multiple landings with at least one legally due landing', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true
        }
      }, {
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false
        }
      }]
    }];

    await ExportPayloadService.performParallelRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for parallel refreshes with a true legally due for multiple landings with different products with at least one legally due landing', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true,
          exportWeight: 51
        }
      }]
    },{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'HER',
          label: 'Atlantic Herring'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false,
          exportWeight: 49
        }
      }]
    }];

    await ExportPayloadService.performParallelRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: true]');
  });

  it('should call vessel landings refresher for parallel refreshes with mutiple landings with differing landings', async () => {
    const productLanded: PayloadSchema.ProductLanded[] = [{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'COD',
          label: 'Atlantic Cod'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-20',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: true,
          exportWeight: 51
        }
      }]
    },{
      product: {
        commodityCode: '0123456',
        id: 'id',
        species: {
          code: 'HER',
          label: 'Atlantic Herring'
        }
      },
      landings: [{
        model: {
          id: '',
          dateLanded: '2023-03-19',
          vessel: {
            pln: 'PH100',
            vesselName: 'WIRON 5'
          },
          isLegallyDue: false,
          exportWeight: 49
        }
      }]
    }];

    await ExportPayloadService.performParallelRefresh('DOC-CC-123', productLanded);

    expect(mockRefreshData).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-20, IS-LEGALLY-DUE: true]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[CREATE-EXPORT-CERTIFICATE][DOC-CC-123][SERVICE][REFRESHING-LANDING-PARALLEL][PLN: PH100, DATE: 2023-03-19, IS-LEGALLY-DUE: false]');
  });
});

describe('getLandingsToRefresh', () => {

  let mockGetLandingsRefreshData: jest.SpyInstance;

  beforeAll(() => {
    mockGetLandingsRefreshData = jest.spyOn(VesselLandingsRefresher, 'getLandingsRefreshData');
  });

  afterEach(() => {
    mockGetLandingsRefreshData.mockReset();
  })

  it('will return an empty array if there are no products landed', () => {
    const result = ExportPayloadService.getLandingsToRefresh([]);

    expect(result).toStrictEqual([]);
  });

  it('will call getLandingsRefreshData with the landings of every product', () => {
    const products: PayloadSchema.ProductLanded[] = [
      { product: { id: '', commodityCode: '', species: { code: 'COD', label: 'Atlantic cod (COD)'} }, landings: [{ model: { id: 'landing 1 '}}] },
      { product: { id: '', commodityCode: '', species: { code: 'HER', label: 'Atlantic herring (HER)'} }, landings: [{ model: { id: 'landing 1 '}}, { model: { id: 'landing 2 '}}] }
    ];

    mockGetLandingsRefreshData.mockReturnValue([]);

    ExportPayloadService.getLandingsToRefresh(products);

    expect(mockGetLandingsRefreshData).toHaveBeenCalledTimes(2);
    expect(mockGetLandingsRefreshData).toHaveBeenNthCalledWith(1, [{ model: { id: 'landing 1 '}}]);
    expect(mockGetLandingsRefreshData).toHaveBeenNthCalledWith(2, [{ model: { id: 'landing 1 '}}, { model: { id: 'landing 2 '}}]);
  });

  it('will return all unique landings to refresh', () => {
    const products: PayloadSchema.ProductLanded[] = [
      { product: { id: '', commodityCode: '', species: { code: 'COD', label: 'Atlantic cod (COD)'} }, landings: [{ model: { id: 'landing 1 '}}] },
      { product: { id: '', commodityCode: '', species: { code: 'HER', label: 'Atlantic herring (HER)'} }, landings: [{ model: { id: 'landing 1 '}}, { model: { id: 'landing 2 '}}] }
    ];

    mockGetLandingsRefreshData.mockReturnValueOnce([
      { pln: 'wiron 5', dateLanded: '2020-01-01' }
    ]);
    mockGetLandingsRefreshData.mockReturnValueOnce([
      { pln: 'wiron 5', dateLanded: '2020-01-01' },
      { pln: 'wiron 5', dateLanded: '2020-01-02' }
    ]);

    const result = ExportPayloadService.getLandingsToRefresh(products);

    expect(result).toStrictEqual([
      { pln: 'wiron 5', dateLanded: '2020-01-01', isLegallyDue: false },
      { pln: 'wiron 5', dateLanded: '2020-01-02', isLegallyDue: false }
    ]);
  });

  it('will return all landings with correct legally due status', () => {
    const products: PayloadSchema.ProductLanded[] = [
      { product: { id: '', commodityCode: '', species: { code: 'COD', label: 'Atlantic cod (COD)'} }, landings: [{ model: { id: 'landing 1 '}}] },
      { product: { id: '', commodityCode: '', species: { code: 'HER', label: 'Atlantic herring (HER)'} }, landings: [{ model: { id: 'landing 1 '}}, { model: { id: 'landing 2 '}}] }
    ];

    mockGetLandingsRefreshData.mockReturnValueOnce([
      { pln: 'wiron 5', dateLanded: '2020-01-01', isLegallyDue: true }
    ]);

    mockGetLandingsRefreshData.mockReturnValueOnce([
      { pln: 'wiron 5', dateLanded: '2020-01-01', isLegallyDue: false },
      { pln: 'wiron 5', dateLanded: '2020-01-02' }
    ]);

    const result = ExportPayloadService.getLandingsToRefresh(products);

    expect(result).toStrictEqual([
      { pln: 'wiron 5', dateLanded: '2020-01-01', isLegallyDue: true },
      { pln: 'wiron 5', dateLanded: '2020-01-02', isLegallyDue: false }
    ]);
  });

});

// FI0-11132: catchSubmissionForCC now accepts landingsEntryOption as a parameter
describe('catchSubmissionForCC', () => {
  const DOCUMENT_NUMBER = 'GBR-2020-CC-TEST123';

  let mockSubmitToCatchSystem: jest.SpyInstance;
  let mockSetCatchSubmissionInProgress: jest.SpyInstance;

  beforeEach(() => {
    mockSubmitToCatchSystem = jest.spyOn(ReferenceDataService, 'submitToCatchSystem');
    mockSubmitToCatchSystem.mockResolvedValue(undefined);
    mockSetCatchSubmissionInProgress = jest.spyOn(CatchCertService, 'setCatchSubmissionInProgress');
    mockSetCatchSubmissionInProgress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // FI0-11243: all landing entry types submit to EU CATCH — no filtering by entry type
  it('should call setCatchSubmissionInProgress and submitToCatchSystem', async () => {
    await ExportPayloadService.catchSubmissionForCC(DOCUMENT_NUMBER);

    expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(DOCUMENT_NUMBER);
    expect(mockSubmitToCatchSystem).toHaveBeenCalledWith(DOCUMENT_NUMBER, 'submit');
  });

  it('should handle errors from submitToCatchSystem gracefully', async () => {
    mockSubmitToCatchSystem.mockRejectedValue(new Error('submission failed'));

    // Should not throw - errors are caught and logged
    await expect(ExportPayloadService.catchSubmissionForCC(DOCUMENT_NUMBER)).resolves.not.toThrow();

    expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(DOCUMENT_NUMBER);
    expect(mockSubmitToCatchSystem).toHaveBeenCalledWith(DOCUMENT_NUMBER, 'submit');
  });

  it('should still call submitToCatchSystem when setCatchSubmissionInProgress fails', async () => {
    mockSetCatchSubmissionInProgress.mockRejectedValue(new Error('set in progress failed'));

    await expect(ExportPayloadService.catchSubmissionForCC(DOCUMENT_NUMBER)).resolves.not.toThrow();
    await Promise.resolve();

    expect(mockSetCatchSubmissionInProgress).toHaveBeenCalledWith(DOCUMENT_NUMBER);
    expect(mockSubmitToCatchSystem).toHaveBeenCalledWith(DOCUMENT_NUMBER, 'submit');
  });

  it('should log error when setCatchSubmissionInProgress rejects', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');
    mockSetCatchSubmissionInProgress.mockRejectedValue(new Error('db write failed'));

    await ExportPayloadService.catchSubmissionForCC(DOCUMENT_NUMBER);
    await new Promise(process.nextTick);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[SET-CATCH-SUBMISSION-IN-PROGRESS][${DOCUMENT_NUMBER}][ERROR]`)
    );

    loggerErrorSpy.mockRestore();
  });

  it('should log error when submitToCatchSystem rejects', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');
    mockSubmitToCatchSystem.mockRejectedValue(new Error('submit failed'));

    await ExportPayloadService.catchSubmissionForCC(DOCUMENT_NUMBER);
    await new Promise(process.nextTick);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[SUBMIT-TO-CATCH-SYSTEM][${DOCUMENT_NUMBER}][ERROR]`)
    );

    loggerErrorSpy.mockRestore();
  });
});

describe('saveSystemError', () => {
  const USER_PRINCIPAL = 'test-user';
  const DOCUMENT_NUMBER = 'GBR-2020-CC-TEST123';

  let mockUpdateCertificateStatus: jest.SpyInstance;
  let mockSaveSystemError: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    mockUpdateCertificateStatus = jest.spyOn(CatchCertService, 'updateCertificateStatus');
    mockSaveSystemError = jest.spyOn(SummaryErrorsService, 'saveSystemError');
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update certificate status to DRAFT', async () => {
    mockUpdateCertificateStatus.mockResolvedValue(null);
    mockSaveSystemError.mockResolvedValue(undefined);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockUpdateCertificateStatus).toHaveBeenCalledWith(
      USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID, DocumentStatuses.Draft
    );
  });

  it('should log success after updating certificate status to DRAFT', async () => {
    mockUpdateCertificateStatus.mockResolvedValue(null);
    mockSaveSystemError.mockResolvedValue(undefined);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      `[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][UPDATED-STATUS][${DocumentStatuses.Draft}]`
    );
  });

  it('should save system error with the correct failure object', async () => {
    mockUpdateCertificateStatus.mockResolvedValue(null);
    mockSaveSystemError.mockResolvedValue(undefined);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockSaveSystemError).toHaveBeenCalledWith(
      USER_PRINCIPAL, DOCUMENT_NUMBER, { error: 'SYSTEM_ERROR' }, CONTACT_ID
    );
  });

  it('should log error when updateCertificateStatus fails', async () => {
    const error = new Error('update failed');
    mockUpdateCertificateStatus.mockRejectedValue(error);
    mockSaveSystemError.mockResolvedValue(undefined);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockLoggerError).toHaveBeenCalledWith(
      `[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][UPDATE-STATUS][${DocumentStatuses.Draft}][ERROR], ${error}`
    );
  });

  it('should continue to save system error even when updateCertificateStatus fails', async () => {
    const error = new Error('update failed');
    mockUpdateCertificateStatus.mockRejectedValue(error);
    mockSaveSystemError.mockResolvedValue(undefined);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockSaveSystemError).toHaveBeenCalledWith(
      USER_PRINCIPAL, DOCUMENT_NUMBER, { error: 'SYSTEM_ERROR' }, CONTACT_ID
    );
  });

  it('should log error when saveSystemError fails', async () => {
    const error = new Error('save failed');
    mockUpdateCertificateStatus.mockResolvedValue(null);
    mockSaveSystemError.mockRejectedValue(error);

    await ExportPayloadService.saveSystemError(USER_PRINCIPAL, DOCUMENT_NUMBER, CONTACT_ID);

    expect(mockLoggerError).toHaveBeenCalledWith(
      `[CREATE-EXPORT-CERTIFICATE][${DOCUMENT_NUMBER}][SAVE-ERRORS], ${error}`
    );
  });
});

describe('checkCertificate', () => {
  const VALIDATION_URL = 'http://reference-service/v1/catchcertificates/validation/online';
  const payloadToValidate = { documentNumber: 'GBR-2020-CC-TEST123', exportPayload: {} };

  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info').mockImplementation(() => {});
    mockLoggerError = jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call axios.post with the correct url and wrapped payload', async () => {
    mockedAxios.post.mockResolvedValue({ data: { report: [], rawData: {} } });

    await ExportPayloadService.checkCertificate(payloadToValidate, VALIDATION_URL);

    expect(mockedAxios.post).toHaveBeenCalledWith(VALIDATION_URL, { dataToValidate: payloadToValidate });
  });

  it('should return res.data on a successful response', async () => {
    const mockResponseData = { report: [{ failures: ['3C'] }], rawData: { certNumber: 'GBR-2020-CC-TEST123' } };
    mockedAxios.post.mockResolvedValue({ data: mockResponseData });

    const result = await ExportPayloadService.checkCertificate(payloadToValidate, VALIDATION_URL);

    expect(result).toEqual(mockResponseData);
  });

  it('should log the report and rawData on success', async () => {
    const mockResponseData = { report: [{ failures: ['3C'] }], rawData: { certNumber: 'GBR-2020-CC-TEST123' } };
    mockedAxios.post.mockResolvedValue({ data: mockResponseData });

    await ExportPayloadService.checkCertificate(payloadToValidate, VALIDATION_URL);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      `[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE] Report: ${JSON.stringify(mockResponseData.report)}`
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      `[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE] Raw Data: ${JSON.stringify(mockResponseData.rawData)}`
    );
  });

  it('should log the error and rethrow when axios.post rejects', async () => {
    const error = new Error('network failure');
    mockedAxios.post.mockRejectedValue(error);

    await expect(ExportPayloadService.checkCertificate(payloadToValidate, VALIDATION_URL))
      .rejects
      .toThrow('network failure');

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('[EXPORT-PAYLOAD-SERVICE][CHECK-CERTIFICATE][ERROR]')
    );
  });

  it('should throw a new Error wrapping the original error on failure', async () => {
    const error = new Error('upstream error');
    mockedAxios.post.mockRejectedValue(error);

    await expect(ExportPayloadService.checkCertificate(payloadToValidate, VALIDATION_URL))
      .rejects
      .toBeInstanceOf(Error);
  });
});