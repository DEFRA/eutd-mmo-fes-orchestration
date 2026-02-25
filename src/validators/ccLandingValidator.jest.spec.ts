import { validateLanding, createExportPayloadForValidation } from './ccLandingValidator';
import ExportPayloadService from '../services/export-payload.service';
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

    it("should return aggregate-weight error when adjusted total exceeds limit", async () => {
        const existingPayload = {
            items: [
                { landings: [{ model: { exportWeight: 9999900 } }] }
            ]
        } as any;

        jest.spyOn(ExportPayloadService, 'get').mockResolvedValue(existingPayload);

        const incomingPayload: ProductLanded[] = [{ product, landings: [{ model: { ...landing, exportWeight: 200 } }] }];

        const result = await validateLanding(incomingPayload, { userPrincipal: 'u', documentNumber: 'dn', contactId: 'c' });
        expect(result).toStrictEqual({ error: 'invalid', errors: { exportWeight: 'ccAddLandingTotalExportWeightLessThan' } });
    });

    it("should return aggregate-weight error when adjusted total equals limit (10,000,000)", async () => {
        const existingPayload = {
            items: [
                { landings: [{ model: { exportWeight: 10000000 } }] }
            ]
        } as any;

        jest.spyOn(ExportPayloadService, 'get').mockResolvedValue(existingPayload);

        const incomingPayload: ProductLanded[] = [{ product, landings: [{ model: { ...landing, exportWeight: 0 } }] }];

        const result = await validateLanding(incomingPayload, { userPrincipal: 'u', documentNumber: 'dn', contactId: 'c' });
        expect(result).toStrictEqual({ error: 'invalid', errors: { exportWeight: 'ccAddLandingTotalExportWeightLessThan' } });
    });

    it("should not error for aggregate-weight when under limit", async () => {
        const existingPayload = {
            items: [
                { landings: [{ model: { exportWeight: 5000 } }] }
            ]
        } as any;

        jest.spyOn(ExportPayloadService, 'get').mockResolvedValue(existingPayload);

        const incomingPayload: ProductLanded[] = [{ product, landings: [{ model: { ...landing, exportWeight: 200 } }] }];

        const result = await validateLanding(incomingPayload, { userPrincipal: 'u', documentNumber: 'dn', contactId: 'c' });
        expect(result).toBeUndefined();
    });

    it("should return both gearType and aggregate-weight errors together", async () => {
        const existingPayload = {
            items: [
                { landings: [{ model: { exportWeight: 9999900 } }] }
            ]
        } as any;

        jest.spyOn(ExportPayloadService, 'get').mockResolvedValue(existingPayload);
        mockIsValidGearType.mockResolvedValueOnce(false);

        const incomingPayload: ProductLanded[] = [{ product, landings: [{ model: { ...landing, exportWeight: 200 } }] }];

        const result = await validateLanding(incomingPayload, { userPrincipal: 'u', documentNumber: 'dn', contactId: 'c' });
        expect(result).toStrictEqual({ error: 'invalid', errors: { exportWeight: 'ccAddLandingTotalExportWeightLessThan', gearType: 'error.gearType.invalid' } });
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