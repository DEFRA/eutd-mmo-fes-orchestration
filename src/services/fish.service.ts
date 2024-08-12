import { v4 as uuidv4 } from 'uuid';
import * as FrontEndSpecies from '../persistence/schema/frontEndModels/species';
import * as CatchCertService from '../persistence/services/catchCert';
import { getRedisOptions } from '../session_store/redis';
import { SPECIES_KEY } from '../session_store/constants';
import { SessionStoreFactory } from '../session_store/factory';
import { reject, findIndex } from 'lodash';
import logger from '../logger';

export default class FishService {
  public static async removeFish(payload: any, documentNumber: string, contactId: string) {
    const userPrincipal = payload.user_id;

    try {
      const data = await CatchCertService.getSpecies(
        userPrincipal,
        documentNumber,
        contactId
      );

      reject(data, (f: FrontEndSpecies.Product) => f.id === payload.cancel);

      await CatchCertService.deleteSpecies(
        userPrincipal,
        payload.cancel,
        documentNumber,
        contactId
      );
    } catch (e) {
      logger.error(e);
      throw new Error("Cannot writeAllFor or readAllFor to species file");
    }
  }

  public static async editFish(payload: any, documentNumber: string, contactId: string) {
    const userPrincipal = payload.user_id;
    const data: FrontEndSpecies.Product[] = await CatchCertService.getSpecies(userPrincipal, documentNumber, contactId) || [];
    const speciesToUpdate =
      data[
        findIndex(data, (s: FrontEndSpecies.Product) => s.id === payload.id)
      ];

    if (speciesToUpdate) {
      speciesToUpdate.state = payload.state;
      speciesToUpdate.stateLabel = payload.stateLabel;
      speciesToUpdate.presentation = payload.presentation;
      speciesToUpdate.presentationLabel = payload.presentationLabel;
      speciesToUpdate.species = payload.species;
      speciesToUpdate.speciesCode = payload.speciesCode;
      speciesToUpdate.scientificName = payload.scientificName;
      speciesToUpdate.commodity_code = payload.commodity_code;
      speciesToUpdate.commodity_code_description =
        payload.commodity_code_description;
    }

    await CatchCertService.upsertSpecies(userPrincipal, data, documentNumber, contactId);

    return data;
  }

  public static async isDuplicate(payload, documentNumber, contactId: string) {
    const { speciesCode, presentation, user_id, commodity_code } = payload;
    const data: FrontEndSpecies.Product[] = await CatchCertService.getSpecies(
      user_id,
      documentNumber,
      contactId
    );

    //Ensure the combination of: state, presentation and speciesCode have not already been added
    let hasDuplicate = false;
    if (data) {
      data.forEach((species: FrontEndSpecies.Product) => {
        if (
          payload.state === species.state &&
          presentation === species.presentation &&
          commodity_code === species.commodity_code &&
          (speciesCode === species.speciesCode ||
            payload.species === species.species)
        ) {
          hasDuplicate = true;
        }
      });
    }

    if (hasDuplicate) {
      return true;
    }

    return false;
  }

  public static async hasFish(
    userPrincipal: string,
    documentNumber: string,
    contactId: string
  ): Promise<boolean> {
    const data = await CatchCertService.getSpecies(
      userPrincipal,
      documentNumber,
      contactId
    );

    return data && data.length > 0;
  }

  public static async addFish(payload: FrontEndSpecies.Product, documentNumber: string, contactId: string, isFavourite: boolean = false) {
    const userPrincipal = payload.user_id;
    const data =
      (await CatchCertService.getSpecies(userPrincipal, documentNumber, contactId)) || [];

    const payloadCopy: FrontEndSpecies.Product = { ...payload };
    let speciesToUpdate: FrontEndSpecies.Product;

    if (!payloadCopy.id || isFavourite) {
      payloadCopy.id = `${documentNumber}-${uuidv4()}`;
      payloadCopy.user_id = payload.user_id;
    } else {
      // see if it exists
      speciesToUpdate = data.find((species: FrontEndSpecies.Product) => species.id === payloadCopy.id);
    }

    if (speciesToUpdate) {
      if (
        payloadCopy.state &&
        payloadCopy.presentation &&
        payloadCopy.user_id
      ) {
        if (!mustHaveKeys(speciesToUpdate, ["species", "user_id", "id"])) {
          throw new Error(
            "The species is in an inconsistent state for the second call"
          );
        }
        speciesToUpdate.state = payload.state;
        speciesToUpdate.stateLabel = payload.stateLabel;
        speciesToUpdate.presentation = payload.presentation;
        speciesToUpdate.presentationLabel = payload.presentationLabel;
      } else if (payload.species && payload.user_id) {
        speciesToUpdate.species = payload.species;
        speciesToUpdate.speciesCode = payload.speciesCode;
        speciesToUpdate.scientificName = payload.scientificName;
      } else if (payload.commodity_code && payload.user_id) {
        speciesToUpdate.commodity_code = payload.commodity_code;
        speciesToUpdate.commodity_code_description =
          payload.commodity_code_description;
      } else {
        throw new Error("I am not sure what is going on!");
      }

      await CatchCertService.upsertSpecies(userPrincipal, data, documentNumber, contactId);

      return speciesToUpdate;
    } else {
      data.push(payloadCopy);

      await CatchCertService.upsertSpecies(userPrincipal, data, documentNumber, contactId);

      return payloadCopy;
    }
  }

  public static async addedFish(user_id: string, documentNumber: string, contactId: string) {
    return await CatchCertService.getSpecies(user_id, documentNumber, contactId);
  }

  public static async save(data, userId: string, contactId: string): Promise<any> {
    const sessionStore = await SessionStoreFactory.getSessionStore(
      getRedisOptions()
    );
    await sessionStore.writeAllFor(userId, contactId, SPECIES_KEY, data);
    return data;
  }
}

export function mustHaveKeys(obj: FrontEndSpecies.Product, keys: string[]) {
  if (!obj) {
    return false;
  }
  return keys.every(key => !!Object.prototype.hasOwnProperty.call(obj, key));
}
