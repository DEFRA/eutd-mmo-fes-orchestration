import applicationConfig from "../applicationConfig";
import { defineAuthStrategies, isRequestByAdmin } from "../helpers/auth";

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

describe("isRequestByAdmin", () => {
  it.each([
    "MMO-ECC-Service-Management",
    "MMO-ECC-Support-User",
    "MMO-ECC-IUU-Single-Liaison-Officer",
    "MMO-ECC-Regulatory-User",
  ])("returns true for the %s role", (role: string) => {
    expect(isRequestByAdmin([role])).toBe(true);
  });

  it("returns false when roles are undefined", () => {
    expect(isRequestByAdmin(undefined)).toBe(false);
  });

  it("returns false when no admin role is present", () => {
    expect(isRequestByAdmin(["MMO-ECC-User"])).toBe(false);
  });
});
