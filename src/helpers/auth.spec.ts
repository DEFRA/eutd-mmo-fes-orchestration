import applicationConfig from "../applicationConfig";
import { defineAuthStrategies } from "../helpers/auth";

describe("defineAuthStrategies", () => {
  afterEach(() => {
    applicationConfig._disableAuth = undefined;
  });

  it("should return null if auth is disabled", () => {
    applicationConfig._disableAuth = true;
    const result = defineAuthStrategies();
    expect(result).toBeNull();
  });

  it("should return auth array if auth is enabled", () => {
    const result = defineAuthStrategies();
    expect(result).toEqual({ strategies: ["fesApi", "jwt"] });
  });
});
