import * as jsonfile from "jsonfile";

const sinon = require("sinon");
import CommodityService from "./commodity.service";

describe("CatchService.searchCC", () => {
  it("should return an array of commodity codes", async () => {
    const result = await CommodityService.searchCC();
    expect(Array.isArray(result)).toBeTruthy();
  });

  it("should thrown an error if commodity codes cannot be read", async () => {
    const mockJsonFile = sinon.stub(jsonfile, "readFile").yields(new Error("a"));
    let error;
    try {
      await CommodityService.searchCC();
    } catch (e) {
      error = e;
    }
    mockJsonFile.restore();
    expect(error).toBeTruthy();
    expect(error.message).toBe("Cannot readAll commodity codes");
  });
});
