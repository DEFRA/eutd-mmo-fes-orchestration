import { SessionStoreFactory } from '../session_store/factory';
import { getRedisOptions } from '../session_store/redis';
import { SESSION_DATA_KEY } from '../session_store/constants';
import { Landing } from '../persistence/schema/frontEndModels/payload';
import logger from '../logger';

export interface SessionLanding {
    landingId: string,
    addMode ? : boolean;
    editMode ? : boolean;
    error ? : string;
    errors ? : {};
    modelCopy ? : Landing;
    model: Landing;
}
export interface SessionData {
    documentNumber : string;
    nextUri? : string,
    currentUri? : string,
    landing? : SessionLanding
}

export interface SessionStore {
    documentNumber : string;
    nextUri? : string,
    currentUri? : string,
    landings? : SessionLanding[]
}

export const getCurrentSessionData = async(userId: string, documentNumber: string, contactId: string) : Promise<SessionStore> => {
    if ((userId || contactId) && documentNumber) {
        const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

        const [sessionData] = await attempt(sessionStore.readAllFor(userId, contactId, SESSION_DATA_KEY));

        if (sessionData) {
            logger.info(`[SESSION-MANAGER][GETTING-SESSION-DATA][${documentNumber}][DATA-FOUND]`);
            return sessionData.find(i => i.documentNumber.toUpperCase() === documentNumber.toUpperCase());
        } else {
            logger.info(`[SESSION-MANAGER][GETTING-SESSION-DATA][${documentNumber}][NO-DATA]`);
            return undefined;
        }
    }
};

export const clearSessionDataForCurrentJourney = async (userId: string, documentNumber: string, contactId: string) => {
    if ((userId || contactId) && documentNumber) {
        const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

        const [sessionData] = await attempt(sessionStore.readAllFor(userId, contactId, SESSION_DATA_KEY));

        if (sessionData) {
          const currentSessionIndex = sessionData.findIndex(i => i.documentNumber.toUpperCase() === documentNumber.toUpperCase());

          if (currentSessionIndex >= 0) {
            sessionData.splice(currentSessionIndex, 1);
            logger.info(`[SESSION-MANAGER][DELETING-SESSION-DATA][${documentNumber}]`);
            await sessionStore.writeAllFor(userId, contactId, SESSION_DATA_KEY, sessionData);
          }
        }
    }
};

export const withUserSessionDataStored = async (userId: string, payload : SessionData, contactId: string, nextAction : any = () => {}) => {

    logger.info("[SESSION-MANAGER][SAVING-SESSION-DATA]");
    if ((userId || contactId) && payload.documentNumber) {
        const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

        // eslint-disable-next-line prefer-const
        let [sessionData, error] = await attempt(sessionStore.readAllFor(userId, contactId, SESSION_DATA_KEY));

        if (error) sessionData = [];

        const currentSessionStoreData : SessionStore = {
            documentNumber : payload.documentNumber,
            nextUri : payload.nextUri,
            currentUri : payload.currentUri,
            landings : payload.landing ? [payload.landing] : undefined
        };

        removeUndefinedProperties(currentSessionStoreData);

        if (Array.isArray(sessionData)) {
            const currentSessionIndex  = sessionData.findIndex(i => i.documentNumber.toUpperCase() === payload.documentNumber.toUpperCase());
            if (elementFound(currentSessionIndex)) {
                const currentSessionData : SessionStore = sessionData[currentSessionIndex];
                logger.info(`[SESSION-MANAGER][SAVING-SESSION-DATA][${payload.documentNumber}]`);
                Object.keys(payload).forEach(key => sessionDataUpdateProperties(key, currentSessionData, payload));
                sessionData[currentSessionIndex] = currentSessionData;
            } else {
                logger.info(`[SESSION-MANAGER][ADDING-NEW-RECORD]`);
                sessionData.push(currentSessionStoreData);
            }
        } else {
            logger.info(`[SESSION-MANAGER][CREATING-SESSION-ARRAY]`);
            sessionData = [currentSessionStoreData]
        }

        await sessionStore.writeAllFor(userId, contactId, SESSION_DATA_KEY, sessionData);
    }

    logger.info("[SESSION-MANAGER][SAVING-SESSION-DATA][NEXT-ACTION]");
    return nextAction();
};

function sessionDataUpdateProperties(key: string, currentSessionData: SessionStore, payload: SessionData) {
    if (key === "landing") {
        logger.info(`[SESSION-MANAGER][UPDATING][LANDINGS]`);
        processSessionLandings(currentSessionData, payload);
    } else {
        logger.info(`[SESSION-MANAGER][UPDATING][ROOT-PROPERTIES]`);
        currentSessionData[key] = payload[key]
    }
}

function processSessionLandings(currentSessionData: SessionStore, payload: SessionData) {
    if (Array.isArray(currentSessionData.landings)) {
        const currentLandingIndex = currentSessionData.landings.findIndex(i => i.landingId === payload["landing"].landingId);
        if (elementFound(currentLandingIndex)) {
            logger.info(`[SESSION-MANAGER][UPDATING-LANDING][${payload["landing"].landingId}]`);
            currentSessionData.landings[currentLandingIndex] = payload.landing;
        }
        else {
            logger.info(`[SESSION-MANAGER][ADDING-NEW-LANDING][${payload["landing"].landingId}]`);
            currentSessionData.landings.push(payload.landing);
        }
    }
    else {
        currentSessionData.landings = [payload.landing];
    }
}

function removeUndefinedProperties(currentSessionStoreData: SessionStore) {
    Object.keys(currentSessionStoreData).forEach(key => currentSessionStoreData[key] === undefined && delete currentSessionStoreData[key]);
}

function elementFound(currentLandingIndex: number) {
    return currentLandingIndex >= 0;
}

const attempt = (actionToExecute) => {
    return actionToExecute
      .then(success => ([success, undefined]))
      .catch(error => Promise.resolve([undefined, error]));
  };

