import * as Hapi from '@hapi/hapi';
import Server from '../src/server';
import * as test from 'tape';
import { Test } from 'tape';
import * as _ from 'lodash';
import { IStorage } from '../src/session_store/storeable';
import { MySpecies } from '../src/validators/interfaces/species.interface';
import TransportDetails from '../src/validators/interfaces/transportDetails.interface';
import { SessionStoreFactory } from '../src/session_store/factory';
import { SPECIES_KEY, TRANSPORT_KEY } from '../src/session_store/constants';
import ApplicationConfig from '../src/applicationConfig';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

const initMongo = async () => {
  if (!mongod) {
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 17017,
        dbName: 'sample'
      }
    });
  }
  return mongod;
};

export interface IPayload<T> {
  status: number;
  data: T;
}

const startServer = async (): Promise<Hapi.Server> => {
  if (Server.instance() === undefined) {
    const mongo = await initMongo();
    const connString = mongo.getUri();
    console.log('The mongo connection string used:', connString);

    ApplicationConfig.loadProperties();
    return await Server.start(5501);
  }
  return await Server.restart(5501);
};

export const stopServer = async (): Promise<void> => {
  try {
    await Server.stop();

  } catch(e) {
    console.error(e);
  }
};

export const extractPayload = <T>(response: Hapi.ServerInjectOptions): IPayload<T> => {
  return JSON.parse(response.payload as any) as IPayload<T>;
};

export const serverTest = async (description: string, testFunc: (server: Hapi.Server, t: Test) => void, onlyMe?: boolean) => {
  const method = (onlyMe && onlyMe === true) ? test.only : test;
  return method(description, async (t) => {
    const server = await startServer();
    await testFunc(server, t);
    await stopServer();
    t.end();
  });
};

export const eraseSpecies = async (sessionStore: IStorage<MySpecies>,
                                   userId: string): Promise<Error | void> => {
  try {
    await sessionStore.writeAllFor(userId, 'TODO', SPECIES_KEY, <MySpecies[]>[]);

  } catch (e) {
    throw new Error(`Argh. Did not erase the old species ${e}`);
  }
};

export const addTransportDetails = async(sessionStore: IStorage<TransportDetails>,
                                         userId: string): Promise<Error | void> => {

  try {
    await sessionStore.writeAllFor(userId, 'TODO', TRANSPORT_KEY, <TransportDetails[]>[]);
  }  catch(e) {
    throw new Error(`Failed to add transport details ${e}`);
  }
};

test.onFinish(async() => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  sessionStore.cleanUp();

  await mongod.stop();
});
