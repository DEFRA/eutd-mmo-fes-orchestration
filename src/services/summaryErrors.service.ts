import { SessionStoreFactory } from "../session_store/factory";
import { getRedisOptions } from "../session_store/redis";
import { SUMMARY_ERRORS_KEY, SYSTEM_ERROR_KEY } from "../session_store/constants";
import { ValidationFailure, SystemFailure } from "../persistence/schema/frontEndModels/payload";
import logger from "../logger";
export default class SummaryErrorsService {

  public static async get(userPrincipal: string, documentNumber: string, contactId: string): Promise<(ValidationFailure | SystemFailure)[] | null> {
    logger.info(`[SUMMARY-ERRORS][${documentNumber}-${contactId}][GET-ERRORS][STARTED]`);

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const data = await sessionStore.read(`${SUMMARY_ERRORS_KEY}${documentNumber}`) as any;

    logger.info(`[SUMMARY-ERRORS][${documentNumber}-${contactId}][GET-ERRORS][SUCCEEDED][${JSON.stringify(data)}]`);

    const systemErrors = await sessionStore.readAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY) || {};

    const key = Object.keys(systemErrors).find(_ => _ === documentNumber);

    if (key) {
      return (data && data.errors && data.errors.length)
        ? [...data.errors, systemErrors[key]]
        : [systemErrors[key]];
    }

    return (data && data.errors && data.errors.length) ? data.errors : null;
  }

  public static async getAllSystemErrors(userPrincipal: string, contactId: string): Promise<SystemFailure[]> {
    logger.info(`[SYSTEM-ERRORS][GET-ERRORS][STARTED]`);

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const data: any = await sessionStore.readAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY) || {};

    logger.info(`[SYSTEM-ERRORS][GET-ERRORS][SUCCEEDED][${JSON.stringify(data)}]`);

    return Object.keys(data).map(key => {
        return {
          documentNumber: key,
          ...data[key]
         }
    });
  }

  public static async saveErrors(documentNumber: string, errorList: ValidationFailure[] | SystemFailure[]) : Promise<void> {

    logger.info(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SUMMARY-ERRORS][SAVE-ERRORS][STARTED][${JSON.stringify(errorList)}]`);

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const errorsPayload = {
      errors : errorList
    } as any;

    await sessionStore.writeAll( `${SUMMARY_ERRORS_KEY}${documentNumber}`, errorsPayload);

    logger.info(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SUMMARY-ERRORS][SAVE-ERRORS][SAVED][${JSON.stringify(errorsPayload)}]`)
  }

  public static async clearErrors(documentNumber : string) : Promise<void> {

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await sessionStore.removeTag(`${SUMMARY_ERRORS_KEY}${documentNumber}`);

    logger.info(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SUMMARY-ERRORS][CLEAR-ERRORS]`);
  }

  public static async saveSystemError(userPrincipal: string, documentNumber: string, error: SystemFailure, contactId: string) : Promise<void> {
    logger.info(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SAVE-SYSTEM-ERROR]`);

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const data = await sessionStore.readAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY) || {};

    const systemErrors: any = {
      ...data,
      [documentNumber]: error
    }

    await sessionStore.writeAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY, systemErrors);

    logger.info(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][SAVED-SYSTEM-ERROR]`);
  }

  public static async clearSystemError(userPrincipal: string, documentNumber: string, contactId: string): Promise<void> {
    logger.info(`[CLEAR-SYSTEM-ERROR][${documentNumber}]`);
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const data = await sessionStore.readAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY) || {};

    const systemErrors: any = {
      ...data,
      [documentNumber]: undefined
    }

    await sessionStore.writeAllFor(userPrincipal, contactId, SYSTEM_ERROR_KEY, systemErrors);
    logger.info(`[CLEAR-SYSTEM-ERROR][${documentNumber}][SUCCESS]`);
  }
}