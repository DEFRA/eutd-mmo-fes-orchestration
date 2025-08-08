import { getRedisOptions } from "../session_store/redis";
import { UploadValidatorPayload, IUploadedLanding } from "../persistence/schema/uploads";
import { SessionStoreFactory } from "../session_store/factory";
import { UPLOAD_ROWS_KEY } from "../session_store/constants";
import logger from "../logger";
import ApplicationConfig from "../applicationConfig";
import axios from "axios";

export default class UploadsService {
  public static async cacheUploadedRows(userPrincipal: string, contactId: string, uploadRows: IUploadedLanding[]) : Promise<void> {
    logger.info(`[UPLOAD-LANDINGS][${userPrincipal}][SAVE][CACHE-ROWS][STARTED]`);
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await sessionStore.writeFor(userPrincipal, contactId, UPLOAD_ROWS_KEY, uploadRows as any);
    logger.info(`[UPLOAD-LANDINGS][${userPrincipal}][SAVE][CACHE-ROWS][SAVED]`);
  }

  public static async getCacheUploadedRows(userPrincipal: string, contactId: string): Promise<IUploadedLanding[]> {
    logger.info(`[UPLOAD-LANDINGS][${userPrincipal}][READ][CACHE-ROWS][STARTED]`);
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const rows: any = await sessionStore.readFor(userPrincipal, contactId, UPLOAD_ROWS_KEY);
    logger.info(`[UPLOAD-LANDINGS][${userPrincipal}][READ][CACHE-ROWS][SUCCESS]`);
    return rows;
  }

  public static async invalidateCacheUploadedRows(userPrincipal: string, contactId: string): Promise<void> {
    logger.info(`[UPLOAD-LANDINGS][${userPrincipal}][INVALIDATING-CACHE-ROWS][STARTED]`);
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await sessionStore.deleteFor(userPrincipal, contactId, UPLOAD_ROWS_KEY);
  }

  public static async parseAndValidateData(payload: UploadValidatorPayload): Promise<IUploadedLanding[]> {
    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    const url = `${baseUrl}/v1/upload/landings/validate`;

    const res = await axios.post(url, payload);
    return res.data as IUploadedLanding[];
  }
}