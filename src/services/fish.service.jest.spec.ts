import FishService from './fish.service';
import * as SUT from './fish.service';
import * as CatchCertService from '../persistence/services/catchCert';
import * as Redis from '../session_store/redis';
import { SessionStoreFactory } from '../session_store/factory';
import logger from '../logger';


jest.mock('uuid', () => ({ v4: () =>  'some-uuid'}));

const contactId = 'contactId';

describe('removeFish', () => {

  let mockGetSpecies;
  let mockUpsertSpecies;
  let mockGetSessionStore;
  let mockDeleteSpecies;
  let mockLogger;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
    mockUpsertSpecies = jest.spyOn(CatchCertService, 'upsertSpecies');
    mockDeleteSpecies = jest.spyOn(CatchCertService, 'deleteSpecies');
    mockLogger = jest.spyOn(logger, 'error');
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue({});
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
    mockUpsertSpecies.mockRestore();
    mockGetSessionStore.mockRestore();
    mockDeleteSpecies.mockRestore();
    mockLogger.mockRestore();
  });

  it('gets species from mongo, removes the one specified, and upserts the data back to mongo', async () => {
    const species1 = { id: 123, data: 'species 1' };
    const species2 = { id: 789, data: 'species 2' };

    mockGetSpecies.mockResolvedValue([species1, species2]);
    mockDeleteSpecies.mockResolvedValue([species2]);

    await FishService.removeFish({
      cancel: species1.id,
      user_id: 'Bob'
    },'GBR-34234-23423423-42444', contactId);

    expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34234-23423423-42444', contactId);
    expect(mockDeleteSpecies).toHaveBeenCalledWith("Bob", 123,'GBR-34234-23423423-42444', contactId);
  });

  it('will handle a thrown error', async () => {
    const error = new Error('some-thing-has-gone-wrong');
    const species1 = { id: 123, data: 'species 1' };
    const species2 = { id: 789, data: 'species 2' };

    mockGetSpecies.mockResolvedValue([species1, species2]);
    mockDeleteSpecies.mockRejectedValue(error);

    await expect(() => FishService.removeFish({
      cancel: species1.id,
      user_id: 'Bob'
    },'GBR-34234-23423423-42444', contactId)).rejects.toThrow();

    expect(mockLogger).toHaveBeenCalledWith(error);
  });

});

describe('editFish', () => {

  let mockGetSpecies;
  let mockUpsertSpecies;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
    mockUpsertSpecies = jest.spyOn(CatchCertService, 'upsertSpecies');
    mockUpsertSpecies.mockResolvedValue([]);
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
    mockUpsertSpecies.mockRestore()
  });

  describe('when editing or updating an existing product information', () => {
    it('should get species data from and save it to mongo', async () => {
      mockGetSpecies.mockResolvedValue([
        {user_id: 'Agent', id: '1234', species: 'HER', state: 'Fresh', presentation: 'Filleted', commodity_code: '12345678', commodity_code_description: 'some-description'},
        {user_id: 'Agent', id: 5678, species: 'HER', state: 'Fresh', presentation: 'Filleted'}
      ]);

      await FishService.editFish({user_id: 'Agent', id: '1234', species: 'Wedge sole', state: 'Frozen', presentation: 'Gutted', commodity_code: '12345678', commodity_code_description: 'updated-description'},'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Agent','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Agent', [
        {user_id: 'Agent', id: '1234', species: 'Wedge sole', state: 'Frozen', presentation: 'Gutted', commodity_code: '12345678', commodity_code_description: 'updated-description'},
        {user_id: 'Agent', id: 5678, species: 'HER', state: 'Fresh', presentation: 'Filleted'}
      ],'GBR-34442-3423423-234234', contactId);
    });

    it('should update species information only', async () => {
      mockGetSpecies.mockResolvedValue([
        { user_id: 'Agent', id: 5678, species: 'HER' }
      ]);

     const result = await FishService.editFish({ user_id: 'Agent', id: 5678, species: 'Wedge sole' },'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Agent','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Agent', [
        {user_id: 'Agent', id: 5678, species: 'Wedge sole' }
      ],'GBR-34442-3423423-234234', contactId);
      expect(result).toEqual([{
        user_id: 'Agent',
        id: 5678,
        species: 'Wedge sole'
      }])
    });
    });

    it('should update commodity code information of the product only', async () => {
      mockGetSpecies.mockResolvedValue([{user_id: 'Bob', id: '1234', species: 'HER', state: 'Fresh', presentation: 'Filleted', commodity_code: '12345678', commodity_code_description: 'some-description'}]);

      const result = await FishService.editFish({
        user_id: 'Bob',
        id: '1234',
        state: 'Frozen',
        presentation: 'Filleted',
        commodity_code: '87654321',
        commodity_code_description: 'updated-description'
      },'GBR-34442-3423423-234234', contactId);

      expect(result).toEqual([{
        user_id: 'Bob',
        id: '1234',
        state: 'Frozen',
        presentation: 'Filleted',
        commodity_code: '87654321',
        commodity_code_description: 'updated-description'
      }])
    });

    it('should update state and presentation information of the product only', async () => {
      mockGetSpecies.mockResolvedValue([
        { user_id: 'Agent', id: 5678, species: 'HER', state: 'Fresh', presentation: 'Filleted' }
      ]);

     const result = await FishService.editFish({ user_id: 'Agent', id: 5678, species: 'Wedge sole', state: 'Frozen', presentation: 'Gutted' },'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Agent','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Agent', [
        {user_id: 'Agent', id: 5678, species: 'Wedge sole', state: 'Frozen', presentation: 'Gutted' }
      ],'GBR-34442-3423423-234234', contactId);
      expect(result).toEqual([{
        user_id: 'Agent',
        id: 5678,
        species: 'Wedge sole',
        state: 'Frozen',
        presentation: 'Gutted'
      }])
    });
});

describe('saveFish', () => {
  let mockGetSessionStore;
  let mockGetRedisOptions;
  const mockWriteForAll = jest.fn();

  beforeEach(() => {
    mockGetSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockGetSessionStore.mockResolvedValue({
      writeAllFor: mockWriteForAll
    });

    mockGetRedisOptions = jest.spyOn(Redis, 'getRedisOptions');
    mockGetRedisOptions.mockReturnValue({});
  });

  afterEach(() => {
    mockGetSessionStore.mockRestore();
    mockGetRedisOptions.mockRestore();
  });

  it('should save fish to redis', async () => {
    const data = await FishService.save({
      id: '1234',
      user_id: 'Bob',
      state: 'Frozen'
    }, 'Bob', contactId);

    expect(mockGetSessionStore).toHaveBeenCalledWith({});
    expect(mockWriteForAll).toHaveBeenCalledWith('Bob', contactId, 'species', {
      id: '1234',
      user_id: 'Bob',
      state: 'Frozen'
    });
    expect(data).toEqual({
      id: '1234',
      user_id: 'Bob',
      state: 'Frozen'
    });
  })

})

describe('addedFish', () => {

  let mockGetSpecies;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
  });

  it('should call getSpecies', async () => {
    const expected = [{user_id: 'User 1', test: 'test 1'}];
    mockGetSpecies.mockReturnValue(expected);

    const result = await FishService.addedFish('User 1', undefined, contactId);

    expect(result).toStrictEqual(expected);
    expect(mockGetSpecies).toHaveBeenCalledWith('User 1',undefined, contactId);
  });

  it('should be able to call getSpecies with a docNumber', async () => {
    const expected = [{user_id: 'User 1', test: 'test 1'}];
    mockGetSpecies.mockReturnValue(expected);

    const result = await FishService.addedFish('User 1','GBR-3444-344-34444', contactId);

    expect(result).toStrictEqual(expected);
    expect(mockGetSpecies).toHaveBeenCalledWith('User 1','GBR-3444-344-34444', contactId);
  });

});

describe('isDuplicate', () => {

  let mockGetSpecies;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
    mockGetSpecies.mockResolvedValue([]);
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
  });

  it('should get species data from mongo', async () => {
    await FishService.isDuplicate({
      presentation: 'Filleted',
      state: 'Frozen',
      user_id: 'Bob'
    },'GBR-3444-3444-3444', contactId);

    expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-3444-3444-3444', contactId);
  });

  it('should return false for no duplicates when no data is found', async () => {
    mockGetSpecies.mockResolvedValue(null);

    const result = await FishService.isDuplicate({
      speciesCode: 'HER',
      species: 'Red Herring',
      presentation: 'Filleted',
      state: 'FRE',
      user_id: 'Bob'
    },'GBR-3444-3444-3444', contactId);

    expect(result).toBeFalsy();
  });

  it('should return false for no duplicates', async () => {
    mockGetSpecies.mockResolvedValue([{
      id: 'some-id',
      species: 'Atlantic Code',
      speciesCode: 'COD',
      scientificName: 'some-scientic-name',
      commodity_code: 'some-commodity-code',
      commodity_code_description: 'some-description',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      user_id: null,
      factor : 0,
      caughtBy : []
    }]);

    const result = await FishService.isDuplicate({
      speciesCode: 'HER',
      species: 'Red Herring',
      presentation: 'Filleted',
      commodity_code: 'new-commodity-code',
      state: 'FRE',
      user_id: 'Bob'
    },'GBR-3444-3444-3444', contactId);

    expect(result).toBeFalsy();
  });

  it('should return false for duplicates when updating same record again without do any changes', async () => {
    mockGetSpecies.mockResolvedValue([{
      id: 'some-id',
      species: 'Red Herring',
      speciesCode: 'HER',
      scientificName: 'some-scientic-name',
      commodity_code: 'some-commodity-code',
      commodity_code_description: 'some-description',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      user_id: null,
      factor : 0,
      caughtBy : []
    }]);

    const result = await FishService.isDuplicate({
      speciesCode: 'HER',
      species: 'Red Herring',
      commodity_code: 'some-commodity-code',
      state: 'FRE',
      presentation: 'WHL',
      user_id: 'Bob',
      id: 'some-id',
    },'GBR-3444-3444-3444', contactId);

    expect(result).toBeFalsy();
  });

  it('should return true for duplicates', async () => {
    mockGetSpecies.mockResolvedValue([{
      id: 'some-id',
      species: 'Red Herring',
      speciesCode: 'HER',
      scientificName: 'some-scientic-name',
      commodity_code: 'some-commodity-code',
      commodity_code_description: 'some-description',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      user_id: null,
      factor : 0,
      caughtBy : []
    }]);

    const result = await FishService.isDuplicate({
      speciesCode: 'HER',
      species: 'Red Herring',
      commodity_code: 'some-commodity-code',
      state: 'FRE',
      presentation: 'WHL',
      user_id: 'Bob'
    },'GBR-3444-3444-3444', contactId);

    expect(result).toBeTruthy();
  });

  it('should return true for duplicates based on species', async () => {
    mockGetSpecies.mockResolvedValue([{
      id: 'some-id',
      species: 'Red Herring',
      speciesCode: 'HER',
      scientificName: 'some-scientic-name',
      commodity_code: 'some-commodity-code',
      commodity_code_description: 'some-description',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      user_id: null,
      factor : 0,
      caughtBy : []
    }]);

    const result = await FishService.isDuplicate({
      species: 'Red Herring',
      commodity_code: 'some-commodity-code',
      state: 'FRE',
      presentation: 'WHL',
      user_id: 'Bob'
    },'GBR-3444-3444-3444', contactId);

    expect(result).toBeTruthy();
  });
});

describe('addFish', () => {

  let mockGetSpecies;
  let mockUpsertSpecies;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
    mockGetSpecies.mockResolvedValue([]);
    mockUpsertSpecies = jest.spyOn(CatchCertService, 'upsertSpecies');
    mockUpsertSpecies.mockResolvedValue([]);
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
  });

  describe('when adding a new fish', () => {
    it('should get species data and save it to mongo given no species are found', async () => {
      mockGetSpecies.mockResolvedValue(null);

      await FishService.addFish({user_id: 'Bob', id: '1234'},'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [{user_id: 'Bob', id: '1234'}],'GBR-34442-3423423-234234', contactId);
    });

    it('should get species data from and save it to mongo', async () => {
      await FishService.addFish({user_id: 'Bob', id: '1234'},'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [{user_id: 'Bob', id: '1234'}],'GBR-34442-3423423-234234', contactId);
    });

    it('should get species data from and save it to mongo with a new id', async () => {
      await FishService.addFish({user_id: 'Bob', id: undefined},'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [{user_id: 'Bob', id: 'GBR-34442-3423423-234234-some-uuid'}],'GBR-34442-3423423-234234', contactId);
    });


    it('should create an id when added from favourites', async () => {
      await FishService.addFish({ user_id: 'Bob', id: 'PRD1234' },'GBR-34442-3423423-234234',contactId, true);

      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [{user_id: 'Bob', id: 'GBR-34442-3423423-234234-some-uuid'}],'GBR-34442-3423423-234234', contactId);
    });
  });

  describe('when updating an existing fish', () => {
    it('should get species data from and save it to mongo', async () => {
      mockGetSpecies.mockResolvedValue([
        {user_id: 'Bob', id: '1234', species: 'HER', state: 'Fresh', presentation: 'Filleted'},
        {user_id: 'Bob', id: '5678', species: 'HER', state: 'Fresh', presentation: 'Filleted'}
      ]);

      await FishService.addFish({user_id: 'Bob', id: '1234', species: 'HER', state: 'Frozen', presentation: 'Filleted'},'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [
        {user_id: 'Bob', id: '1234', species: 'HER', state: 'Frozen', presentation: 'Filleted'},
        {user_id: 'Bob', id: '5678', species: 'HER', state: 'Fresh', presentation: 'Filleted'}
      ],'GBR-34442-3423423-234234', contactId);
    });

    it('should throw an error if payload is incomplete', async () => {
      mockGetSpecies.mockResolvedValue([
        { id: '1234', state: 'Fresh', presentation: 'Filleted'}
      ]);

      await expect(() => FishService.addFish({ id: '1234', user_id: 'Bob' },'GBR-34442-3423423-234234', contactId))
        .rejects
        .toThrow('I am not sure what is going on!');
    });

    it('should throw an error if payload is inconsistent', async () => {
      mockGetSpecies.mockResolvedValue([
        { id: '1234', state: 'Fresh', presentation: 'Filleted'}
      ]);

      await expect(() => FishService.addFish({ id: '1234', user_id: 'Bob', state: 'Frozen', presentation: 'Filleted' },'GBR-34442-3423423-234234', contactId))
        .rejects
        .toThrow('The species is in an inconsistent state for the second call');
    });

    it('should update species information only', async () => {
      mockGetSpecies.mockResolvedValue([
        { user_id: 'Bob', id: '1234', species: 'HER' }
      ]);

      await FishService.addFish({ user_id: 'Bob', id: '1234', species: 'HER' },'GBR-34442-3423423-234234', contactId);

      expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-34442-3423423-234234', contactId);
      expect(mockUpsertSpecies).toHaveBeenCalledWith('Bob', [
        {user_id: 'Bob', id: '1234', species: 'HER' }
      ],'GBR-34442-3423423-234234', contactId);
    });

    it('should update commodity code information', async () => {
      mockGetSpecies.mockResolvedValue([
        { user_id: 'Bob', id: '1234', species: 'HER' }
      ]);

      const result = await FishService.addFish({
        user_id: 'Bob',
        id: '1234',
        commodity_code: '12345678',
        commodity_code_description: 'some-description'
      },'GBR-34442-3423423-234234', contactId);

      expect(result).toEqual({
        user_id: 'Bob',
        id: '1234',
        species: 'HER',
        commodity_code: '12345678',
        commodity_code_description: 'some-description'
      })
    });
  });

});

describe('hasFish', () => {
  const userPrincipal: string = 'Bob';
  const documentNumber: string = 'GBR-XXXX-CC-XXXXXXXXXX';

  let mockGetSpecies;

  beforeEach(() => {
    mockGetSpecies = jest.spyOn(CatchCertService, 'getSpecies');
  });

  afterEach(() => {
    mockGetSpecies.mockRestore();
  });

  it('should return false', async () => {
    mockGetSpecies.mockResolvedValue([]);

    const valid = await FishService.hasFish(userPrincipal, documentNumber, contactId);

    expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-XXXX-CC-XXXXXXXXXX', contactId);
    expect(valid).toBeFalsy();
  });

  it('should return true', async () => {
    mockGetSpecies.mockResolvedValue([{ id: 'blah' }]);

    const valid = await FishService.hasFish(userPrincipal, documentNumber, contactId);

    expect(mockGetSpecies).toHaveBeenCalledWith('Bob','GBR-XXXX-CC-XXXXXXXXXX', contactId);
    expect(valid).toBeTruthy();
  });
});

describe('must have keys', () => {

  it('should return false for undefined', () => {
    expect(SUT.mustHaveKeys(undefined, ['unknown'])).toBeFalsy();
  });

  it('should return false', () => {
    expect(SUT.mustHaveKeys({
      id: '1234',
      user_id: 'Bob',
      state: 'Frozen'
    }, ['state','presentation','user_id'])).toBeFalsy();
  });

  it('should return true', () => {
    expect(SUT.mustHaveKeys({
      id: '1234',
      user_id: 'Bob',
      state: 'Frozen',
      presentation: 'Filleted'
    }, ['state','presentation','user_id'])).toBeTruthy();
  });
});