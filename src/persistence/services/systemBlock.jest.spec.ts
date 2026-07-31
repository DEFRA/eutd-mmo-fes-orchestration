import { connectTestMongo, disconnectTestMongo } from '../../../test/helpers/mongoTestConnection';
import { getBlockingStatus, getBlockingStatuses } from './systemBlock';
import { BlockingStatusModel,ValidationRules } from '../schema/systemBlock'

beforeAll(async () => {
  await connectTestMongo();
});

afterAll(async () => {
  await disconnectTestMongo();
});

describe("find out if the blocking is on", () => {
    it ("Returns a boolean value", async () => {
        const model = new BlockingStatusModel({ name: 'PS_SD_4b', status: false });
        await model.save();

        const res = await getBlockingStatus(ValidationRules.FOUR_B)
        expect(res).toBe(false)
    });

    it ("Treats a `not found` as false", async () => {
      const res = await getBlockingStatus(ValidationRules.THREE_C)
      expect(res).toBe(false)
    })
})

describe("getBlockingStatuses", () => {
    beforeEach(async () => {
        await BlockingStatusModel.deleteMany({});
    });

    it("returns correct statuses for multiple names", async () => {
        await BlockingStatusModel.create({ name: 'CC_3c', status: true });
        await BlockingStatusModel.create({ name: 'CC_3d', status: false });

        const result = await getBlockingStatuses(['CC_3c', 'CC_3d']);
        expect(result.get('CC_3c')).toBe(true);
        expect(result.get('CC_3d')).toBe(false);
    });

    it("returns false for names not found in the database", async () => {
        const result = await getBlockingStatuses(['CC_3c', 'CC_4a']);
        expect(result.get('CC_3c')).toBe(false);
        expect(result.get('CC_4a')).toBe(false);
    });

    it("handles a mix of found and not-found names", async () => {
        await BlockingStatusModel.create({ name: 'CC_4a', status: true });

        const result = await getBlockingStatuses(['CC_3c', 'CC_4a']);
        expect(result.get('CC_3c')).toBe(false);
        expect(result.get('CC_4a')).toBe(true);
    });
})
