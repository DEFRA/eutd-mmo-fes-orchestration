import { validateLanding, createExportPayloadForValidation } from './ccLandingValidator';
import VesselValidator from '../services/vesselValidator.service';
import * as ProductValidator from './ccProductValidator';

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
    let mockCheckVesselWithDate: jest.SpyInstance;
    let mockValidateProducts: jest.SpyInstance;

    beforeEach(() => {
      mockCheckVesselWithDate = jest.spyOn(VesselValidator, 'checkVesselWithDate');
      mockCheckVesselWithDate.mockResolvedValue(undefined);
      mockValidateProducts = jest.spyOn(ProductValidator, 'validateProducts');
      mockValidateProducts.mockResolvedValue([]);
    });

    afterEach(() => {
      mockCheckVesselWithDate.mockRestore();
      mockValidateProducts.mockRestore();
    });

    it("should pass", async () => {
        const result = await validateLanding(exportPayload);
        expect(result).toBeUndefined();
    });

    it("should error if vessel validation throws an error", async () => {
        mockCheckVesselWithDate.mockRejectedValueOnce(new Error('Vessel WIRON 5 has no valid license'));

        const result = await validateLanding(exportPayload);
        expect(result).toStrictEqual({ error: 'invalid', errors: { dateLanded: 'validation.vessel.license.invalid-date' }});
    });

    it("should error if product validation fails", async () => {
        mockValidateProducts.mockResolvedValueOnce([{
          result: ['dateLanded'],
          validator: 'seasonalFish'
      }])

      const result = await validateLanding(exportPayload);
      expect(result).toStrictEqual({ error: 'invalid', errors: { dateLanded: 'error.seasonalFish.invalidate' }});
    });

    it("should error if product validation fails on start date", async () => {
      mockValidateProducts.mockResolvedValueOnce([{
        result: ['startDate', 'dateLanded'],
        validator: 'seasonalFish'
    }])

    const result = await validateLanding(exportPayload);
    expect(result).toStrictEqual({ error: 'invalid', errors: { dateLanded: 'error.seasonalFish.invalidate', startDate: 'error.startDate.seasonalFish.invalidate' }});
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