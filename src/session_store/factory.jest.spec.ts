import { SessionStoreFactory } from "./factory";

describe("SessionStoreFactory", () => {
  describe("getSessionStore()", () => {
    it("should return an initialized store", async () => {
      const result = await SessionStoreFactory.getSessionStore(null);
      expect(result).toEqual({ store: {} });
    });

    it("should return a promise", () => {
      expect(SessionStoreFactory.getSessionStore(null)).toBeInstanceOf(Promise);
    });

    it("should return the same store instance on subsequent calls", async () => {
      const first = await SessionStoreFactory.getSessionStore(null);
      const second = await SessionStoreFactory.getSessionStore(null);

      expect(second).toBe(first);
    });
  });
});
