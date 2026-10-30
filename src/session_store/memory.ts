import { IStoreable, IStorage } from './storeable';
import logger from '../logger';

const DELIMITER = ':';

export class MemoryStorage<T extends IStoreable> implements IStorage<T> {
  private store = {};

  public constructor() {
    this.store = {};
  }

  initialize(): void {
     logger.info('Memory storage is initialized as session store');
  }

  readAll<T extends IStoreable>(key: string): Promise<T[]> {
    if( Object.hasOwn(this.store, key) ) {
      const data = this.store[key];
      return Promise.resolve(<T[]>data);

    } else {
      return Promise.resolve([]);
    }
  }

  read<T extends IStoreable>(key: string): Promise<T> {
    if( Object.hasOwn(this.store, key) ) {
      const data = this.store[key];
      return Promise.resolve(<T>data);

    } else {
      return Promise.resolve(null);
    }
  }

  deleteFor(userPrincipal: string, key: string): Promise<void> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    delete this.store[fullKey];
    return Promise.resolve();
  }

  writeAll<T extends IStoreable>(key: string, data: T[]): Promise<void> {
    this.store[key] = data;
    return Promise.resolve();
  }

  cleanUp(): void {
    this.store = {};
    logger.info('Session store cleared');
  }

  readFor<T extends IStoreable>(userPrincipal: string, key: string): Promise<T> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    if(Object.hasOwn(this.store, fullKey) ) {
      const data = this.store[fullKey];
      return Promise.resolve(<T>(data));
    }
    return Promise.resolve(undefined);
  }

  readAllFor<T extends IStoreable>(userPrincipal: string, key: string): Promise<T[]> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    if( Object.hasOwn(this.store, fullKey)) {
      const data = this.store[fullKey];
      return Promise.resolve(<T[]>(data));

    } else {
      return Promise.resolve([]);
    }
  }

  writeFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T, _ttlSeconds?: number): Promise<void> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    this.store[fullKey] = data;
    return Promise.resolve();
  }

  writeAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T[], _ttlSeconds?: number): Promise<void> {
    return this.writeFor(userPrincipal, contactId, key, data as unknown as IStoreable, _ttlSeconds);
  }

  tagByDocumentNumber(userPrincipal: string, documentNumber: string, _journey: string): Promise<void> {
    this.store[documentNumber] = [];
    return Promise.resolve();
  }

  removeTag(documentNumber: string): Promise<void> {
    delete this.store[documentNumber];
    return Promise.resolve();
  }

  getKeysForTag(documentNumber: string): Promise<string[]> {
    return Promise.resolve(this.store[documentNumber]);
  }

  getDocument(_documentNumber: string) {
    return Promise.resolve(null);
  }

  static _buildKeyForUser(userPrincipal: string, key: string): string {
    return userPrincipal + DELIMITER + key;
  }

}