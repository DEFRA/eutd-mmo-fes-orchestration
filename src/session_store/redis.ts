import { createClient } from 'redis';

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
import { buildRedisConnectionUrl } from './redisConnectionConfig';

const DELIMITER = ':';

export interface RedisConnectionOptions {
  url?: string;
}

type RedisClient = ReturnType<typeof createClient>;

export class RedisStorage<T extends IStoreable> implements IStorage<T> {
  private connectionOptions: RedisConnectionOptions;
  private connection: RedisClient;

  public constructor(connection?: RedisClient) {// allow for optional dependency injection for testing purposes
    if (connection) {
      this.connection = connection;
    }
  }

  private async startConnection(): Promise<void> {
    if (this.connection === undefined || this.connection === null) {
      this.connection = createClient(this.connectionOptions);
      this.connection.on('error', (error) => logger.error(`[REDIS][CLIENT][ERROR][${error}]`));
      await this.connection.connect();

    } else {
      logger.warn('Attempt to start redis connection again!');
    }
  }

  public closeConnection(): void {
    if (this.connection) {
      this.connection.destroy();
    }
  }

  private toStoredString(data: string | Buffer | null): string | null {
    if (data === null) {
      return null;
    }

    return typeof data === 'string' ? data : data.toString();
  }

  private normalizeMembers(members: Array<string | Buffer> | Set<string | Buffer>): string[] {
    return Array.from(members, (member) => typeof member === 'string' ? member : member.toString());
  }

  private parseStoredValue<V>(data: string | Buffer | null): V {
    const storedValue = this.toStoredString(data);

    if (storedValue === null) {
      return null;
    }

    return JSON.parse(storedValue) as V;
  }

  async getDocument(documentNumber: string) {
    const redisKeys = this.normalizeMembers(await this.connection.sMembers(documentNumber));

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
            document[modKey] = this.parseStoredValue(json);
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
    return this.parseStoredValue<T[]>(data);
  }

  async read<T extends IStoreable>(key: string): Promise<T> {
    const data = await this.connection.get(key);
    return this.parseStoredValue<T>(data);
  }

  async writeAll<T extends IStoreable>(key: string, data: T[]): Promise<void> {
    await this.connection.set(key, JSON.stringify(data));
  }

  async initialize(options?: object): Promise<void> {
    this.connectionOptions = <RedisConnectionOptions>options;
    const connectionTarget = this.connectionOptions?.url
      ? new URL(this.connectionOptions.url).host
      : 'unknown-host';

    logger.info('Attempt to initialize redis cache connection to', connectionTarget);
    await this.startConnection();
    logger.info('Redis cache connection initialized');
  }

  cleanUp(): void {
    logger.info('Attempt to close redis cache connection');
    this.closeConnection();
    logger.info('Redis cache connection is closed');
  }

  async readFor<T extends IStoreable>(userPrincipal: string, contactId: string,  key: string): Promise<T> {
    let data: string | Buffer | null = null;

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      data = await this.connection.get(fullKey);
    }

    if(!data && userPrincipal) {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      data = await this.connection.get(fullKey);
    }

    return this.parseStoredValue<T>(data);
  }

  async readAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string): Promise<T[]> {
    let data: string | Buffer | null = null;

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      data = await this.connection.get(fullKey);
    }

    if(!data && userPrincipal) {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      data = await this.connection.get(fullKey);
    }

    return this.parseStoredValue<T[]>(data);
  }

  async writeFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T, ttlSeconds?: number): Promise<void> {
    const stringifiedData = JSON.stringify(data);

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      if (ttlSeconds) {
        await this.connection.set(fullKey, stringifiedData, { EX: ttlSeconds });
      } else {
        await this.connection.set(fullKey, stringifiedData);
      }
    } else {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      if (ttlSeconds) {
        await this.connection.set(fullKey, stringifiedData, { EX: ttlSeconds });
      } else {
        await this.connection.set(fullKey, stringifiedData);
      }
    }
  }

  async writeAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T[], ttlSeconds?: number): Promise<void> {
    const stringifiedDataForWriteAll = JSON.stringify(data);

    if(contactId) {
      const fullKey = RedisStorage._buildKeyForUser(contactId, key);
      if (ttlSeconds) {
        await this.connection.set(fullKey, stringifiedDataForWriteAll, { EX: ttlSeconds });
      } else {
        await this.connection.set(fullKey, stringifiedDataForWriteAll);
      }
    } else {
      const fullKey = RedisStorage._buildKeyForUser(userPrincipal, key);
      if (ttlSeconds) {
        await this.connection.set(fullKey, stringifiedDataForWriteAll, { EX: ttlSeconds });
      } else {
        await this.connection.set(fullKey, stringifiedDataForWriteAll);
      }
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
    const keys = Object.hasOwn(journeyKeys, journey) ? journeyKeys[journey] : [];

    if (keys.length === 0) {
      return;
    }

    await this.connection.sAdd(documentNumber, keys);
  }

  async removeTag(documentNumber: string): Promise<void> {
    await this.connection.del(documentNumber);
  }

  async getKeysForTag(documentNumber: string): Promise<string[]> {
    return this.normalizeMembers(await this.connection.sMembers(documentNumber));
  }

  static _buildKeyForUser(userPrincipal: string, key: string): string {
    return userPrincipal + DELIMITER + key;
  }
}

export function getRedisOptions(): RedisConnectionOptions {
  return {
    url: buildRedisConnectionUrl({
      connectionString: ApplicationConfig._redisConnectionString,
      hostName: ApplicationConfig._redisHostName,
      port: ApplicationConfig._redisPort,
      tlsEnabled: ApplicationConfig._redisTlsEnabled,
    })
  };
}
