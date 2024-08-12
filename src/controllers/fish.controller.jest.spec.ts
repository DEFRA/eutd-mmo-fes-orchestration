import * as Hapi from "@hapi/hapi";
import ExportPayloadService from "../services/export-payload.service";
import ExportPayloadController from "./export-payload.controller";
import FishController from "./fish.controller";
import Services from "../services/fish.service";
import { Product } from '../persistence/schema/frontEndModels/species';
import * as FavouritesService from "../persistence/services/favourites"

import logger from '../logger';
import { IProduct } from "../persistence/schema/userAttributes";

describe("FishController", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";
  const CONTACT_ID = 'contactBob';

  let mockReq: any;

  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;
  const mockItems = { items: ["foo", "bar"] };

  let mockRedirect: jest.SpyInstance;
  let mockRemoveFish: jest.SpyInstance;
  let mockAddFish: jest.SpyInstance;
  let mockEditFish: jest.SpyInstance;
  let mockExportPayloadServiceGet: jest.SpyInstance;
  let mockExportPayloadServiceSave: jest.SpyInstance;
  let mockRemovePayloadProduct: jest.SpyInstance;
  let mockAugmentProductDetails: jest.SpyInstance;
  let mockAddPayloadProduct: jest.SpyInstance;
  let mockSaveFavouritesProduct: jest.SpyInstance;
  let mockServicesIsDuplicate: jest.SpyInstance;

  beforeEach(() => {

    mockReq = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate" },
      payload: {
        redirect: undefined,
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        cancel: undefined,
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        state: "FRE",
        stateLabel: "Fresh",
        species: "Atlantic cod",
        addToFavourites : true
      },
      headers: { accept: "text/html" },
    };

    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);

    mockRemoveFish = jest.spyOn(Services, "removeFish");
    mockRemoveFish.mockReturnValue(null);

    mockAddFish = jest.spyOn(Services, "addFish");
    mockAddFish.mockReturnValue(null);

    mockEditFish = jest.spyOn(Services, "editFish");
    mockEditFish.mockReturnValue(null);

    mockExportPayloadServiceGet = jest.spyOn(ExportPayloadService, "get");
    mockExportPayloadServiceGet.mockReturnValue(mockItems);

    mockExportPayloadServiceSave = jest.spyOn(ExportPayloadService, "save");
    mockExportPayloadServiceSave.mockReturnValue(null);

    mockAugmentProductDetails = jest.spyOn(
      FishController,
      "augmentProductDetails"
    );
    mockAugmentProductDetails.mockReturnValue(null);

    mockAddPayloadProduct = jest.spyOn(
      ExportPayloadController,
      "addPayloadProduct"
    );
    mockAddPayloadProduct.mockReturnValue({ items: ["Foo"] });

    mockRemovePayloadProduct = jest.spyOn(
      ExportPayloadController,
      "removePayloadProduct"
    );
    mockRemovePayloadProduct.mockReturnValue({ items: [] });

    mockSaveFavouritesProduct = jest.spyOn(FavouritesService, 'saveFavouritesProduct');
    mockSaveFavouritesProduct.mockResolvedValue(null);

    mockServicesIsDuplicate = jest.spyOn(Services, "isDuplicate");
    mockServicesIsDuplicate.mockResolvedValue(false);
  });

  afterEach(()=> {
    jest.restoreAllMocks();
  });

  describe("addFish()", () => {
    it("should redirect to redirectUri", async () => {
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";
      await FishController.addFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.redirect);
    });

    it("should return a valid object", async () => {

      const result = await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {
        commodity_code: mockReq.payload.commodity_code,
        commodity_code_description: mockReq.payload.commodity_code_description,
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return addedToFavourites as true if successful", async () => {
      mockAddFish.mockReturnValue({some : 'data'});
      mockSaveFavouritesProduct.mockResolvedValue([{some: 'products'}]);
      delete mockReq.payload.cancel;
      const result = await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {
        some : 'data',
        addedToFavourites : true
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return addedToFavourites as false if not successful", async () => {
      mockAddFish.mockReturnValue({some : 'data'});
      mockSaveFavouritesProduct.mockResolvedValue(null);
      delete mockReq.payload.cancel;
      const result = await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {
        some : 'data',
        addedToFavourites : false
      };
      expect(result).toEqual(expectedResult);
    });

    it("should no call saveFavouritesProduct if addToFavourites is not present", async () => {
      delete mockReq.payload.addToFavourites;

      await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).not.toHaveBeenCalled();
    });

    it("should no call saveFavouritesProduct if addFish fail", async () => {
      mockAddFish.mockRejectedValue(new Error('an error'));
      await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).not.toHaveBeenCalled();
    });

    it("should no call saveFavouritesProduct if addFish return null", async () => {
      await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).not.toHaveBeenCalled();

    });

     it("should call saveFavouritesProduct if addToFavourites is present", async () => {
      delete mockReq.payload.cancel;
      mockAddFish.mockReturnValue({some : 'data'});
      mockReq.payload.addToFavourites = true;

      const expected: IProduct = {
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        scientificName: undefined,
        species: "Atlantic cod",
        speciesCode: undefined,
        state: "FRE",
        stateLabel: "Fresh",
      }

      await FishController.addFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).toHaveBeenCalledWith(USER_ID, expected);
    });

    it("should inform addFish service that added product is from favourites", async () => {
      const expectedProduct = {
        species: "Atlantic cod",
        state: "FRE",
        stateLabel: "Fresh",
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        user_id: USER_ID
      }

      const mockReqWithFavourites = { ...mockReq };
      mockReqWithFavourites.payload = {
        redirect: undefined,
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        state: "FRE",
        stateLabel: "Fresh",
        species: "Atlantic cod",
        isFavourite: true
      }

      await FishController.addFish(
        mockReqWithFavourites,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockAddFish).toHaveBeenCalledWith(expectedProduct, DOCUMENT_NUMBER, CONTACT_ID, true);
    });

    it("should redirect to url when payload.cancel is missing and Services.isDuplicate returns true", async () => {
      mockServicesIsDuplicate.mockResolvedValue(true);
      delete mockReq.payload.cancel;
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";

      await FishController.addFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      const expectedParam =
        '/redirect-url/{documentNumber}/redirect?error=["ccProductFavouritesPageErrorDuplicate"]';
      expect(mockRedirect).toHaveBeenCalledWith(expectedParam);
    });

    it("should redirect to url when payload.cancel is missing and Services.isDuplicate returns false", async () => {
      delete mockReq.payload.cancel;
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";

      await FishController.addFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      const expectedRedirectUrl = "/redirect-url/{documentNumber}/redirect";
      expect(mockRedirect).toHaveBeenCalledWith(expectedRedirectUrl);
    });
  });

  describe("editFish()", () => {
    const productsArray = [{
      user_id: "Bob",
      id: 1234,
      species: "HER",
      state: "Fresh",
      presentation: "Filleted",
      commodity_code: "12345678",
      commodity_code_description: "some-description",
    },
    {
      commodity_code: "commodity-code",
      commodity_code_description: "commodity-code-description",
      presentation: "WHO",
      presentationLabel: "Whole",
      species: "Atlantic cod",
      state: "FRE",
      stateLabel: "Fresh",
      user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    }]

    beforeEach(()=> {
      mockReq = {
        app: { claims: { sub: "test", email: "test@test.com" } },
        params: { documentType: "catchCertificate" },
        payload: {
          redirect: undefined,
          user_id: USER_ID,
          commodity_code: "commodity-code",
          commodity_code_description: "commodity-code-description",
          presentation: "WHO",
          presentationLabel: "Whole",
          state: "FRE",
          stateLabel: "Fresh",
          species: "Atlantic cod",
          addToFavourites : true
        },
        headers: { accept: "text/html" },
      };
    })

    it("should redirect to redirectUri", async () => {
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";
      await FishController.editFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.redirect);
    });

    it("should return a valid object", async () => {
      delete mockReq.payload.redirect;

      mockEditFish.mockResolvedValue(productsArray);
      const result = await FishController.editFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );
      const expectedResult = {
        favourite: {
          addedToFavourites: false,
          commodity_code: "commodity-code",
          commodity_code_description: "commodity-code-description",
          presentation: "WHO",
          presentationLabel: "Whole",
          species: "Atlantic cod",
          state: "FRE",
          stateLabel: "Fresh",
          user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        },
        products: productsArray,
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return addedToFavourites as true if successful after editing", async () => {
      delete mockReq.payload.redirect;

      mockEditFish.mockResolvedValue(productsArray);
      mockSaveFavouritesProduct.mockResolvedValue([{data: 'products'}]);

      const result = await FishController.editFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {
        favourite: {
          addedToFavourites: true,
          commodity_code: "commodity-code",
          commodity_code_description: "commodity-code-description",
          presentation: "WHO",
          presentationLabel: "Whole",
          species: "Atlantic cod",
          state: "FRE",
          stateLabel: "Fresh",
          user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        },
        products: productsArray,
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return addedToFavourites as false if not successful after editing", async () => {
      delete mockReq.payload.redirect;
      mockEditFish.mockReturnValue([
        {
          user_id: "Bob",
          id: 1234,
          species: "HER",
          state: "Fresh",
          presentation: "Filleted",
          commodity_code: "12345678",
          commodity_code_description: "some-description",
        }
      ]);
      mockSaveFavouritesProduct.mockResolvedValue(null);
      const result = await FishController.editFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      const expectedResult = {
        products : [
          {
            user_id: "Bob",
            id: 1234,
            species: "HER",
            state: "Fresh",
            presentation: "Filleted",
            commodity_code: "12345678",
            commodity_code_description: "some-description",
          }
        ],
        favourite: {
          addedToFavourites: false,
          commodity_code: "commodity-code",
          commodity_code_description: "commodity-code-description",
          presentation: "WHO",
          presentationLabel: "Whole",
          species: "Atlantic cod",
          state: "FRE",
          stateLabel: "Fresh",
          user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        },
      };
      expect(result).toEqual(expectedResult);
    });

    it("should not call saveFavouritesProduct if addToFavourites is not present", async () => {
      delete mockReq.payload.addToFavourites;

      await FishController.editFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).not.toHaveBeenCalled();
    });

    it("should not call saveFavouritesProduct if editFish returns null", async () => {
      await FishController.editFish(
        mockReq,
        h,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockSaveFavouritesProduct).not.toHaveBeenCalled();
    });

    it("should redirect to url when Services.isDuplicate returns true", async () => {
      mockServicesIsDuplicate.mockResolvedValue(true);
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";

      await FishController.editFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      const expectedParam = '/redirect-url/{documentNumber}/redirect?error=["ccProductFavouritesPageErrorDuplicate"]';
      expect(mockRedirect).toHaveBeenCalledWith(expectedParam);
    });

    it("should redirect to url when Services.isDuplicate returns false", async () => {
      mockReq.payload.redirect = "/redirect-url/{documentNumber}/redirect";

      await FishController.editFish(mockReq, h, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

      const expectedParam = "/redirect-url/{documentNumber}/redirect";
      expect(mockRedirect).toHaveBeenCalledWith(expectedParam);
    });
  });

  describe("syncSpeciesAndLandings()", () => {
    const mockSpecies: Product[] = [
      {
        id:'some-id',
        user_id: 'some-user-id',
        commodity_code: "COD",
        commodity_code_description: "some description",
        species: "Atlantic COD",
      },
    ];

    const mockPayload = {
      items: [
        {
          product: {
            id: "1",
            state: {
              code: "FRO",
              label: "Frozen",
            },
            presentation: {
              code: "GUT",
              label: "Gutted",
            },
            species: {
              code: "COD",
              label: "Atlantic COD",
            },
            commodityCode: "commodityCode",
            commodityCodeDescription: "some description"
          },
        },
      ],
    };

    it("should return a truthy value", async () => {
      const result = await FishController.syncSpeciesAndLandings(
        USER_ID,
        mockSpecies,
        mockPayload,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(result).toBeTruthy();
    });

    it("should return a truthy value  with no export payload", async () => {
      const result = await FishController.syncSpeciesAndLandings(
        USER_ID,
        mockSpecies,
        null,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(result).toBeTruthy();
    });
  });

  describe("removeInCompleteSpecies", () => {

    let mockRemoveFish: jest.SpyInstance;
    let mockLoggerInfo: jest.SpyInstance;
    let mockLoggerError: jest.SpyInstance;

    beforeEach(() => {
      mockRemoveFish = jest.spyOn(Services, "removeFish");
      mockRemoveFish.mockReturnValue(null);

      mockLoggerInfo = jest.spyOn(logger, 'info');
      mockLoggerError = jest.spyOn(logger, 'error');
    });

    afterEach(() => {
      mockRemoveFish.mockRestore();

      mockLoggerInfo.mockRestore();
      mockLoggerError.mockRestore();
    });

    it('should remove species which are partially complete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).toHaveBeenCalledWith('[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id]');
      expect(mockRemoveFish).toHaveBeenCalled();
      expect(mockRemoveFish).toHaveBeenCalledWith({
        user_id: USER_ID,
        cancel: 'some-id',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(result).toBeTruthy();
    });

    it('should not remove species which are complete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id',
          presentation: "FIS",
          presentationLabel: "Filleted and skinned",
          state: "FRO",
          stateLabel: "Frozen",
          commodity_code: "03047190",
          commodity_code_description: "Frozen fillets of cod \"Gadus morhua, Gadus ogac\""
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockRemoveFish).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should not remove species which are without commodity code descriptions', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id',
          presentation: "FIS",
          presentationLabel: "Filleted and skinned",
          state: "FRO",
          stateLabel: "Frozen",
          commodity_code: "03047190"
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockRemoveFish).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should remove only species which are partially complete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id-1',
          scientificName: "Clupea harengus",
          species: "Atlantic herring (HER)",
          speciesCode: "HER",
          user_id: 'some-user-id'
        },
        {
          caughtBy: [],
          id:'some-id-2',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id',
          presentation: "FIS",
          presentationLabel: "Filleted and skinned",
          state: "FRO",
          stateLabel: "Frozen",
          commodity_code: "03047190",
          commodity_code_description: "Frozen fillets of cod \"Gadus morhua, Gadus ogac\""
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).toHaveBeenCalledWith('[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id-1]');
      expect(mockRemoveFish).toHaveBeenCalledWith({
        user_id: USER_ID,
        cancel: 'some-id-1',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should remove only the 2nd species which is partially complete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id-1',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id',
          presentation: "FIS",
          presentationLabel: "Filleted and skinned",
          state: "FRO",
          stateLabel: "Frozen",
          commodity_code: "03047190",
          commodity_code_description: "Frozen fillets of cod \"Gadus morhua, Gadus ogac\""
        },
        {
          caughtBy: [],
          id:'some-id-2',
          scientificName: "Clupea harengus",
          species: "Atlantic herring (HER)",
          speciesCode: "HER",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockRemoveFish).toHaveBeenCalledWith({
        user_id: USER_ID,
        cancel: 'some-id-2',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should remove all species which is partially complete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id-1',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id',
        },
        {
          caughtBy: [],
          id:'some-id-2',
          scientificName: "Clupea harengus",
          species: "Atlantic herring (HER)",
          speciesCode: "HER",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id-1]');
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id-2]');
      expect(mockRemoveFish).toHaveBeenNthCalledWith(1, {
        user_id: USER_ID,
        cancel: 'some-id-1',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenNthCalledWith(2, {
        user_id: USER_ID,
        cancel: 'some-id-2',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenCalledTimes(2);
      expect(result).toBeTruthy();
    });

    it('should remove all species which are completely incomplete', async () => {
      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id-1',
          user_id: 'Bob'
        },
        {
          caughtBy: [],
          id:'some-id-2',
          scientificName: "Clupea harengus",
          species: "Atlantic herring (HER)",
          speciesCode: "HER",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id-1]');
      expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][SPECIES-ID][some-id-2]');
      expect(mockRemoveFish).toHaveBeenNthCalledWith(1, {
        user_id: USER_ID,
        cancel: 'some-id-1',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenNthCalledWith(2, {
        user_id: USER_ID,
        cancel: 'some-id-2',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenCalledTimes(2);
      expect(result).toBeTruthy();
    });


    it('should catch any errors thrown whilst removing species', async () => {
      const error: Error = new Error('something-bad-has-happened');
      mockRemoveFish.mockRejectedValue(error);

      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(result).toBeUndefined();
      expect(mockLoggerError).toHaveBeenCalledWith(`[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][ERROR][${error.stack}]`)
    });

    it('should catch text errors thrown whilst removing species', async () => {
      const error: string = 'something-bad-has-happened';
      mockRemoveFish.mockRejectedValue(error);

      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(result).toBeUndefined();
      expect(mockLoggerError).toHaveBeenCalledWith('[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][ERROR][something-bad-has-happened]')
    });

    it('should catch all errors thrown whilst removing species', async () => {
      const error: string = 'something-bad-has-happened';
      mockRemoveFish
        .mockReturnValue(null)
        .mockRejectedValue(error);

      const mockSpecies: Product[] = [
        {
          caughtBy: [],
          id:'some-id-1',
          scientificName: "Gadus morhua",
          species: "Atlantic cod (COD)",
          speciesCode: "COD",
          user_id: 'some-user-id'
        },
        {
          caughtBy: [],
          id:'some-id-2',
          scientificName: "Clupea harengus",
          species: "Atlantic herring (HER)",
          speciesCode: "HER",
          user_id: 'some-user-id'
        }
      ];

      const result = await FishController.removeInCompleteSpecies(USER_ID, DOCUMENT_NUMBER, mockSpecies, CONTACT_ID);

      expect(result).toBeUndefined();
      expect(mockRemoveFish).toHaveBeenNthCalledWith(1, {
        user_id: USER_ID,
        cancel: 'some-id-1',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenNthCalledWith(2, {
        user_id: USER_ID,
        cancel: 'some-id-2',
      }, DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockRemoveFish).toHaveBeenCalledTimes(2);
      expect(mockLoggerError).toHaveBeenCalledWith('[REMOVE-INCOMPLETE-SPECIES][DOCUMENT-NUMBER][ERROR][something-bad-has-happened]')
    });

  });

  describe("validate", () => {

    let mockHasFish: jest.SpyInstance;
    let mockResponse: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;
    let mockCode: jest.Mock;
    let mockRedirect: jest.Mock;

    beforeEach(() => {
      mockCode = jest.fn();
      mockRedirect = jest.fn();
      mockHasFish = jest.spyOn(Services, "hasFish");
      mockResponse = {
        response: () => ({
          code: mockCode
        }),
        redirect: mockRedirect,
      } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;
    });

    afterEach(() => {
      mockHasFish.mockRestore();
      jest.restoreAllMocks();
    });

    it('should invalidate request that does not have at least one product', async () => {
      mockHasFish.mockResolvedValue(false);

      await FishController.validate(
        {
          app: { claims: { sub: "test", email: "test@test.com" } },
          params: { documentType: "catchCertificate" },
          payload: {
            redirect: "/test-url/{documentNumber}/test",
          },
          headers: { accept: false },
        } as unknown as Hapi.Request<Hapi.ReqRefDefaults>,
        mockResponse,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockCode).toHaveBeenCalledWith(400);
    });

    it('should validate request that have at least one product', async () => {
      mockHasFish.mockResolvedValue(true);

      await FishController.validate(
        mockReq,
        mockResponse,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockHasFish).toHaveBeenCalledWith(USER_ID,DOCUMENT_NUMBER, CONTACT_ID);
      expect(mockCode).toHaveBeenCalledWith(200);
    });

    it("should redirect to payload.nextUri when acceptsHtml returns true", async () => {
      mockHasFish.mockResolvedValue(false);

      await FishController.validate(
        {
          app: { claims: { sub: "test", email: "test@test.com" } },
          params: { documentType: "catchCertificate" },
          payload: {
            redirect: "/test-url/{documentNumber}/test",
          },
          headers: { accept: "text/html" },
        } as unknown as Hapi.Request<Hapi.ReqRefDefaults>,
        mockResponse,
        USER_ID,
        DOCUMENT_NUMBER,
        CONTACT_ID
      );

      expect(mockRedirect).toHaveBeenCalledWith('/test-url/{documentNumber}/test?error=["ccWhatExportingFromAtleastOneProductError"]');
    });
  });
});
