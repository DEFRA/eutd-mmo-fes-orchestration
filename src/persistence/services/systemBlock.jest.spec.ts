import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getBlockingStatus } from './systemBlock';
import { BlockingStatusModel,ValidationRules } from '../schema/systemBlock'

let mongoServer;

beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();
  await mongoose.connect(mongoUri).catch(err => {console.log(err)});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
