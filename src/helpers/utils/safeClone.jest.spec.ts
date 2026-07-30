import { safeClone } from "./safeClone";
import { ObjectId } from "mongodb";

describe("safeClone", () => {
  it("deep clones a plain object, decoupling nested objects and arrays from the original", () => {
    const original: any = { a: 1, nested: { b: 2, arr: [1, 2, { c: 3 }] } };
    const cloned = safeClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);
    expect(cloned.nested.arr).not.toBe(original.nested.arr);
    expect(cloned.nested.arr[2]).not.toBe(original.nested.arr[2]);

    cloned.nested.b = 99;
    cloned.nested.arr.push(4);
    expect(original.nested.b).toBe(2);
    expect(original.nested.arr).toEqual([1, 2, { c: 3 }]);
  });

  it("clones an object created with Object.create(null) as a plain object", () => {
    const original: any = Object.create(null);
    original.foo = "bar";

    const cloned = safeClone(original);

    expect(cloned).not.toBe(original);
    expect(cloned.foo).toBe("bar");
  });

  it("deep clones arrays, including nested arrays and array items", () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = safeClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
    expect(cloned[2]).not.toBe(original[2]);
  });

  it("returns non-plain objects (e.g. Date) by reference instead of cloning them", () => {
    const date = new Date();
    const cloned = safeClone({ date });

    expect(cloned.date).toBe(date);
  });

  it("returns class instances by reference instead of cloning them", () => {
    class Foo {
      value = "bar";
    }
    const instance = new Foo();

    const cloned = safeClone({ instance });

    expect(cloned.instance).toBe(instance);
  });

  it("preserves a MongoDB ObjectId by reference rather than corrupting it", () => {
    const id = new ObjectId();
    const cloned = safeClone({ _id: id });

    expect(cloned._id).toBe(id);
    expect(cloned._id).toBeInstanceOf(ObjectId);
  });

  it("returns primitive values, null and undefined unchanged", () => {
    expect(safeClone(5)).toBe(5);
    expect(safeClone("str")).toBe("str");
    expect(safeClone(true)).toBe(true);
    expect(safeClone(null)).toBeNull();
    expect(safeClone(undefined)).toBeUndefined();
  });
});
