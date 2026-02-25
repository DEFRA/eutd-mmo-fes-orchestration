import {IUserAttributes, UserAttributesModel} from '../schema/userAttributes';

import * as UserAttributes from './userAttributes';

import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('User Attribute services', () => {

  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";

  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});
  });

  afterEach(async() => {
    await UserAttributesModel.deleteMany({});
    UserAttributes.clearFindCacheForTests();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const mockUserAttributesEntry = {
    userPrincipal: USER_ID,
    attributes: [
      {name: "id", value: "user-id"},
      {name: "firstName", value: "user-first-name"},
    ],
    favourites: {
      products: [
        {
          id: 'PRD001',
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
  } as unknown as IUserAttributes;

  describe('find', () => {

    beforeEach(async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
    });

    it('should null if no entries are found for the given user id', async () => {
      const result = await UserAttributes.find("noExistingID");
      expect(result).toEqual(null);
    });

    it('should retrieve full object is no properties param is passed', async () => {
      const result = await UserAttributes.find(USER_ID);
      expect(result.userPrincipal).toEqual(mockUserAttributesEntry.userPrincipal);
      expect(result.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(result.favourites).toEqual(mockUserAttributesEntry.favourites);
    });

    it('should retrieve only __id property if properties param is mot found', async () => {
      const result = await UserAttributes.find(USER_ID,["noExists"]);

      expect(result._id).not.toBeNull();
      expect(result.userPrincipal).toEqual(undefined);
      expect(result.attributes).toEqual(undefined);
      expect(result.favourites).toEqual(undefined);
    });

    it('should retrieve only attributes object is no properties param is attributes', async () => {
      const result = await UserAttributes.find(USER_ID,["attributes"]);
      expect(result.userPrincipal).toEqual(undefined);
      expect(result.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(result.favourites).toEqual(undefined);
    });

    it('should retrieve only favourites object if properties param is favourites', async () => {
      const result = await UserAttributes.find(USER_ID,["favourites"]);
      expect(result.userPrincipal).toEqual(undefined);
      expect(result.attributes).toEqual(undefined);
      expect(result.favourites).toEqual(mockUserAttributesEntry.favourites);
    });

    it('should retrieve only propertiess in the properties param', async () => {
      const result = await UserAttributes.find(USER_ID,["favourites","attributes"]);
      expect(result.userPrincipal).toEqual(undefined);
      expect(result.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(result.favourites).toEqual(mockUserAttributesEntry.favourites);
    });

    it('should return cached result for repeated reads of same user and projection', async () => {
      const findOneSpy = jest.spyOn(UserAttributesModel, 'findOne');

      const first = await UserAttributes.find(USER_ID, ['attributes']);
      const second = await UserAttributes.find(USER_ID, ['attributes']);

      expect(first.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(second.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(findOneSpy).toHaveBeenCalledTimes(1);

      findOneSpy.mockRestore();
    });

  });

  describe('saveOrUpdateAttributes', () =>{

    it("should update attributes property when saving an existing attribute", async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
      await UserAttributes.saveOrUpdate(
        USER_ID,
        "id",
        "modified user-id"
      );
      const expectedResult = await UserAttributesModel.findOne({userPrincipal : USER_ID}).lean(true);

      expect(expectedResult.attributes.length).toEqual(2);
      expect(expectedResult.attributes[0].modifiedAt).not.toBeNull();
      expect(expectedResult.attributes[0].name).toEqual(mockUserAttributesEntry.attributes[0].name);
      expect(expectedResult.attributes[0].value).toEqual("modified user-id");
      expect(expectedResult.attributes[1]).toEqual(mockUserAttributesEntry.attributes[1]);
    });

    it("should keep exiting favourites property when saving an attribute", async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
      await UserAttributes.saveOrUpdate(
        USER_ID,
        "id",
        "modified user-id"
      );
      const expectedResult = await UserAttributesModel.findOne({userPrincipal : USER_ID}).lean(true);

      expect(expectedResult.favourites).toEqual(mockUserAttributesEntry.favourites);
    });

    it("should add new attribute when saving an non existing attribute", async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
      await UserAttributes.saveOrUpdate(
        USER_ID,
        "new-Attribute",
        "new-value"
      );
      const expectedResult = await UserAttributesModel.findOne({userPrincipal : USER_ID}).lean(true);

      expect(expectedResult.attributes.length).toEqual(3);
      expect(expectedResult.attributes[0]).toEqual(mockUserAttributesEntry.attributes[0]);
      expect(expectedResult.attributes[1]).toEqual(mockUserAttributesEntry.attributes[1]);
      expect(expectedResult.attributes[2].modifiedAt).not.toBeNull();
      expect(expectedResult.attributes[2].name).toEqual("new-Attribute");
      expect(expectedResult.attributes[2].value).toEqual("new-value");
    });

    it("should create a new  userAttributes entry when saving first attribute", async () => {
      await UserAttributes.saveOrUpdate(
        USER_ID,
        "first-attribute",
        "first-attribute"
      );
      const expectedResult = await UserAttributesModel.findOne({userPrincipal : USER_ID}).lean(true);

      expect(expectedResult.attributes.length).toEqual(1);
      expect(expectedResult.attributes[0].modifiedAt).not.toBeNull();
      expect(expectedResult.attributes[0].name).toEqual("first-attribute");
      expect(expectedResult.attributes[0].value).toEqual("first-attribute");
    });

    it("should return user attributes when saving an existing attribute", async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
      const result = await UserAttributes.saveOrUpdate(
        USER_ID,
        "id",
        "modified user-id"
      );

      expect(result.length).toEqual(2);
      expect(result[0].modifiedAt).not.toBeNull();
      expect(result[0].name).toEqual(mockUserAttributesEntry.attributes[0].name);
      expect(result[0].value).toEqual("modified user-id");
      expect(result[1]).toEqual(mockUserAttributesEntry.attributes[1]);
    });

    it("should save and return user attributes when saving an non existing attribute", async () => {
      await new UserAttributesModel(mockUserAttributesEntry).save();
      const result = await UserAttributes.saveOrUpdate(
        USER_ID,
        "new-Attribute",
        "new-value"
      );

      expect(result.length).toEqual(3);
      expect(result[0]).toEqual(mockUserAttributesEntry.attributes[0]);
      expect(result[1]).toEqual(mockUserAttributesEntry.attributes[1]);
      expect(result[2].modifiedAt).not.toBeNull();
      expect(result[2].name).toEqual("new-Attribute");
      expect(result[2].value).toEqual("new-value");
    });

    it("should save and return user attributes when saving when the userAttributes entry do no exist", async () => {
      const result = await UserAttributes.saveOrUpdate(
        USER_ID,
        "first-attribute",
        "first-attribute"
      );

      expect(result.length).toEqual(1);
      expect(result[0].modifiedAt).not.toBeNull();
      expect(result[0].name).toEqual("first-attribute");
      expect(result[0].value).toEqual("first-attribute");
    });

  });

  describe('save', ()=> {

    it('should save user attribute object', async () => {
      await UserAttributes.save(mockUserAttributesEntry);
      const result = await UserAttributesModel.findOne({userPrincipal : USER_ID}).lean(true);
      expect(result._id).toBeTruthy();
      expect(result.userPrincipal).toEqual(mockUserAttributesEntry.userPrincipal);
      expect(result.attributes).toEqual(mockUserAttributesEntry.attributes);
      expect(result.favourites).toEqual(mockUserAttributesEntry.favourites);
    });
  });
});
