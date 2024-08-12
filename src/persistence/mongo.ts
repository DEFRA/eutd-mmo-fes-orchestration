import * as mongoose from 'mongoose';
import { STATUS_VOID } from '../services/constants';
import logger from '../logger';

export class MongoConnection {
  // useful to hold the connection so that we can close it in tests
  private static mongo: mongoose.Mongoose;

  private constructor() {}

  public static async connect(connectionUri: string, dbName: string, pool: string): Promise<void | Error> {
    if(MongoConnection.mongo === undefined) {
      try {
        MongoConnection.mongo = await mongoose.connect(connectionUri, {
          dbName,
          maxPoolSize: parseInt(pool)
        });

      } catch(e) {
        logger.error(e);
        throw new Error('Cannot connect to given database');
      }
    }
  }

  public static async cleanUp(): Promise<void | Error> {
    try {
      await MongoConnection.mongo.connection.close();

    } catch(e) {
      logger.error(e);
      logger.error('Cannot close connection to database');
    }
  }

  public static async findOne(collection: string, query: object): Promise<object | Error> {
    try {
      return await MongoConnection.mongo.connection.db.collection(collection).findOne(query);
    } catch(e) {
      logger.error(e);
    }
  }

  public static async insert(collection: string, newDoc: object): Promise<object | Error> {
    try {
      return await MongoConnection.mongo.connection.db.collection(collection).insertOne(newDoc);
    } catch(e) {
      logger.error(e);
    }
  }

  public static async deleteOne(collection: string, query: object): Promise<object | Error> {
    try {
      return await MongoConnection.mongo.connection.db.collection(collection).deleteOne(query);
    } catch(e) {
      logger.error(e);
    }
  }

  public static async updateStatusAsVoid(collection: string, query: object) {
    return await this.updateStatus(collection, STATUS_VOID, query);
  }

  private static async updateStatus(collection: string, status: string, query: object): Promise<object | Error> {
      try {
        const updatedDocu = MongoConnection.mongo.connection.db.collection(collection);

        return updatedDocu.updateOne(query, {$set : {"status":status}});
      } catch(e) {
      logger.error(e);
    }
  }
}
