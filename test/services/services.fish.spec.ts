import Service from '../../src/services/fish.service';
import * as test from 'tape';
import { eraseSpecies } from '../testHelpers';
const sinon = require('sinon');

import { SessionStoreFactory } from '../../src/session_store/factory';
import { getRedisOptions } from '../../src/session_store/redis';
import { SPECIES_KEY } from '../../src/session_store/constants';
import { MySpecies } from '../../src/validators/interfaces/species.interface';
import logger from '../../src/logger';

const USER_ID     = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const completed = {
  presentation: 'FIL',
  state: 'FRO',
  species: 'Cod',
  speciesCode: 'COD',
  commodity_code: '12ABC',
  user_id: USER_ID,
  stateLabel: 'Frozen',
  presentationLabel: 'Filleted',
  id: 'foo'
};

const mockMultiple = [
  {
    user_id: completed.user_id,
    id: '233AA',
    species: completed.species
  },
  { 
    user_id: completed.user_id,
    id: 'abcd',
    species: 'manzo'
  }
];

const initialiseSessionStore = async (id: string) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, id);
  return sessionStore;
}

const shouldUpdateProperties = async (t, payload, defaultStored = {}, expectError = null) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await eraseSpecies(sessionStore, USER_ID);
    await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, [{ id: completed.id, ...defaultStored }] as any);
    const result = await Service.addFish({
      id: completed.id,
      ...payload,
      user_id: completed.user_id
    });
    Object.keys(payload).forEach((key) => {
      t.assert(result.hasOwnProperty(key), `Result should have property ${key}`);
      t.deepEquals(result[key], payload[key]);
    });
    t.end();
  } catch (e) {
    if (expectError) {
      expectError(e);
    } else {
      t.end(e);
    }
  }
};

const addMultipleSpecies = async () => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, <MySpecies[]>mockMultiple);
};

test('FishService.addFish - when invoked without an id, it creates a new record', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await eraseSpecies(sessionStore, USER_ID);
    await Service.addFish({
      species: completed.species,
      speciesCode: completed.speciesCode,
      user_id: completed.user_id
    });

    let savedSpecies = <MySpecies[]>await sessionStore.readAllFor(USER_ID, SPECIES_KEY);
    const datum = savedSpecies[0];
    t.equals(datum.user_id, completed.user_id);
    t.equals(datum.species, completed.species);
    t.equals(datum.speciesCode, completed.speciesCode);
    t.equals(!!datum.id, true);
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('FishService.addFish - Should throw an error when invoked without data but with an id', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await eraseSpecies(sessionStore, USER_ID);
    await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, [{ id: completed.id }] as any);

    let error;
    try {
      await Service.addFish({
        user_id: completed.user_id,
        id: completed.id
      });
    } catch (e) {
      error = e;
    }

    t.assert(error);
    t.equals(error.message, 'I am not sure what is going on!');
    t.end();

  } catch (e) {
    t.end(e);
  }
});

test('FishService.addFish - Should update commodity_code', async (t) => {
  await shouldUpdateProperties(t, { commodity_code: completed.commodity_code });
});

test('FishService.addFish - Should update species, speciesCode', async (t) => {
  await shouldUpdateProperties(t, { species: completed.species, speciesCode: completed.speciesCode });
});

test('FishService.addFish - Should update state, stateLabel, presentation, presentationLabel', async (t) => {
  await shouldUpdateProperties(t,
    {
      state: completed.state,
      stateLabel: completed.stateLabel,
      presentation: completed.presentation,
      presentationLabel: completed.presentationLabel
    },
    {
      species: completed.species,
      user_id: completed.user_id,
      id: completed.id
    }
  );
});

test('FishService.addFish - Should throw an error if trying to add details when the species data is corrupted', async (t) => {
  let error;
  await shouldUpdateProperties(t,
    {
      state: completed.state,
      stateLabel: completed.stateLabel,
      presentation: completed.presentation,
      presentationLabel: completed.presentationLabel
    }, {}, (e) => {
      error = e;
    }
  );
  
  t.assert(error);
  t.equals(error.message, 'The species is in an inconsistent state for the second call');
  t.end();
  
});

test('FishService.removeFish  - removes the fish by id', async (t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  try {
    await addMultipleSpecies();

    await Service.removeFish({
      cancel: 'abcd',
      user_id: completed.user_id
    });

    let savedSpecies = <MySpecies[]>await sessionStore.readAllFor(USER_ID, SPECIES_KEY);
    t.deepEqual(savedSpecies, [mockMultiple[0]]);
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('FishService.removeFish  - throws an error if writeAllFor/readAllFor fails', async (t) => {
  let error;
  let sessionStoreMock;
  try {
    await addMultipleSpecies();
    sessionStoreMock = sinon.stub(SessionStoreFactory, 'getSessionStore').resolves(Promise.reject(new Error('e')));
    await Service.removeFish({
      cancel: 'abcd',
      user_id: completed.user_id
    });
    t.assert(false,'Should not get here');
  } catch (e) {
    error = e;
  }
  
  t.assert(error);
  t.equals(error.message, 'Cannot writeAllFor or readAllFor to species file');
  sessionStoreMock.restore();
  t.end();
});

test('FishService.addedFish - Gets fish added for a user', async (t) => {
  try {
    await addMultipleSpecies();
    
    const result = await Service.addedFish(completed.user_id);
    t.deepEquals(result, mockMultiple);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishService.addedFish - throws an error if readAllFor fails', async (t) => {
  let error;
  let sessionStoreMock;
  try {
    await addMultipleSpecies();
    sessionStoreMock = sinon.stub(SessionStoreFactory, 'getSessionStore').resolves(Promise.reject(new Error('e')));
    const result = await Service.addedFish(completed.user_id);
    t.assert(false,'Should not get here');
  } catch (e) {
    error = e;
  }
  
  t.assert(error);
  t.equals(error.message, 'Eh! does not work');
  sessionStoreMock.restore();
  t.end();
});

test('FishService.save - Should store species details for user', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await eraseSpecies(sessionStore, completed.user_id);
    const result  = await Service.save(completed, completed.user_id);
    const data = await sessionStore.readAllFor(completed.user_id, SPECIES_KEY);
    t.deepEquals(result, completed);
    t.deepEquals(data, completed);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishService::isDuplicate returns true if adding the same species', async (t) => {
  try {
    const sessionStore = await initialiseSessionStore(SPECIES_KEY);
    await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, <MySpecies[]>[{
      species: completed.species,
      speciesCode: completed.speciesCode,
      user_id: completed.user_id,
      presentation: completed.presentation,
      state: completed.state,
      id: '123'
    }]);

    const result = await Service.isDuplicate({
      species: completed.species,
      speciesCode: completed.speciesCode,
      state: completed.state,
      presentation: completed.presentation,
      user_id: completed.user_id,
    });
    
    t.equals(result, true);
    t.end();

  } catch(e) {
    logger.error(e);
  }
});

test('FishService::isDuplicate returns false if not adding the same species', async (t) => {
  try {
    const sessionStore = await initialiseSessionStore(SPECIES_KEY);
    await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, <MySpecies[]>[{
      species: completed.species,
      speciesCode: completed.speciesCode,
      user_id: completed.user_id,
      presentation: completed.presentation,
      state: completed.state,
      id: '123'
    }]);

    const result = await Service.isDuplicate({
      species: completed.species,
      speciesCode: completed.speciesCode,
      state: "ALI",
      presentation: completed.presentation,
      user_id: completed.user_id,
    });
    
    t.equals(result, false);
    t.end();

  } catch(e) {
    logger.error(e);
  }
});

test('FishService::isDuplicate returns false if presentation, state and user_id values are not found', async (t) => {
  const result = await Service.isDuplicate({
    speciesCode: "ELB",
  });
  
  t.equal(result, false);
  t.end();
});