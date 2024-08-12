import { IStorage, IStoreable } from './session_store/storeable';

export default interface AppSettings {
  sessionStore?: IStorage<IStoreable>
}