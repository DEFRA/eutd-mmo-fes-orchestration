import Redis, { RedisOptions } from 'ioredis';

import { IStorage, IStoreable } from './storeable';
import logger from '../logger';
import {
  CATCHES_KEY,
  CONSERVATION_KEY,
  EXPORTER_KEY,
  SPECIES_KEY,
  PROCESSING_STATEMENT_KEY,
  STORAGE_NOTES_KEY,
  CATCH_CERTIFICATE_KEY,
  EXPORT_PAYLOAD_KEY
} from './constants';
import ApplicationConfig from '../applicationConfig';

const DELIMITER = ':';

export class RedisStorage<T extends IStoreable> implements IStorage<T> {
  private connectionOptions: RedisOptions;
  private connection: Redis;

  public constructor(connection?: Redis) {// allow for optional dependency injection for testing purposes 
    if (connection) {
      this.connection = connection;
    }
  }

  private startConnection(): void {
    if (this.connection === undefined || this.connection === null) {
      this.connection = new Redis(this.connectionOptions);

    } else {
      logger.warn('Attempt to start redis connection again!');
    }
  }

  public closeConnection(): void {
    this.connection.disconnect();
  }

  async getDocument(documentNumber: string) {
    const redisKeys = await this.connection.smembers(documentNumber);

    if(redisKeys.length > 0) {
      const document: any = {
        documentNumber
      };

      for(const key of redisKeys) {
        const json = await this.connection.get(key);
        const keyParts = key.split(DELIMITER);
        if (keyParts.length < 2) {
          logger.warn('Key does not have required parts to amend document', key);

        } else {

          const userPrincipal = keyParts[0];
          const modKey = keyParts[1];
          if (json) {
            document[modKey] = JSON.parse(json);
          }
          document['userPrincipal'] = userPrincipal;

        }

      }
      return document;

    } else {
      return null;
    }
  }

  async readAll<T extends IStoreable>(key: string): Promise<T[]> {
    // Setting and getting all users...
    const data = await this.connection.get(key);
    // This is not a good pattern but will do for now...
    return <T[]>JSON.parse(data);
  }

  async read<T extends IStoreable>(key: string): Promise<T> {
    const data = await this.connection.get(key);
    return <T>JSON.parse(data);
  }

  async writeAll<T extends IStoreable>(key: string, data: T[]): Promise<void> {
    await this.connection.set(key, JSON.stringify(data));
  }

  async initialize(options?: object): Promise<void> {
    this.connectionOptions = <RedisOptions>options;
    logger.info('Attempt to initialize redis cache connection to', this.connectionOptions.host);
    this.startConnection();
    logger.info('Redis cache connection initialized');
  }

  cleanUp(): void {
    logger.info('Attempt to close redis cache connection');
    this.closeConnection();
    logger.info('Redis cache connection is closed');
  }

  async readFor<T extends IStoreable>(userPrincipal: string, contactId: string,  key: string): Promise<T> {
    let data;

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      data = await this.connection.get(fullKey);
    }

    if(!data && userPrincipal) {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      data = await this.connection.get(fullKey);
    }

    return <T>JSON.parse(data);
  }

  async readAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string): Promise<T[]> {
    let data;
    
    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      data = await this.connection.get(fullKey);
    }

    if(!data && userPrincipal) {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      data = await this.connection.get(fullKey);
    }

    return <T[]>JSON.parse(data);
  }

  async writeFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T): Promise<void> {
    const stringifiedData = JSON.stringify(data);

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      await this.connection.set(fullKey, stringifiedData);
    } else {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      await this.connection.set(fullKey, stringifiedData);
    }
  }

  async writeAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T[]): Promise<void> {
    const stringifiedDataForWriteAll = JSON.stringify(data);

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      await this.connection.set(fullKey, stringifiedDataForWriteAll);
    } else {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      await this.connection.set(fullKey, stringifiedDataForWriteAll);
    }
  }

  async deleteFor(userPrincipal: string, contactId: string, key: string): Promise<void> {
    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      await this.connection.del(fullKey);
    }

    const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
    await this.connection.del(fullKey);    
  }

  async tagByDocumentNumber(userPrincipal: string, contactId: string, documentNumber: string, journey: string): Promise<void> {
    const userId = contactId ?? userPrincipal;
    const journeyKeys = {
      [CATCH_CERTIFICATE_KEY]: [
        RedisStorage._buildKeyForUser(userId, CATCH_CERTIFICATE_KEY),
        RedisStorage._buildKeyForUser(userId, SPECIES_KEY),
        RedisStorage._buildKeyForUser(userId, CATCHES_KEY),
        RedisStorage._buildKeyForUser(userId, CATCH_CERTIFICATE_KEY + '/' + EXPORTER_KEY),
        RedisStorage._buildKeyForUser(userId, CONSERVATION_KEY),
        RedisStorage._buildKeyForUser(userId, CATCH_CERTIFICATE_KEY + '/' + EXPORT_PAYLOAD_KEY),
      ],
      [PROCESSING_STATEMENT_KEY]: [
        RedisStorage._buildKeyForUser(userId, PROCESSING_STATEMENT_KEY),
        RedisStorage._buildKeyForUser(userId, PROCESSING_STATEMENT_KEY + '/' + EXPORTER_KEY),
      ],
      [STORAGE_NOTES_KEY]: [
        RedisStorage._buildKeyForUser(userId, STORAGE_NOTES_KEY),
        RedisStorage._buildKeyForUser(userId, STORAGE_NOTES_KEY + '/' + EXPORTER_KEY),
      ]
    };
    const keys = journeyKeys.hasOwnProperty.call(journey) ? journeyKeys[journey] : [];
    this.connection.sadd(documentNumber, ...keys);
  }

  async removeTag(documentNumber: string): Promise<void> {
    await this.connection.del(documentNumber);
  }

  async getKeysForTag(documentNumber: string): Promise<string[]> {
    return await this.connection.smembers(documentNumber);
  }

  static _buildKeyForUser(userPrincipal: string, key: string): string {
    return userPrincipal + DELIMITER + key;
  }
}

export function getRedisOptions(): RedisOptions {
  const options = <RedisOptions>{
    host: ApplicationConfig._redisHostName,
    port: ApplicationConfig._redisPort
  };

  if (ApplicationConfig._redisPassword) {
    options.password = ApplicationConfig._redisPassword;
  }

  let redisTlsEnabled = true;
  if(ApplicationConfig._redisTlsEnabled) {
    redisTlsEnabled = (ApplicationConfig._redisTlsEnabled == 'true');
  }

  if (redisTlsEnabled) {
    options.tls = {
      host: ApplicationConfig._redisTlsHostName
    };
  }
  return options;
}
