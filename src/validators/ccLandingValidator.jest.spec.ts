import { validateLanding, createExportPayloadForValidation, validateAggregateExportWeight } from './ccLandingValidator';
import VesselValidator from '../services/vesselValidator.service';
import * as ProductValidator from './ccProductValidator';
import * as ReferenceDataService from '../services/reference-data.service';
import { Landing, ProductLanded } from '../persistence/schema/frontEndModels/payload';

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
    let mockIsValidGearType: jest.SpyInstance;

    beforeEach(() => {
      mockCheckVesselWithDate = jest.spyOn(VesselValidator, 'checkVesselWithDate');
      mockCheckVesselWithDate.mockResolvedValue(undefined);
      mockValidateProducts = jest.spyOn(ProductValidator, 'validateProducts');
      mockValidateProducts.mockResolvedValue([]);
      mockIsValidGearType = jest.spyOn(ReferenceDataService, 'isValidGearType');
      mockIsValidGearType.mockResolvedValue(true);
    });

    afterEach(() => {
      mockCheckVesselWithDate.mockRestore();
      mockValidateProducts.mockRestore();
            jest.restoreAllMocks();
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

    it("should return error for invalid gear type/category pair", async () => {
        mockIsValidGearType.mockReturnValueOnce(false);
        const result = await validateLanding(exportPayload);
        expect(result).toStrictEqual({ error: 'invalid', errors: { gearType: 'error.gearType.invalid' }});
    });

    it("should not call isValidGearType if no gear info is present", async () => {
        const payload: ProductLanded[] = [{
            product,
            landings: [
                { model: { ...landing, gearCategory: undefined, gearType: undefined } },
                { model: { ...landing, gearCategory: undefined, gearType: undefined } },
                { model: landing },
            ]
        }];
        const result = await validateLanding(payload);
        expect(mockIsValidGearType).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
    });

    it("will call isValidGearType for each landing", async () => {
        const payload: ProductLanded[] = [{
            product,
            landings: [
                { model: landing },
                { model: landing },
                { model: landing },
            ]
        }];
        const result = await validateLanding(payload);
        expect(result).toBeUndefined();
        expect(mockIsValidGearType).toHaveBeenCalledTimes(3);
    });

    it("will return error if any one call to isValidGearType fails", async () => {
        mockIsValidGearType.mockResolvedValueOnce(false);
        const payload: ProductLanded[] = [{
            product,
            landings: [
                { model: landing },
                { model: landing },
                { model: landing },
            ]
        }];
        const result = await validateLanding(payload);
        expect(mockIsValidGearType).toHaveBeenCalledTimes(3);
        expect(result).toStrictEqual({ error: 'invalid', errors: { gearType: 'error.gearType.invalid' } });
    });

    it("validateAggregateExportWeight returns an error when frontendTotal meets/exceeds limit", async () => {
        const res = await validateAggregateExportWeight({ totalCombinedExportWeight: '10000000', exportWeight: '0' } as any);
        expect(Array.isArray(res)).toBe(true);
        expect(res && res.length > 0).toBe(true);
        const detail = res && res[0] && res[0].details && res[0].details[0];
        expect(detail.message).toBe('ccAddLandingTotalExportWeightLessThan');
    });

    it('validateAggregateExportWeight returns empty array when opts are missing', async () => {
        const res = await validateAggregateExportWeight(exportPayload as any);
        expect(res).toStrictEqual([]);
    });

    it('validateAggregateExportWeight returns empty array when frontendTotal is invalid (NaN)', async () => {
        const res = await validateAggregateExportWeight({ totalCombinedExportWeight: 'not-a-number', exportWeight: '200' } as any);
        expect(res).toStrictEqual([]);
    });

    it('should return aggregate-weight error when frontend total is adjusted and exceeds limit', async () => {
        const res = await validateAggregateExportWeight({ totalCombinedExportWeight: '10000000', exportWeight: '0' } as any);
        expect(res && res.length > 0).toBe(true);
    });

    it("should not error for aggregate-weight when under limit", async () => {
        const res = await validateAggregateExportWeight({ totalCombinedExportWeight: '5200', exportWeight: '0' } as any);
        expect(res).toStrictEqual([]);
    });

    it("should return gearType error from validateLanding and aggregate error from validateAggregateExportWeight separately", async () => {
        mockIsValidGearType.mockResolvedValueOnce(false);

        const incomingPayload: ProductLanded[] = [{ product, landings: [{ model: { ...landing, exportWeight: 200 } }] }];

        const landingResult = await validateLanding(incomingPayload);
        expect(landingResult).toStrictEqual({ error: 'invalid', errors: { gearType: 'error.gearType.invalid' } });

        const agg = await validateAggregateExportWeight({ totalCombinedExportWeight: '10000000', exportWeight: '200' } as any);
        expect(agg && agg.length > 0).toBe(true);
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

const landing: Landing = {
    "id": "6ccc3a6b-556e-4c30-a46a-b70f209e6bf5",
    "vessel": {
        "pln": "PH1100",
        "vesselName": "WIRON 5",
        "flag": "GBR",
        "homePort": "PLYMOUTH",
        "licenceNumber": "12480",
        "licenceValidTo": "2382-12-31T00:00:00",
        "rssNumber": "C20514",
        "vesselLength": 50.63,
        "label": "WIRON 5 (PH1100)",
        "domId": "WIRON5-PH1100"
    },
    "exportWeight": 100,
    "faoArea": "FAO27",
    "dateLanded": "2019-03-27T00:00:00.000Z",
    "gearCategory": "Surrounding nets",
    "gearType": "Purse seines (PS)",
};

const exportPayload: ProductLanded[] = [{
    "product": product,
    "landings": [{
        model: landing
    }]
}];