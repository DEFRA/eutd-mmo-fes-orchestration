import FishController from "./fish.controller";

describe("FishController.augmentProductDetails()", () => {
  it("should return a valid product", async () => {
    const mockData = {
      id: "1",
      state: "Frozen (FRO)",
      presentation: "Gutted (GUT)",
      species: "COD",
      speciesLabel: "Atlantic COD",
      commodityCode: "commodityCode",
    };

    const result = await FishController.augmentProductDetails(mockData);

    const expectedReturn = {
      "commodityCode": undefined,
      "id": "1",
      "presentation": {
        "code": "Gutted (GUT)"
      },
      "species": {
        "code": "",
        "label": "COD"
      },
      "state": {
        "code": "Frozen (FRO)"
      }
    };
    expect(result).toEqual(expectedReturn);
  });
});
