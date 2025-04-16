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
    const { species, speciesCode, state, presentation, user_id, commodity_code, id } = payload;
    const data: FrontEndSpecies.Product[] = await CatchCertService.getSpecies(
      user_id,
      documentNumber,
      contactId
    );

    //Ensure the combination of: state, presentation and speciesCode have not already been added
    let hasDuplicate = false;
    if (data) {
      data.forEach((product: FrontEndSpecies.Product) => {
        const isDuplicated: boolean = id !== product.id &&
          state === product.state &&
          presentation === product.presentation &&
          commodity_code === product.commodity_code &&
          (speciesCode === product.speciesCode || species === product.species)

        if (isDuplicated) {
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
      FishService.addSpeciesToUpdateData(payloadCopy, speciesToUpdate, payload);

      await CatchCertService.upsertSpecies(userPrincipal, data, documentNumber, contactId);

      return speciesToUpdate;
    } else {
      data.push(payloadCopy);

      await CatchCertService.upsertSpecies(userPrincipal, data, documentNumber, contactId);

      return payloadCopy;
    }
  }

  static readonly addSpeciesToUpdateData = (
    payloadCopy: FrontEndSpecies.Product,
    speciesToUpdate: FrontEndSpecies.Product,
    payload: FrontEndSpecies.Product
  ) => {
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
