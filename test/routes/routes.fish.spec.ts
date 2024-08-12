import * as nock from 'nock';
import { eraseSpecies, serverTest } from '../testHelpers';
import { MySpecies } from '../../src/validators/interfaces/species.interface';
import { SessionStoreFactory } from '../../src/session_store/factory';
import {SPECIES_KEY} from '../../src/session_store/constants';
import ApplicationConfig from '../../src/applicationConfig';

const USER_ID     = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

import logger from '../../src/logger';

serverTest('[GET] /v1/fish/added should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'GET',
    url: '/v1/fish/added',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] / species / should save correctly a new species (first call) - 1',
  async (server, t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await eraseSpecies(sessionStore, USER_ID);
    const data = {
      faoCode: "COD",
      faoName: "Atlantic cod"
    };

    nock(ApplicationConfig.getReferenceServiceUrl())
    .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
    .reply(200, data);

    const response = await server.inject({
      method: 'POST',
      url: '/v1/fish/add',
      payload: {
        species: 'Atlantic cod (COD)',
        speciesCode: 'COD',
        redirect: '/fish/add',
      },
        app: {
            claims: {
              sub: '123456789'
            }
        }
    });

    const parsedSpecies = <MySpecies[]>await sessionStore.readAllFor(USER_ID, SPECIES_KEY);
    if (!parsedSpecies.length) {
      throw new Error('The file is empty. D\'oh');
    }
    t.equals(parsedSpecies[0].species, 'Atlantic cod (COD)', 'The species is saved correctly');
    t.equals(!!parsedSpecies[0].user_id, true, 'The user_id is saved correctly');
    t.equals(!!parsedSpecies[0].id, true, 'The id is saved correctly');
    t.equals(response.statusCode, 200, 'Status code is 200');

  } catch(e) {
    logger.error(e);
  }
});

serverTest('[POST] / species / should throw an error if data is incomplete (first call)',
  async (server, t) => {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);
  const response = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    payload: {
      species: 'boo',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[POST] / species / should redirect as error if data is incomplete (first call) - Non JS',
  async (server, t) => {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);
  const response = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    headers: {accept: 'text/html'},
    payload: {
      species: 'boo',
      redirect: '/create-catch-certificate/what-are-you-exporting'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest('[POST] / species / should throw an error if data is pertinent to another call (first call)',
  async (server, t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);
  const response = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    payload: {
      commodity_code: '234',
      id: '234',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest('[POST] / species / should save correctly a new species with presentation and state (first call)',
  async (server, t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);

  const data = {
    faoCode: "COD",
    faoName: "Atlantic cod"
  };

  nock(ApplicationConfig.getReferenceServiceUrl())
  .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
  .reply(200, data);

  const firstCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      redirect: '/fish/add',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  const secondCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    payload: {
      state: 'FRO',
      presentation: 'HEA',
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      id: JSON.parse(firstCall.payload).id,
      redirect: '/fish/add'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });

  const thirdCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      state: 'FRO',
      presentation: 'HEA',
      commodity_code: '03036330',
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      id: JSON.parse(firstCall.payload).id,
      redirect: '/fish/add'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });

  const parsedSpecies = <MySpecies[]>await sessionStore.readAllFor(USER_ID, SPECIES_KEY);
  if (!parsedSpecies.length) {
    throw new Error('The file is empty. D\'oh');
  }
  t.equals(parsedSpecies.length, 1, 'There is a result');
  t.equals(parsedSpecies[0].species, 'Atlantic cod (COD)', 'The species is set');
  t.equals(!!parsedSpecies[0].user_id, true, 'The record has a user id');
  t.equals(!!parsedSpecies[0].id, true, 'The record has an id');
  t.equals(secondCall.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] / species / you cannot post carp',
  async (server, t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);
  const data = {
    faoCode: "COD",
    faoName: "Atlantic cod"
  };

  nock(ApplicationConfig.getReferenceServiceUrl())
  .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
  .reply(200, data);

  const firstCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      redirect: '/fish/add',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(firstCall.statusCode, 200, 'Status code is 200');
  const secondCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    payload: {
      state: 'FRO',
      commodity_code: 'HEA',
      id: JSON.parse(firstCall.payload).id,
      redirect: '/fish/add',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  t.equals(secondCall.statusCode, 400, 'Status code is 400');
});

serverTest('[POST] / species / should eliminate a species if you press cancel',
  async (server, t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);
  const data = {
    faoCode: "COD",
    faoName: "Atlantic cod"
  };

  nock(ApplicationConfig.getReferenceServiceUrl())
  .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
  .reply(200, data);

  const firstCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      redirect: '/fish/add',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });
  const secondCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      cancel: JSON.parse(firstCall.payload).id,
      user_id: USER_ID,
      redirect: '/fish/add'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }

  });

  const parsedSpecies = <MySpecies[]>await sessionStore.readAllFor(USER_ID, SPECIES_KEY);
  t.equals(firstCall.statusCode, 200, 'Status code of the first call is 200');
  t.equals(secondCall.statusCode, 200, 'Status code of the second call is 200');
  t.equals(parsedSpecies.length, 0, 'The result should be empty');
});

serverTest('[POST] / species / should throw an error if data contains a species combination already added',
  async (server, t) => {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
  await eraseSpecies(sessionStore, USER_ID);

  const data = {
    name: 'Atlantic Cod'
  };
  nock(ApplicationConfig.getReferenceServiceUrl())
  .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
  .reply(200, data);

  const firstCall = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',

    payload: {
      species: 'Atlantic cod (COD)',
      redirect: '/fish/add',
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });

  await sessionStore.writeAllFor(USER_ID, SPECIES_KEY, <MySpecies[]>[{
    species: 'Atlantic cod (COD)',
    speciesCode: 'COD',
    user_id: USER_ID,
    presentation: 'HEA',
    state: 'FRO',
    id: '123'
  }]);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/fish/add',
    payload: {
      state: 'FRO',
      presentation: 'HEA',
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      id: JSON.parse(firstCall.payload).id,
      redirect: '/fish/add'
    },
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
  t.equals(response.result[0], 'The combination of species, state, presentation and commodity code must be unique for each product');
});
