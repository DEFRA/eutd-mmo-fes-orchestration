// This is just a marker interface
// Everything stored in session store is expected to have implemented
// this marker interface
export interface IStoreable {
  // TODO: Check if we can avoid using this dummy method
  _marker();
}


// This is the actual session storage interface
// Anything that could be used to save session would implement this interface
// examples: redis and filesystem for now
export interface IStorage<T extends IStoreable> extends
  IUserStorage<T>,
  IAllUsersStorage<T>,
  IStorageInitializer,
  IDocumentStorageForUser
{}


/**
 * Interface for single user session
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars 
export interface IUserStorage<T extends IStoreable> {
  readFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string): Promise<T>
  readAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string): Promise<T[]>
  writeFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T): Promise<void>
  writeAllFor<T extends IStoreable>(userPrincipal: string, contactId: string, key: string, data: T[]): Promise<void>
  deleteFor(userPrincipal: string, contactId: string, key: string): Promise<void>
}

export interface IDocumentStorageForUser {
  getDocument(documentNumber: string)
  tagByDocumentNumber(userPrincipal: string, contactId: string, documentNumber: string, journey: string): Promise<void>
  removeTag(documentNumber: string): Promise<void>
  getKeysForTag(documentNumber: string): Promise<string[]>
}


/**
 * Interface for multiple user sessions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars 
export interface IAllUsersStorage<T extends IStoreable> {
  readAll<T extends IStoreable>(key: string): Promise<T[]>
  read<T extends IStoreable>(key: string): Promise<T>
  writeAll<T extends IStoreable>(key: string, data: T[]): Promise<void>
}


export interface IStorageInitializer {
  initialize(options?: object): void
  cleanUp(): void
}