import {IProduct, UserAttributesModel} from '../schema/userAttributes';
import * as Favourites from './favourites';
import * as UserAttributes from './userAttributes';

import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import applicationConfig from '../../applicationConfig';

describe('Favourites', () => {

  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";

  let mongoServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});
  });

  afterEach(async() => {
    await UserAttributesModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const mockUserFavouritesEntry = {
    userPrincipal: USER_ID,
    attributes: [],
    favourites : {
      products : [
        {
          id : 'PRD001',
          species: 'Atlantic COD',
          speciesCode: 'COD',
          scientificName: 'CODsdus',
          state: 'FRE',
          stateLabel: 'Fresh',
          presentation: 'HEA',
          presentationLabel: 'Headed',
          commodity_code: '0980980808',
          commodity_code_description: 'many words',
        }
      ]
    }
  };


  beforeEach(async () => {
    await new UserAttributesModel(mockUserFavouritesEntry).save();
  });

  describe('readFavourites', () => {

    let mockFind ;

    beforeEach(()=> {
      mockFind = jest.spyOn(UserAttributes, 'find');
    });

    afterEach(() => {
      mockFind.mockRestore();
    });

    it('should return null if a none existing userPrincipal is passed', async () => {
      mockFind.mockResolvedValue(null);
      const result = await Favourites.readFavourites('nonExitingUser');
      expect(result).toEqual(null)
    });

    it('should return the favourites when pass a valid userPrincipal', async () => {
      mockFind.mockResolvedValue(mockUserFavouritesEntry);
      const result = await Favourites.readFavourites(USER_ID);
      expect(result).toEqual(mockUserFavouritesEntry.favourites);
    });

  });

  describe('readFavouritesProducts', () => {

    let mockReadFavourites;

    beforeEach(()=>{
      mockReadFavourites = jest.spyOn(Favourites,'readFavourites');
    });

    afterEach(()=>{
      mockReadFavourites.mockRestore();
    });

    it('should return null if a none existing userPrincipal is passed', async () => {
      mockReadFavourites.mockResolvedValue(null);
      const result = await Favourites.readFavouritesProducts('nonExitingUser');
      expect(mockReadFavourites).toHaveBeenCalledTimes(1);
      expect(result).toEqual(null)
    });

    it('should return favourites products when pass a valid userPrincipal', async () => {
      mockReadFavourites.mockResolvedValue(mockUserFavouritesEntry.favourites);
      const result = await Favourites.readFavouritesProducts(USER_ID);
      expect(mockReadFavourites).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserFavouritesEntry.favourites.products);
    });
  });

  describe('saveFavouritesProduct', ()=>{

    const newProduct = {
      species: 'New Atlantic COD',
      speciesCode: 'New COD',
      scientificName: 'New CODsdus',
      state: 'New FRE',
      stateLabel: 'New Fresh',
      presentation: 'New HEA',
      presentationLabel: 'New Headed',
      commodity_code: 'New 0980980808',
      commodity_code_description: 'New many words',
    };

    let mockFind ;
    let mockProductAlreadyExist;
    let mockGenerateFavouriteId;

    beforeEach(()=> {
      mockFind = jest.spyOn(UserAttributes, 'find');
      mockProductAlreadyExist = jest.spyOn(Favourites, 'productAlreadyExist');
      mockGenerateFavouriteId = jest.spyOn(Favourites, 'generateFavouriteId');
      mockGenerateFavouriteId.mockReturnValue('123');
    });

    afterEach(() => {
      mockFind.mockRestore();
      mockProductAlreadyExist.mockRestore();
      mockGenerateFavouriteId.mockRestore();
    });

    it('should add new userAttribute entry if userPrincipal no entry no exist already', async () => {
      mockFind.mockResolvedValue(null);
      delete mockUserFavouritesEntry.favourites.products[0].id;
      const result = await Favourites.saveFavouritesProduct('new-user-id',mockUserFavouritesEntry.favourites.products[0]);
      const expectedResult = await UserAttributesModel.findOne({userPrincipal:'new-user-id'}).lean(true);
      expect(expectedResult.userPrincipal).toEqual('new-user-id');
      expect(expectedResult.attributes).toEqual([]);
      expect(expectedResult.favourites.products.length).toEqual(1);
      expect(expectedResult.favourites.products[0].id).not.toEqual(null);
      expect(result.length).toEqual(1);
      expect(result).toEqual([
        {
          id : '123',
          ...mockUserFavouritesEntry.favourites.products[0],
        }
      ]);
    });

    it('should no call  productAlreadyExist and once generateFavouriteId if userPrincipal no entry no exist already', async () => {
      mockFind.mockResolvedValue(null);
      delete mockUserFavouritesEntry.favourites.products[0].id;
      await Favourites.saveFavouritesProduct('new-user-id',mockUserFavouritesEntry.favourites.products[0]);
      expect(mockProductAlreadyExist).toHaveBeenCalledTimes(0);
      expect(mockGenerateFavouriteId).toHaveBeenCalledTimes(1);
    });


    it('should add product if userAttributes entry already exist', async () => {
      mockFind.mockResolvedValue(mockUserFavouritesEntry);
      mockProductAlreadyExist.mockReturnValue(false);
      const result = await Favourites.saveFavouritesProduct(USER_ID,newProduct);
      const expectedResult = await UserAttributesModel.findOne({userPrincipal:USER_ID}).lean(true);
      expect(expectedResult.userPrincipal).toEqual(USER_ID);
      expect(expectedResult.attributes).toEqual([]);
      expect(expectedResult.favourites.products[1]).toEqual(newProduct);
      expect(expectedResult.favourites.products.length).toEqual(2);
      expect(result).toEqual([
        {
          ...mockUserFavouritesEntry.favourites.products[0],
        },
        {
          id : '123',
          ...newProduct
        }
      ]);
    });

    it('should add favourites if the favourites property do not exits', async () => {
      const mockNoFavouritesProperty = {...mockUserFavouritesEntry};
      mockNoFavouritesProperty.userPrincipal = 'other-user-id';
      delete mockNoFavouritesProperty.favourites;
      await new UserAttributesModel(mockUserFavouritesEntry).save();

      mockFind.mockResolvedValue(mockNoFavouritesProperty);
      mockProductAlreadyExist.mockReturnValue(false);

      await Favourites.saveFavouritesProduct('other-user-id',newProduct);
      const savedResult = await UserAttributesModel.findOne({userPrincipal: 'other-user-id'}).lean(true);

      expect(savedResult.favourites).toEqual({ products : [newProduct]});

    });

    it('should add products if the products property do not exits', async () => {
      const mockNoFavouritesProperty = {...mockUserFavouritesEntry};
      mockNoFavouritesProperty.userPrincipal = 'other-user-id';
      delete mockNoFavouritesProperty.favourites.products;
      await new UserAttributesModel(mockUserFavouritesEntry).save();

      mockFind.mockResolvedValue(mockNoFavouritesProperty);
      mockProductAlreadyExist.mockReturnValue(false);

      await Favourites.saveFavouritesProduct('other-user-id',newProduct);
      const savedResult = await UserAttributesModel.findOne({userPrincipal: 'other-user-id'}).lean(true);

      expect(savedResult.favourites.products).toEqual([newProduct]);

    });

    it('should call once productAlreadyExist and generateFavouriteId if userAttributes entry already exist', async () => {
      mockFind.mockResolvedValue(mockUserFavouritesEntry);
      mockProductAlreadyExist.mockReturnValue(false);
      await Favourites.saveFavouritesProduct(USER_ID,newProduct);
      expect(mockProductAlreadyExist).toHaveBeenCalledTimes(1);
      expect(mockGenerateFavouriteId).toHaveBeenCalledTimes(1);
    });

    it('should return null  if product already exist', async () => {
      mockFind.mockResolvedValue(mockUserFavouritesEntry);
      mockProductAlreadyExist.mockReturnValue(true);

      const mockSave = jest.spyOn(UserAttributes, 'save').mockResolvedValue(null);
      const result = await Favourites.saveFavouritesProduct(USER_ID,mockUserFavouritesEntry.favourites.products[0]);
      mockSave.mockRestore();

      expect(result).toEqual(null)

    });

    it('should no call generateFavouriteId if product already exist', async () => {
      mockFind.mockResolvedValue(mockUserFavouritesEntry);
      mockProductAlreadyExist.mockReturnValue(true);
      await Favourites.saveFavouritesProduct(USER_ID,mockUserFavouritesEntry.favourites.products[0]);
      expect(mockGenerateFavouriteId).toHaveBeenCalledTimes(0);
    });

  });

  describe('delete favourites product', ()=> {

    const productId = 'PRD023';
    let mockFind;
    let mockSave;

    beforeEach(()=> {
      mockFind = jest.spyOn(UserAttributes, 'find');
      mockSave = jest.spyOn(UserAttributes, 'save');
      mockSave.mockResolvedValue(null);
    });

    afterEach(()=>{
      jest.restoreAllMocks()
    });

    it('should call find once with the right params', async () => {
      mockFind.mockResolvedValue(null);
      await Favourites.deleteFavouritesProduct(USER_ID,productId);
      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(mockFind).toHaveBeenCalledWith(USER_ID)
    });

    it('should return null is there is no products', async () => {
      mockFind.mockResolvedValue(null);
      const result = await Favourites.deleteFavouritesProduct(USER_ID,productId);
      expect(result).toEqual(null)
    });

    it('should call save once with the right params if there are products', async () => {
      const mockFavouritesTodelete = {...mockUserFavouritesEntry};
      mockFavouritesTodelete.favourites.products.push({
        id : productId,
        species: 'todelete Atlantic COD',
        speciesCode: 'todelete COD',
        scientificName: 'todelete CODsdus',
        state: 'FRE',
        stateLabel: 'Fresh',
        presentation: 'HEA',
        presentationLabel: 'Headed',
        commodity_code: 'todelete 0980980808',
        commodity_code_description: 'many words',
      });
      mockFind.mockResolvedValue(mockFavouritesTodelete);
      mockSave.mockResolvedValue(null);
      await Favourites.deleteFavouritesProduct(USER_ID,productId);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(mockUserFavouritesEntry)
    });

    it('should sould return the new list od products if there are products', async () => {
      const mockFavouritesTodelete = {...mockUserFavouritesEntry};
      mockFavouritesTodelete.favourites.products.push({
        id : productId,
        species: 'todelete Atlantic COD',
        speciesCode: 'todelete COD',
        scientificName: 'todelete CODsdus',
        state: 'FRE',
        stateLabel: 'Fresh',
        presentation: 'HEA',
        presentationLabel: 'Headed',
        commodity_code: 'todelete 0980980808',
        commodity_code_description: 'many words',
      });
      mockFind.mockResolvedValue(mockFavouritesTodelete);
      mockSave.mockResolvedValue(null);
      const result = await Favourites.deleteFavouritesProduct(USER_ID,productId);
      expect(result).toEqual(mockUserFavouritesEntry.favourites.products)
    });

  });

});

describe('helper functions', ()=> {
  const mockProducts : IProduct[] = [
    {
      id: 'PRD001',
      species: '1 Atlantic COD',
      speciesCode: '1 COD',
      scientificName: '1 CODsdus',
      state: '1 FRE',
      stateLabel: '1 Fresh',
      presentation: '1 HEA',
      presentationLabel: '1 Headed',
      commodity_code: '1 0980980808',
      commodity_code_description: '1 many words',
    },
    {
      id: 'PRD022',
      species: '2 Atlantic COD',
      speciesCode: '2 COD',
      scientificName: '2 CODsdus',
      state: '2 FRE',
      stateLabel: '2 Fresh',
      presentation: '2 HEA',
      presentationLabel: '2 Headed',
      commodity_code: '2 0980980808',
      commodity_code_description: '2 many words',
    },
    {
      id: 'PRD008',
      species: '3 Atlantic COD',
      speciesCode: '3 COD',
      scientificName: '3 CODsdus',
      state: '3 FRE',
      stateLabel: '3 Fresh',
      presentation: '3 HEA',
      presentationLabel: '3 Headed',
      commodity_code: '3 0980980808',
      commodity_code_description: '3 many words',
    }
  ];

  describe('generateFavouriteId', ()=> {
    let mockRandom;

    beforeAll(() => {
      mockRandom = jest.spyOn(Math, 'random');
    });

    afterAll(() => {
      mockRandom.mockRestore();
    });

    it('should generated a id that is no present already in the product array', () => {
      mockRandom.mockReturnValueOnce(0);
      mockRandom.mockReturnValueOnce(0);
      mockRandom.mockReturnValueOnce(0.99999999999);

      const newId = Favourites.generateFavouriteId(['PRD001']);

      expect(newId).toBe('PRD999');
    });

    it('should generate a minimum id of PRD001', () => {
      mockRandom.mockReturnValueOnce(0);

      const newId = Favourites.generateFavouriteId([]);

      expect(newId).toBe('PRD001');
    });

    it('should generate a maximum id of PRD999', () => {
      mockRandom.mockReturnValue(0.99999999999);

      const newId = Favourites.generateFavouriteId([]);

      expect(newId).toBe('PRD999');
    });
  });

  describe('productAlreadyExist', ()=>{

    it('should return false if product do not already exits', () => {
      const newProduct = {
        species: 'New Atlantic COD',
        speciesCode: 'New COD',
        scientificName: 'New CODsdus',
        state: 'New FRE',
        stateLabel: 'New Fresh',
        presentation: 'New HEA',
        presentationLabel: 'New Headed',
        commodity_code: 'New 0980980808',
        commodity_code_description: 'New many words',
      };
      expect(Favourites.productAlreadyExist(newProduct,mockProducts)).toBeFalsy()
    });

    it('should return true if product do already exits', () => {
      expect(Favourites.productAlreadyExist(mockProducts[0],mockProducts)).toBeTruthy()
    });
  })
});

describe('canAddFavourite', () => {

  const userPrincipal = 'bob';
  let mockReadFavourites;

  beforeEach(() => {
    mockReadFavourites = jest.spyOn(Favourites, 'readFavouritesProducts');
    applicationConfig._maximumFavouritesPerUser = 2;
  });

  afterEach(() => {
    mockReadFavourites.mockRestore();
  });

  it('should return true if the user has no favourites', async () => {
    mockReadFavourites.mockResolvedValue(null);

    expect(await Favourites.canAddFavourite(userPrincipal)).toBe(true);
  });

  it('should return true if the user has less than the maximum number of favourites', async () => {
    mockReadFavourites.mockResolvedValue(['favourite 1']);

    expect(await Favourites.canAddFavourite(userPrincipal)).toBe(true);
  });

  it('should return false if the user already has the maximum number of favourites', async () => {
    mockReadFavourites.mockResolvedValue(['favourite 1', 'favourite 2']);

    expect(await Favourites.canAddFavourite(userPrincipal)).toBe(false);
  });

});