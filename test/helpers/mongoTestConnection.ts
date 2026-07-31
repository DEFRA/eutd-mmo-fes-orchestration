import * as mongoose from 'mongoose';

export const getTestMongoUri = (): string =>
  process.env.MONGO_TEST_URI || process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017';

// Each Jest worker gets its own database to avoid cross-worker data collisions.
export const getTestDbName = (): string =>
  `orchestration_test_${process.env.JEST_WORKER_ID || '1'}`;

export const connectTestMongo = async (): Promise<void> => {
  await mongoose.connect(getTestMongoUri(), { dbName: getTestDbName() });
};

export const disconnectTestMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
};
