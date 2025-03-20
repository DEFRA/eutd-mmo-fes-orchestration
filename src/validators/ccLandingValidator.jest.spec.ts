import { validateLanding, createExportPayloadForValidation } from './ccLandingValidator';
import VesselValidator from '../services/vesselValidator.service';
import * as ProductValidator from './ccProductValidator';

const sinon = require('sinon');

let sandbox;

beforeAll(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});

describe("createExportPayloadForValidation", () => {
    it("should transform a product and landing into an export payload", () => {
        const payload = createExportPayloadForValidation(product, landing);

        expect(payload).toMatchObject(exportPayload);
    });

    it("should transform a product and landing into an export payload without a start date", () => {
      const payload = createExportPayloadForValidation(product, landing);

      expect(payload[0].landings[0].model.startDate).toBeUndefined();
  });
});

describe("validateLanding", () => {
    it("should pass", async () => {
        sandbox.stub(VesselValidator, "checkVesselWithDate");
        sandbox.stub(ProductValidator, "validateProducts").returns([]);

        await expect(validateLanding(exportPayload))
            .resolves.toBe(undefined);
    });
    it("should error if vessel validation throws an error", async () => {
        sandbox.stub(VesselValidator, "checkVesselWithDate").throws(new Error("Error"));
        sandbox.stub(ProductValidator, "validateProducts").returns([]);

        await expect(validateLanding(exportPayload))
            .rejects
            .toThrow("validation.vessel.license.invalid-date");
    });
    it("should error if product validation fails", async () => {
        sandbox.stub(VesselValidator, "checkVesselWithDate");
        sandbox.stub(ProductValidator, "validateProducts").returns([{
            result: false,
            validator: 'seasonalFish'
        }]);

        await expect(validateLanding(exportPayload))
            .rejects
            .toThrow("error.seasonalFish.invalidate");
    });
});

const product = {
    "id": "1e005339-9321-47b7-84a9-54219b52ef55",
    "commodityCode": "03044990",
    "presentation": {
        "code": "FIL",
        "label": "Filleted"
    },
    "state": {
        "code": "FRE",
        "label": "Fresh"
    },
    "species": {
        "code": "BSS",
        "label": "European seabass (BSS)"
    }
};

const landing = {
    "id": "6ccc3a6b-556e-4c30-a46a-b70f209e6bf5",
    "vessel": {
        "pln": "PH1100",
        "vesselName": "WIRON 5",
        "flag": "GBR",
        "homePort": "PLYMOUTH",
        "licenceNumber": "12480",
        "imoNumber": 9249556,
        "licenceValidTo": "2382-12-31T00:00:00",
        "rssNumber": "C20514",
        "vesselLength": 50.63,
        "label": "WIRON 5 (PH1100)",
        "domId": "WIRON5-PH1100"
    },
    "exportWeight": 100,
    "faoArea": "FAO27",
    "dateLanded": "2019-03-27T00:00:00.000Z"
};

const exportPayload = [{
    "product": product,
    "landings": [{
        model: landing
    }]
}];