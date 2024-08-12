import { IStorage, IStoreable } from "../../src/session_store/storeable";

export class MockSessionStorage<T extends IStoreable> implements IStorage<T> {

  readFor = jest.fn();
  readAllFor = jest.fn();
  writeFor = jest.fn();
  writeAllFor = jest.fn();
  readAll = jest.fn();
  read = jest.fn();
  writeAll = jest.fn();
  initialize = jest.fn();
  cleanUp = jest.fn();
  getDocument = jest.fn();
  tagByDocumentNumber = jest.fn();
  removeTag = jest.fn();
  getKeysForTag = jest.fn();
  deleteFor = jest.fn();
}