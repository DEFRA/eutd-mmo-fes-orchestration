import * as Hapi from "@hapi/hapi";
import FavouritesController from "./favourites.controller";
import * as Favourites from "../persistence/services/favourites";
import logger from '../logger';
import { getMaxFavouritesError } from "../routes/favourites";
import applicationConfig from "../applicationConfig";
import * as FishValidator from "../validators/fish.validator";


describe("FavouritesController", () => {
  const mockResponse = jest.fn();

  const h = {
    response: mockResponse,
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  beforeEach(() => {
    mockResponse.mockReset();
    mockResponse.mockReturnValue({
      code: (code) => ((h.response as any).statusCode = code),
    });
  });

  describe("addFavourites", () => {
    let request;
    let mockSaveFavouritesProduct;
    let mockCanAddFavourite;
    let mockGetReferenceServiceUrl;
    let mockValidateSpeciesWithReferenceData;

    beforeEach(() => {
      mockSaveFavouritesProduct = jest.spyOn(
        Favourites,
        "saveFavouritesProduct"
      );
      mockCanAddFavourite = jest.spyOn(
        Favourites,
        "canAddFavourite"
      );
      mockCanAddFavourite.mockResolvedValue(true);

      mockGetReferenceServiceUrl = jest.spyOn(
        applicationConfig ,
        'getReferenceServiceUrl'
      );
      mockGetReferenceServiceUrl.mockReturnValue('aUrlPath');

      mockValidateSpeciesWithReferenceData = jest.spyOn(
        FishValidator,
        'validateSpeciesWithReferenceData'
      );
      mockValidateSpeciesWithReferenceData.mockResolvedValue({
        isError: false,
        error: null,
      });

      request = {
        method: "POST",
        url: "/v1/favourites",
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          species: "COD",
          state: "FRESH",
          presentation: "WHOLE",
          commodity_code: "123456",
        },
      };
    });

    it("should call save product function with the correct params", async () => {
      mockSaveFavouritesProduct.mockResolvedValue(null);

      await FavouritesController.addFavourites(request, h);

      expect(mockSaveFavouritesProduct).toHaveBeenCalledTimes(1);
      expect(mockSaveFavouritesProduct).toHaveBeenCalledWith(
        request.app.claims.sub,
        request.payload
      );
    });

    it("should return 400 if use is duplicate (null) returned from saveFavouritesProduct", async () => {
      mockSaveFavouritesProduct.mockResolvedValue(null);

      await FavouritesController.addFavourites(request, h);

      expect((h.response as any).statusCode).toBe(400);
      expect(mockResponse).toHaveBeenCalledWith(["error.favourite.duplicate"]);
    });

    it("should return value returned from saveFavouritesProduct", async () => {
      mockSaveFavouritesProduct.mockResolvedValue([{ some: "data" }]);

      const result = await FavouritesController.addFavourites(request, h);

      expect(result).toEqual([{ some: "data" }]);
    });

    it("should return 400 if the can add favourite check fails", async () => {
      mockCanAddFavourite.mockResolvedValue(false);

      await FavouritesController.addFavourites(request, h);

      expect((h.response as any).statusCode).toBe(400);
      expect(mockResponse).toHaveBeenCalledWith(getMaxFavouritesError(applicationConfig._maximumFavouritesPerUser));
    });

    it('should call getReferenceServiceUrl', async () => {
      await FavouritesController.addFavourites(request, h);

      expect(mockGetReferenceServiceUrl).toHaveBeenCalled();
    });

    it('should call validateSpeciesWithReferenceData', async () => {
      await FavouritesController.addFavourites(request, h);

      expect(mockValidateSpeciesWithReferenceData).toHaveBeenCalled();
      expect(mockValidateSpeciesWithReferenceData).toHaveBeenCalledWith(request.payload,'aUrlPath');
    });

    it("should return 400 if species is invalid", async () => {
      mockValidateSpeciesWithReferenceData.mockResolvedValue({
        isError: true,
        error: 'an error',
      });

      await FavouritesController.addFavourites(request, h);

      expect((h.response as any).statusCode).toBe(400);
      expect(mockResponse).toHaveBeenCalledWith(['error.species.any.invalid']);
    });


  });

  describe("deleteFavouritesProduct", () => {
    let request;
    let mockDeleteFavouritesProduct;

    beforeEach(() => {
      mockDeleteFavouritesProduct = jest.spyOn(
        Favourites,
        "deleteFavouritesProduct"
      );
      request = {
        method: "DELETE",
        params: {
          productId: "PRD123",
        },
        url: "/v1/favourites",
        app: {
          claims: {
            sub: "Bob",
          },
        },
      };
    });

    it("should call deleteFavouritesProduct once with the right params", async () => {
      mockDeleteFavouritesProduct.mockResolvedValue(null);
      await FavouritesController.deleteFavouritesProduct(request, h);
      expect(mockDeleteFavouritesProduct).toHaveBeenCalledTimes(1);
      expect(mockDeleteFavouritesProduct).toHaveBeenCalledWith("Bob", "PRD123");
    });

    it("should return the service output", async () => {
      mockDeleteFavouritesProduct.mockResolvedValue([{ some: "data" }]);
      const result = await FavouritesController.deleteFavouritesProduct(
        request,
        h
      );
      expect(result).toEqual([{ some: "data" }]);
    });

  });

  describe("getFavourites", () => {
    const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
    const mockReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate" },
      payload: {
        redirect: "/redirect-url/{documentNumber}/redirect",
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        cancel: {},
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentationLabel: "Whole",
        stateLabel: "Fresh",
      },
      headers: { accept: "text/html" },
    };
    const h = {
      response: () => jest.fn(),
      redirect: () => jest.fn(),
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

    let mockRedirect: jest.SpyInstance;
    let mockGetFavourites: jest.SpyInstance;

    beforeAll(() => {
      mockRedirect = jest.spyOn(h, "redirect");
      mockRedirect.mockReturnValue(null);

      mockGetFavourites = jest.spyOn(Favourites, "readFavouritesProducts");
      mockGetFavourites.mockReturnValue(null);
    });

    it("should return a valid object if no products", async () => {
      const result = await FavouritesController.getFavourites(
        mockReq,
        h,
      );

      const expectedResult = [];
      expect(result).toEqual(expectedResult);
    });

    it("should return a list of favourites", async () => {
      mockGetFavourites.mockResolvedValue([{
        "id": "PRD942",
        "species": "Atlantic COD",
        "speciesCode": "COD",
        "scientificName": "THE COD",
        "state": "FRE",
        "stateLabel": "Fresh",
        "presentation": "HED",
        "presentationLabel": "Headed",
        "commodity_code": "21294949045",
        "commodity_code_description": "many letters here"
        }, {
        "species": "Atlantic COD 1",
        "speciesCode": "COD01",
        "scientificName": "THE COD 1",
        "state": "FRE",
        "stateLabel": "Fresh",
        "presentation": "HED",
        "presentationLabel": "Headed",
        "commodity_code": "21294949045",
        "commodity_code_description": "many letters here",
        "id": "PRD324"
        }]);

      const result = await FavouritesController.getFavourites(
        mockReq,
        h,
      );

      expect(result).toHaveLength(2);
    });
  });

  describe("removeInvalidFavouriteProduct", () => {
    const userPrincipal = 'Bob';
    const productId = 'PRD123';

    let mockRemoveInvalidFavouriteProduct;
    let mockErrorLogger;
    let mockInfoLogger;

    beforeEach(() => {
      mockRemoveInvalidFavouriteProduct = jest.spyOn(Favourites, "deleteFavouritesProduct");
      mockRemoveInvalidFavouriteProduct.mockResolvedValue(undefined);

      mockErrorLogger = jest.spyOn(logger, 'error');
      mockInfoLogger = jest.spyOn(logger, 'info');
    });

    afterEach(() => {
      mockRemoveInvalidFavouriteProduct.mockRestore();
      mockInfoLogger.mockRestore();
      mockErrorLogger.mockRestore();
    });

    it("should remove Invalid Favourite Product", async () => {
      await FavouritesController.removeInvalidFavouriteProduct(userPrincipal, productId);

      expect(mockRemoveInvalidFavouriteProduct).toHaveBeenCalledTimes(1);
      expect(mockRemoveInvalidFavouriteProduct).toHaveBeenCalledWith("Bob", "PRD123");
      expect(mockInfoLogger).toHaveBeenCalledWith(`[ADDING-SPECIES][REMOVE-INVALID-FAVOURITE][PRD123]`)
    });

    it("should catch any error thrown whilst removing an invalid favourite product", async () => {
      const error = new Error('some-error');

      mockRemoveInvalidFavouriteProduct.mockRejectedValue(error);
      await FavouritesController.removeInvalidFavouriteProduct(userPrincipal, productId);

      expect(mockErrorLogger).toHaveBeenCalledWith(`[ADDING-SPECIES][REMOVE-INVALID-FAVOURITE][ERROR][${error}]`);
    });

  });
});
