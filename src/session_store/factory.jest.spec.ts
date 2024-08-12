import { SessionStoreFactory } from "./factory";

describe("SessionStoreFactory", () => {
  describe("getSessionStore()", () => {
    it("should return an initialized store", async () => {
      const result = await SessionStoreFactory.getSessionStore(null);
      expect(result).toEqual({ store: {} });
    });
  });
});
