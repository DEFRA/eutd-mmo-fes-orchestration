import { IStoreable, IStorage } from './storeable';
import logger from '../logger';

const DELIMITER = ':';

export class MemoryStorage<T extends IStoreable> implements IStorage<T> {
  private store = {};

  public constructor() {
    this.store = {};
  }

  async initialize() {
     logger.info('Memory storage is initialized as session store');
  }

  async readAll<T extends IStoreable>(key: string): Promise<T[]> {
    if( Object.hasOwn(this.store, key) ) {
      const data = this.store[key];
      return <T[]>data;

    } else {
      return [];
    }
  }

  async read<T extends IStoreable>(key: string): Promise<T> {
    if( Object.hasOwn(this.store, key) ) {
      const data = this.store[key];
      return <T>data;

    } else {
      return null;
    }
  }

  async deleteFor(userPrincipal: string, key: string): Promise<void> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    delete this.store[fullKey];
  }

  async writeAll<T extends IStoreable>(key: string, data: T[]): Promise<void> {
    this.store[key] = data;
  }

  cleanUp(): void {
    this.store = {};
    logger.info('Session store cleared');
  }

  async readFor<T extends IStoreable>(userPrincipal: string, key: string): Promise<T> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    if(Object.hasOwn(this.store, fullKey) ) {
      const data = this.store[fullKey];
      return <T>(data);
    }
  }

  async readAllFor<T extends IStoreable>(userPrincipal: string, key: string): Promise<T[]> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    if( Object.hasOwn(this.store, fullKey)) {
      const data = this.store[fullKey];
      return <T[]>(data);

    } else {
      return [];
    }
  }

  async writeFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T): Promise<void> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    this.store[fullKey] = data;
  }

  async writeAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T[]): Promise<void> {
    const fullKey = MemoryStorage._buildKeyForUser(userPrincipal, key);
    this.store[fullKey] = data;
  }

  async tagByDocumentNumber(userPrincipal: string, documentNumber: string, _journey: string): Promise<void> {
    this.store[documentNumber] = [];
  }

  async removeTag(documentNumber: string): Promise<void> {
    delete this.store[documentNumber];
  }

  async getKeysForTag(documentNumber: string): Promise<string[]> {
    return this.store[documentNumber];
  }

  async getDocument(_documentNumber: string) {
    return null;
  }

  static _buildKeyForUser(userPrincipal: string, key: string): string {
    // TODO: Do we need to add some validation?
    return userPrincipal + DELIMITER + key;
  }

}